#!/usr/bin/env node
/**
 * One-shot script. For every article JSON in data/articles/*.json:
 *   1. Replace every em-dash ("—") with " - " in bodyMarkdown and dek.
 *   2. Backfill schema fields if missing:
 *        - author     = "The Oracle Lover"
 *        - byline     = "By The Oracle Lover - <human date>"
 *        - updatedAt  = the article's publishedAt or createdAt (ISO)
 *   3. Append a visible last-updated <time> tag inside the body if absent.
 *   4. Append an author byline block if absent (warm + topic-specific).
 *   5. Recompute wordCount.
 *   6. Push the updated JSON back to Bunny Storage so production picks it up.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   node scripts/scrub-and-backfill.mjs            # local only
 *   PUSH_BUNNY=1 node scripts/scrub-and-backfill.mjs   # also push to Bunny
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ART_DIR = path.resolve(ROOT, "data", "articles");
const BUNNY_HOST = "https://ny.storage.bunnycdn.com";
const ZONE = "anger-practice";
const STORAGE_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const PUSH = process.env.PUSH_BUNNY === "1";

const CONC = 12;

function humanDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function scrubEmDashes(s) {
  if (typeof s !== "string") return s;
  return s.replace(/—/g, " - ");
}

function ensureUpdatedTag(body, isoDate) {
  // If body already has a <time datetime="..."> tag we leave it.
  if (/<time[^>]*datetime=/i.test(body)) return body;
  const human = humanDate(isoDate) || "May 2026";
  // Insert a small "Last updated" line right after the first heading or
  // at the very top of the body if no heading was found.
  const tag = `\n\n*Last updated <time datetime="${isoDate}">${human}</time>.*\n`;
  // Try to insert after a leading <section data-tldr=...> if present
  const tldrMatch = body.match(/<section[^>]*data-tldr=["']ai-overview["'][\s\S]*?<\/section>/i);
  if (tldrMatch) {
    return body.replace(tldrMatch[0], tldrMatch[0] + tag);
  }
  // Otherwise, after first non-empty paragraph
  return body.replace(/^([^\n]+\n)/, `$1${tag}`);
}

function ensureBottomByline(body, topic, isoDate) {
  // If a bottom byline already exists (data-author="byline") keep it.
  if (/<section\s+data-author=["']byline["']/i.test(body)) return body;
  const human = humanDate(isoDate) || "May 2026";
  const block =
    `\n\n---\n\n` +
    `<section data-author="byline">\n` +
    `Written by **The Oracle Lover**, independent essayist on anger, somatics, and embodied spirituality.\n` +
    `Last updated <time datetime="${isoDate}">${human}</time>.\n` +
    `In our work on ${String(topic || "this topic").toLowerCase()}, we keep returning to one quiet truth: the body has been telling you something for a long time, and it deserves a thoughtful listener. The Anger Practice is a companion journal to [theoraclelover.com](https://theoraclelover.com), and every piece here is written with you in mind.\n` +
    `</section>\n`;
  return body.trimEnd() + block;
}

function scrubLeakage(body) {
  // Remove any direct paulwagner.com mentions or "Paul Wagner" name leakage
  let out = body;
  out = out.replace(/\bpaulwagner\.com\b/gi, "theoraclelover.com");
  out = out.replace(/\bPaul\s+Wagner\b/g, "The Oracle Lover");
  return out;
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

async function processOne(file) {
  const fp = path.join(ART_DIR, file);
  const before = fs.readFileSync(fp, "utf8");
  const a = JSON.parse(before);

  let changed = false;

  // Em-dash scrub
  const scrubbed = scrubEmDashes(a.bodyMarkdown || "");
  if (scrubbed !== a.bodyMarkdown) {
    a.bodyMarkdown = scrubbed;
    changed = true;
  }
  const scrubbedDek = scrubEmDashes(a.dek || "");
  if (scrubbedDek !== a.dek) {
    a.dek = scrubbedDek;
    changed = true;
  }

  // Leakage scrub
  const leakScrubbed = scrubLeakage(a.bodyMarkdown || "");
  if (leakScrubbed !== a.bodyMarkdown) {
    a.bodyMarkdown = leakScrubbed;
    changed = true;
  }

  const iso = a.publishedAt || a.createdAt || new Date().toISOString();

  // Backfill author / byline / updatedAt
  if (!a.author) {
    a.author = "The Oracle Lover";
    changed = true;
  }
  if (!a.byline) {
    a.byline = `By The Oracle Lover - ${humanDate(iso)}`;
    changed = true;
  }
  if (!a.updatedAt) {
    a.updatedAt = iso;
    changed = true;
  }

  // Ensure visible last-updated tag in body
  const withUpdated = ensureUpdatedTag(a.bodyMarkdown, a.updatedAt || iso);
  if (withUpdated !== a.bodyMarkdown) {
    a.bodyMarkdown = withUpdated;
    changed = true;
  }

  // Ensure bottom byline block
  const withByline = ensureBottomByline(a.bodyMarkdown, a.title, a.updatedAt || iso);
  if (withByline !== a.bodyMarkdown) {
    a.bodyMarkdown = withByline;
    changed = true;
  }

  // Recompute wordCount
  const wc = (a.bodyMarkdown || "").trim().split(/\s+/).filter(Boolean).length;
  if (wc !== a.wordCount) {
    a.wordCount = wc;
    changed = true;
  }

  if (!changed) return { slug: a.slug, status: "noop" };

  const json = JSON.stringify(a, null, 2);
  fs.writeFileSync(fp, json);

  if (PUSH) {
    await bunnyPut(`articles/${a.slug}.json`, json);
    return { slug: a.slug, status: "pushed", wc };
  }
  return { slug: a.slug, status: "local-updated", wc };
}

async function main() {
  if (!fs.existsSync(ART_DIR)) {
    console.error(`No directory ${ART_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json"));
  console.log(`[scrub] ${files.length} files | push=${PUSH}`);

  let cursor = 0;
  let updated = 0;
  let pushed = 0;
  let noop = 0;
  const errors = [];

  async function worker() {
    while (cursor < files.length) {
      const i = cursor++;
      try {
        const r = await processOne(files[i]);
        if (r.status === "pushed") pushed++;
        else if (r.status === "local-updated") updated++;
        else noop++;
        if ((i + 1) % 50 === 0) {
          console.log(`[scrub] ${i + 1}/${files.length} pushed=${pushed} local=${updated} noop=${noop}`);
        }
      } catch (e) {
        console.error(`[scrub] FAIL ${files[i]}:`, e.message);
        errors.push({ file: files[i], error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  console.log(`[scrub] done. pushed=${pushed} local=${updated} noop=${noop} errors=${errors.length}`);
  if (errors.length) {
    console.log(JSON.stringify(errors.slice(0, 5), null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
