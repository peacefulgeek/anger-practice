#!/usr/bin/env node
/**
 * cap-published.mjs
 *
 * Enforces TWO rules at once:
 *   (1) No more than 100 articles are publicly visible.
 *   (2) EVERY published article has wordCount >= MIN_WORDS (default 1800).
 *
 * Algorithm:
 *   - Read every article from data/articles/*.json (local cache).
 *   - Drop any article with wordCount < MIN_WORDS from the pool of candidates
 *     eligible for publication — those are always gated.
 *   - From the remaining (>=1800w) pool, pick the OLDEST 100 (by publishedAt
 *     if present, else by createdAt, else by mtime) and mark them published.
 *   - Everything else is gated with staggered scheduledFor every 6h.
 *   - If STORAGE_DRIVER=bunny, PUSH every modified article back to Bunny.
 *
 * Re-runnable. Idempotent for a given file set.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.resolve(__dirname, "..", "data", "articles");
const CAP = Number(process.env.CAP || 100);
const MIN_WORDS = Number(process.env.MIN_WORDS || 1800);
const HOURS_BETWEEN = Number(process.env.HOURS_BETWEEN || 6);
const PUSH_TO_BUNNY = (process.env.STORAGE_DRIVER || "").toLowerCase() === "bunny";

const BUNNY = {
  storageHost: "ny.storage.bunnycdn.com",
  zone: "anger-practice",
  storageKey: "f5c045db-2822-4ad7-98ccba130603-6024-44fc",
};
async function bunnyPut(remote, body) {
  const res = await fetch(`https://${BUNNY.storageHost}/${BUNNY.zone}/${remote}`, {
    method: "PUT",
    headers: { AccessKey: BUNNY.storageKey, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`bunny PUT ${remote} → ${res.status}`);
}

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
    (data.createdAt && new Date(data.createdAt).getTime()) ||
    (data.scheduledFor && new Date(data.scheduledFor).getTime()) ||
    mtime;
  articles.push({ file: full, name: f, data, sortKey, wc: data.wordCount || 0 });
}

// Eligible to be published: meets the word-count floor
const eligible = articles.filter((a) => a.wc >= MIN_WORDS).sort((a, b) => a.sortKey - b.sortKey);
const tooShort = articles.filter((a) => a.wc < MIN_WORDS);

const publishedSet = new Set(eligible.slice(0, CAP).map((a) => a.file));

const nowMs = Date.now();
let pubCount = 0;
let gateCount = 0;
let gateIdx = 0;
let shortGated = 0;

// Pass 1: write published flags for eligible-and-picked
// Pass 2: gate everything else (including all too-short articles)
const sortedAll = articles.slice().sort((a, b) => a.sortKey - b.sortKey);

const pendingPushes = [];
for (const a of sortedAll) {
  if (publishedSet.has(a.file)) {
    a.data.published = true;
    if (!a.data.publishedAt) {
      a.data.publishedAt = new Date(a.sortKey || nowMs).toISOString();
    }
    a.data.scheduledFor = a.data.publishedAt;
    pubCount++;
  } else {
    a.data.published = false;
    a.data.publishedAt = null;
    const futureMs = nowMs + (gateIdx + 1) * HOURS_BETWEEN * 60 * 60 * 1000;
    a.data.scheduledFor = new Date(futureMs).toISOString();
    gateIdx++;
    gateCount++;
    if (a.wc < MIN_WORDS) shortGated++;
  }
  const body = JSON.stringify(a.data, null, 2) + "\n";
  fs.writeFileSync(a.file, body);
  if (PUSH_TO_BUNNY) pendingPushes.push({ slug: a.data.slug, body });
}

if (PUSH_TO_BUNNY) {
  console.log(`[cap] pushing ${pendingPushes.length} updates to Bunny...`);
  const CONC = 16;
  let cursor = 0;
  let pushed = 0;
  let failed = 0;
  async function worker() {
    while (cursor < pendingPushes.length) {
      const i = cursor++;
      const { slug, body } = pendingPushes[i];
      try {
        await bunnyPut(`articles/${slug}.json`, body);
        pushed++;
      } catch (e) {
        failed++;
        console.error(`  [cap] bunny PUT FAIL ${slug}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`[cap] bunny: pushed=${pushed} failed=${failed}`);
}

console.log(`[cap] MIN_WORDS=${MIN_WORDS}  CAP=${CAP}  HOURS_BETWEEN=${HOURS_BETWEEN}`);
console.log(`[cap] total:                ${articles.length}`);
console.log(`[cap] eligible (>=${MIN_WORDS}w): ${eligible.length}`);
console.log(`[cap] too-short (gated):    ${tooShort.length}`);
console.log(`[cap] published (final):    ${pubCount}`);
console.log(`[cap] gated (final):        ${gateCount}  (of which ${shortGated} are short)`);
if (pubCount < CAP) {
  console.warn(
    `[cap] WARNING: only ${pubCount} eligible articles met the ${MIN_WORDS}-word floor; ` +
      `cap of ${CAP} not reached. Generate more long-form pieces to fill it.`,
  );
}
