#!/usr/bin/env node
/**
 * cap-published.mjs
 *
 * One-time normalizer: ensure no more than 100 articles are published; gate the rest
 * with staggered future `scheduledFor` dates so the in-process publish-cron will roll
 * them out at its normal cadence (one every 6 hours).
 *
 * Rules:
 *  - The 100 OLDEST articles (by publishedAt if present, else by file mtime) stay published.
 *  - Everything else gets:  published=false, publishedAt=null, scheduledFor=future-stagger.
 *  - Staggers every 6 hours starting from "now" (so first gated piece goes live in 6h, etc.)
 *  - Safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.resolve(__dirname, "..", "data", "articles");
const CAP = 100;
const HOURS_BETWEEN = 6;

if (!fs.existsSync(ART_DIR)) {
  console.error(`[cap] missing ${ART_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json"));
const articles = [];
for (const f of files) {
  const full = path.join(ART_DIR, f);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    console.warn(`[cap] skipping malformed ${f}: ${e.message}`);
    continue;
  }
  const mtime = fs.statSync(full).mtimeMs;
  const sortKey =
    (data.publishedAt && new Date(data.publishedAt).getTime()) ||
    (data.scheduledFor && new Date(data.scheduledFor).getTime()) ||
    mtime;
  articles.push({ file: full, name: f, data, sortKey });
}

// Oldest first
articles.sort((a, b) => a.sortKey - b.sortKey);

const nowMs = Date.now();
let pubCount = 0;
let gateCount = 0;
let gateIdx = 0;

for (const a of articles) {
  if (pubCount < CAP) {
    // Keep / coerce to published
    a.data.published = true;
    if (!a.data.publishedAt) {
      a.data.publishedAt = new Date(a.sortKey || nowMs).toISOString();
    }
    a.data.scheduledFor = a.data.publishedAt;
    pubCount++;
  } else {
    // Gate
    a.data.published = false;
    a.data.publishedAt = null;
    const futureMs = nowMs + (gateIdx + 1) * HOURS_BETWEEN * 60 * 60 * 1000;
    a.data.scheduledFor = new Date(futureMs).toISOString();
    gateIdx++;
    gateCount++;
  }
  fs.writeFileSync(a.file, JSON.stringify(a.data, null, 2) + "\n");
}

console.log(`[cap] total:      ${articles.length}`);
console.log(`[cap] published:  ${pubCount}`);
console.log(`[cap] gated:      ${gateCount}`);
console.log(`[cap] gate stagger: every ${HOURS_BETWEEN}h starting in ${HOURS_BETWEEN}h`);
console.log(
  `[cap] last gated unlock: ${new Date(
    nowMs + gateIdx * HOURS_BETWEEN * 60 * 60 * 1000,
  ).toISOString()}`,
);
