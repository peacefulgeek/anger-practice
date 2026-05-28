#!/usr/bin/env node
/**
 * Rewrite every published article currently containing a banned word or
 * banned phrase. We:
 *   1. Re-scan data/articles for the published violators (authoritative pass).
 *   2. For each violator, call the SAME generateWithRetry the runtime uses
 *      (Claude sonnet-4-5 + voice gate). If gate refuses, keep the original
 *      and log it as a hold-out.
 *   3. On success, merge the new body/dek into the existing JSON so
 *      publishedAt, heroImage, slug, etc. are preserved.
 *   4. Push the JSON straight to Bunny so production picks it up immediately
 *      via the next bootstrapStore tick (and via /api/admin/refresh once we
 *      tell the server).
 *
 * Run:
 *   node scripts/rewrite-violators.mjs
 *
 * Env:
 *   PUSH_BUNNY=1 (default 1 here since the user wants live fixes)
 *   CONCURRENCY (default 6)
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { generateWithRetry } from "../src/lib/generator.ts";

const ART_DIR = path.resolve(process.cwd(), "data", "articles");
const BUNNY_HOST = "https://ny.storage.bunnycdn.com";
const ZONE = "anger-practice";
const STORAGE_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const PUSH = process.env.PUSH_BUNNY !== "0";
const CONC = Number(process.env.CONCURRENCY || 6);

// Aligned with current voiceGate.ts + scrubBannedLexicon (medical-overlap
// words like elevate/robust/comprehensive/landscape/realm/domain removed).
const BANNED_WORDS = ["delve","tapestry","paradigm","synergy","leverage","unlock","empower","utilize","pivotal","embark","underscore","paramount","seamlessly","beacon","curate","bespoke","resonate","harness","intricate","plethora","myriad","transformative","groundbreaking","innovative","cutting-edge","revolutionary","state-of-the-art","ever-evolving","holistic","multifaceted","stakeholders","ecosystem","furthermore","moreover","additionally","consequently","subsequently","thereby","streamline","optimize","facilitate","amplify","catalyze"];
const BANNED_PHRASES = ["it's important to note","in conclusion","in summary","in the realm of","dive deep into","at the end of the day","in today's fast-paced world","plays a crucial role","a testament to","when it comes to","cannot be overstated","needless to say","first and foremost","last but not least","delve into","a tapestry of","navigate the complexities","unlock your best self","journey of self-discovery","embark on a journey","harness the power","holistic approach"];

function isViolator(body) {
  const lower = body.toLowerCase();
  for (const w of BANNED_WORDS) {
    const re = new RegExp("(^|[^a-z])" + w.replace(/-/g, "\\-") + "(?=$|[^a-z])", "i");
    if (re.test(body)) return true;
  }
  for (const p of BANNED_PHRASES) if (lower.includes(p)) return true;
  return false;
}

async function bunnyPut(slug, body) {
  const url = `${BUNNY_HOST}/${ZONE}/articles/${slug}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`PUT failed ${res.status}: ${await res.text()}`);
}

function loadAll() {
  const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    const a = JSON.parse(fs.readFileSync(path.join(ART_DIR, f), "utf8"));
    out.push({ file: f, a });
  }
  return out;
}

async function processOne({ file, a }, idx, total) {
  const tag = `[${idx + 1}/${total}] ${a.slug}`;
  try {
    const fresh = await generateWithRetry(a.title, 5);
    // Merge: keep slug, publishedAt, createdAt, heroImage, bottomProducts
    // mapping; replace body/dek/wordCount/voiceScore/researchers; bump
    // updatedAt and dateModified.
    const now = new Date().toISOString();
    const merged = {
      ...a,
      bodyMarkdown: fresh.bodyMarkdown,
      dek: fresh.dek || a.dek,
      wordCount: fresh.wordCount,
      voiceScore: fresh.voiceScore,
      researchers: fresh.researchers,
      inlineProducts: fresh.inlineProducts,
      bottomProducts: fresh.bottomProducts,
      updatedAt: now,
      author: "The Oracle Lover",
      byline: `By The Oracle Lover - ${new Date(now).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      source: "claude-sonnet-4-5",
    };
    const json = JSON.stringify(merged, null, 2);
    fs.writeFileSync(path.join(ART_DIR, file), json);
    if (PUSH) await bunnyPut(a.slug, json);
    console.log(`${tag} OK ${fresh.wordCount}w v=${fresh.voiceScore}`);
    return { slug: a.slug, status: "rewritten" };
  } catch (e) {
    console.error(`${tag} FAIL: ${e.message}`);
    return { slug: a.slug, status: "failed", error: e.message };
  }
}

async function main() {
  const all = loadAll();
  // INCLUDE_GATED=1 -> rewrite gated/unpublished violators instead of published ones.
  const includeGated = process.env.INCLUDE_GATED === "1";
  const targets = all.filter(({ a }) => {
    const isPub = a.published === true;
    if (includeGated && isPub) return false;
    if (!includeGated && !isPub) return false;
    return isViolator(a.bodyMarkdown || "");
  });
  console.log(
    `[rewrite] ${targets.length} ${includeGated ? "gated" : "published"} violators | conc=${CONC} | push=${PUSH}`,
  );

  let cursor = 0;
  const results = [];
  async function worker(id) {
    while (cursor < targets.length) {
      const i = cursor++;
      const r = await processOne(targets[i], i, targets.length);
      results.push(r);
    }
  }
  await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i)));

  const ok = results.filter((r) => r.status === "rewritten").length;
  const fail = results.filter((r) => r.status === "failed").length;
  console.log(`[rewrite] DONE ok=${ok} failed=${fail}`);
  if (fail) {
    console.log("--- failures ---");
    for (const r of results.filter((r) => r.status === "failed")) {
      console.log(`  ${r.slug}: ${r.error}`);
    }
  }
  fs.writeFileSync("/tmp/rewrite-results.json", JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
