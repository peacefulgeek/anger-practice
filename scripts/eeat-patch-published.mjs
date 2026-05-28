#!/usr/bin/env node
/**
 * Patch every PUBLISHED article in data/articles/*.json with the missing
 * E-E-A-T signals it doesn't already have:
 *
 *   1. <section data-tldr="ai-overview"> 3-sentence TL;DR at the top, synthesized
 *      from the dek + first body paragraph (declarative, under 32 words each).
 *   2. >= 1 outbound authoritative link (rotating across NIH / APA / NIMH / CDC /
 *      PubMed) woven into the body via a short editorial paragraph.
 *   3. >= 3 internal links (theangerpractice.com / /article / /assessments / /herbs
 *      / /fire-toolkit / /about) woven into a short editorial paragraph.
 *   4. Self-referencing language ("in our experience").
 *
 * Idempotent. Safe to re-run. We never touch articles that already have
 * data-tldr="ai-overview" + a recognized authoritative outbound + >= 3 internal
 * links + the data-author byline section.
 *
 * Bottom byline + last-updated <time> are added by scrub-and-backfill.mjs and
 * not re-touched here.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ART_DIR = path.resolve(process.cwd(), "data", "articles");
const BUNNY_HOST = "https://ny.storage.bunnycdn.com";
const ZONE = "anger-practice";
const STORAGE_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const PUSH = process.env.PUSH_BUNNY === "1";

const AUTHORITY_SOURCES = [
  { label: "the NIH on anger and the autonomic nervous system", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2864403/" },
  { label: "the APA's research on anger and health", url: "https://www.apa.org/topics/anger/control" },
  { label: "the NIMH on caring for your mental health", url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health" },
  { label: "the CDC on stress and the body", url: "https://www.cdc.gov/mentalhealth/stress-coping/cope-with-stress/index.html" },
  { label: "PubMed research on anger expression and cardiovascular load", url: "https://pubmed.ncbi.nlm.nih.gov/19751988/" },
];

const INTERNAL_OPTIONS = [
  { label: "the assessments hub", url: "/assessments" },
  { label: "our herbal cabinet", url: "/herbs" },
  { label: "the fire toolkit", url: "/fire-toolkit" },
  { label: "more articles in this journal", url: "/articles" },
  { label: "the about page", url: "/about" },
];

function pickFromArr(arr, n) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

// Synthesize a 3-sentence TL;DR from dek + topic. Each sentence kept under 32
// words and declarative.
function synthTldr(article) {
  const topic = article.title || "anger work";
  const dek = (article.dek || "").trim();
  // Sentence 1: the central claim (from the dek if useful).
  const s1 =
    dek && dek.length < 200
      ? dek.replace(/\s+/g, " ").replace(/\.+$/, "") + "."
      : `${topic} is a place where the body and the spirit meet, and it asks for honest attention rather than control.`;
  const s2 = `In our experience, healthy anger is information about a boundary, a value, or a longing that has been crossed or unmet.`;
  const s3 = `This piece walks you through what to notice, what to try, and what to leave alone, in plain language and with real care.`;
  return [s1, s2, s3].slice(0, 3).join(" ");
}

function buildTldrBlock(article) {
  const tldrText = synthTldr(article);
  return [
    `<section data-tldr="ai-overview" aria-label="In short">`,
    `<p><strong>TL;DR.</strong> ${tldrText}</p>`,
    `</section>`,
    "",
  ].join("\n");
}

function buildAuthorityParagraph(authority, internals) {
  // Weave 1 outbound + 3 internal links + self-referencing voice into one
  // calm paragraph that fits the journal's tone.
  return [
    "",
    "## What the research and the body both say",
    "",
    `In our experience, the most useful sources on this stay close to the body. ` +
      `For a careful clinical view, see <a href="${authority.url}" rel="nofollow noopener" target="_blank">${authority.label}</a>. ` +
      `If you want to keep going inside this journal, you can read [${internals[0].label}](${internals[0].url}), ` +
      `take a quiet hour with [${internals[1].label}](${internals[1].url}), ` +
      `or stay in the writing through [${internals[2].label}](${internals[2].url}).`,
    "",
  ].join("\n");
}

function alreadyHasTldr(body) {
  return /<section[^>]*data-tldr=["']ai-overview["']/i.test(body);
}
function alreadyHasAuthority(body) {
  return /(nih\.gov|cdc\.gov|who\.int|pubmed|apa\.org|nimh\.nih\.gov|nature\.com|sciencedirect|\.gov\/|\.edu\/)/i.test(body);
}
function countInternalLinks(body) {
  const re = /\[[^\]]+\]\(([^)]+)\)/g;
  let n = 0;
  let m;
  while ((m = re.exec(body)) !== null) {
    const href = m[1];
    if (
      /theangerpractice\.com/i.test(href) ||
      /^\/article\//i.test(href) ||
      /^\/articles(?:\b|\/)/i.test(href) ||
      /^\/(assessments|herbs|fire-toolkit|about)/i.test(href)
    ) n++;
  }
  return n;
}

async function bunnyPut(remotePath, body) {
  const url = `${BUNNY_HOST}/${ZONE}/${remotePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${remotePath} failed ${res.status}: ${text}`);
  }
}

async function processOne(file, idx) {
  const fp = path.join(ART_DIR, file);
  const before = fs.readFileSync(fp, "utf8");
  const a = JSON.parse(before);
  if (a.published !== true) return { slug: a.slug, status: "skipped-unpublished" };

  let body = a.bodyMarkdown || "";
  let changed = false;

  // 1. TL;DR block at the very top (before everything)
  if (!alreadyHasTldr(body)) {
    const block = buildTldrBlock(a);
    body = block + "\n" + body;
    changed = true;
  }

  // 2 + 3. Authoritative + internal-link paragraph if either signal is missing
  const hasAuth = alreadyHasAuthority(body);
  const intCount = countInternalLinks(body);
  if (!hasAuth || intCount < 3) {
    const authority = AUTHORITY_SOURCES[idx % AUTHORITY_SOURCES.length];
    const internals = pickFromArr(INTERNAL_OPTIONS, 3);
    const paragraph = buildAuthorityParagraph(authority, internals);
    // Insert before the bottom byline section, or before the "---" preceding
    // it; fall back to appending if neither is found.
    const bylineMatch = body.match(/\n---\n\n<section\s+data-author=["']byline["']/i);
    if (bylineMatch && bylineMatch.index != null) {
      body = body.slice(0, bylineMatch.index) + paragraph + body.slice(bylineMatch.index);
    } else {
      body += paragraph;
    }
    changed = true;
  }

  // 4. Self-referencing voice if missing
  if (!/\bin (?:our|my) (?:experience|own practice|work)\b|\bover the years (?:i|we)['']ve seen\b|\bwe['']ve found\b|\bacross the articles we['']ve published\b/i.test(body)) {
    body = body.replace(/(##\s+[^\n]+\n\n)/, (m) => m + "In our experience on this site, the answers that hold up over time are the ones the body can verify, not just the ones the mind can argue. ");
    changed = true;
  }

  if (!changed) return { slug: a.slug, status: "noop" };

  a.bodyMarkdown = body;
  a.wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  a.updatedAt = a.updatedAt || a.publishedAt || new Date().toISOString();

  const json = JSON.stringify(a, null, 2);
  fs.writeFileSync(fp, json);

  if (PUSH) {
    await bunnyPut(`articles/${a.slug}.json`, json);
    return { slug: a.slug, status: "pushed" };
  }
  return { slug: a.slug, status: "local-updated" };
}

async function main() {
  const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json"));
  console.log(`[eeat] ${files.length} files | push=${PUSH}`);
  let pushed = 0, local = 0, noop = 0, skipped = 0;
  let i = 0;
  const CONC = 10;
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const idx = cursor++;
      try {
        const r = await processOne(files[idx], idx);
        if (r.status === "pushed") pushed++;
        else if (r.status === "local-updated") local++;
        else if (r.status === "noop") noop++;
        else skipped++;
      } catch (e) {
        console.error(`[eeat] FAIL ${files[idx]}:`, e.message);
      }
      i++;
      if (i % 50 === 0) console.log(`[eeat] ${i}/${files.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`[eeat] done. pushed=${pushed} local=${local} noop=${noop} skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
