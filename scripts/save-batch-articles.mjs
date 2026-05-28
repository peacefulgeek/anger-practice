#!/usr/bin/env node
/**
 * save-batch-articles.mjs <batch-json-path> <start-date-iso>
 *
 * Reads a /home/ubuntu/gen_articles_batch_N.json file and writes each
 * successful article into /home/ubuntu/anger-practice/data/articles/<slug>.json
 * with the full article shape used by the rest of the system.
 *
 * Schedule: assigns scheduledFor Mon-Sat 9am PT starting from start-date-iso,
 * one per day, skipping Sundays. Articles get published=false so the cron
 * will promote them as their scheduledFor matures.
 *
 * Each article gets 3 inline + 4 bottom products picked from the cabinet,
 * unless the batch already provided them.
 *
 * heroImage placeholder: https://anger-practice.b-cdn.net/articles-hero/<slug>.webp
 */
import fs from "node:fs";
import path from "node:path";

const batchPath = process.argv[2];
const startIso = process.argv[3]; // YYYY-MM-DD
if (!batchPath || !startIso) {
  console.error("usage: save-batch-articles.mjs <batch-json> <start-yyyy-mm-dd>");
  process.exit(1);
}

const ROOT = path.resolve(process.cwd());
const ARTICLES_DIR = path.resolve(ROOT, "data", "articles");
fs.mkdirSync(ARTICLES_DIR, { recursive: true });

// Load cabinet
const HERBS_FILE = path.resolve(ROOT, "src", "lib", "herbs.ts");
const herbsRaw = fs.readFileSync(HERBS_FILE, "utf8");
const entryRegex = /\{\s*asin:\s*"([A-Z0-9]+)",\s*title:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*category:\s*"([^"]+)"/g;
const cabinet = [];
let mm;
while ((mm = entryRegex.exec(herbsRaw)) !== null) {
  cabinet.push({ asin: mm[1], title: mm[2], brand: mm[3], category: mm[4] });
}
console.log(`Cabinet: ${cabinet.length} entries`);

const AMAZON_TAG = "spankyspinola-20";
const amazonLink = (asin) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;

function hashIdx(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickN(seed, n, exclude = new Set()) {
  // Deterministic per-seed picks; rotate through cabinet
  const out = [];
  let idx = hashIdx(seed) % cabinet.length;
  const seen = new Set(exclude);
  for (let tries = 0; tries < cabinet.length * 2 && out.length < n; tries++) {
    const item = cabinet[idx % cabinet.length];
    if (!seen.has(item.asin)) {
      out.push(item);
      seen.add(item.asin);
    }
    idx++;
  }
  return out;
}

const data = JSON.parse(fs.readFileSync(batchPath, "utf8"));
const results = data.results || data;

function nextMonSat(d) {
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0);
  return d;
}

let cursor = new Date(`${startIso}T16:00:00Z`);
if (cursor.getUTCDay() === 0) cursor = nextMonSat(cursor);

let saved = 0;
let skipped = 0;
const slugsTaken = new Set(
  fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
);

for (const r of results) {
  if (r.error) { skipped++; continue; }
  const o = r.output || {};
  if (!o.slug || !o.body_markdown) { skipped++; continue; }

  let slug = o.slug;
  if (slugsTaken.has(slug)) {
    let n = 2;
    while (slugsTaken.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  slugsTaken.add(slug);

  // Inline + bottom products
  let inlineProducts = [];
  let bottomProducts = [];
  try { inlineProducts = JSON.parse(o.inline_products_json || "[]"); } catch {}
  try { bottomProducts = JSON.parse(o.bottom_products_json || "[]"); } catch {}

  if (inlineProducts.length < 3) {
    const picks = pickN(slug + ":inline", 3);
    inlineProducts = picks.map((p) => ({
      asin: p.asin,
      title: p.title,
      link: amazonLink(p.asin),
    }));
  }
  if (bottomProducts.length < 4) {
    const inlineAsins = new Set(inlineProducts.map((p) => p.asin));
    const picks = pickN(slug + ":bottom", 4, inlineAsins);
    bottomProducts = picks.map((p) => ({
      asin: p.asin,
      title: p.title,
      link: amazonLink(p.asin),
      category: p.category,
    }));
  }

  const article = {
    slug,
    title: o.title || r.input,
    dek: o.dek || "",
    bodyMarkdown: o.body_markdown,
    wordCount: o.word_count || 0,
    voiceScore: o.voice_score || 0,
    researchers: (o.researchers_csv || "")
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean),
    inlineProducts,
    bottomProducts,
    heroImage: `https://anger-practice.b-cdn.net/articles-hero/${slug}.webp`,
    published: false,
    publishedAt: null,
    scheduledFor: cursor.toISOString(),
    createdAt: new Date().toISOString(),
    source: "bulk-seed-2026-05",
  };

  fs.writeFileSync(path.join(ARTICLES_DIR, `${slug}.json`), JSON.stringify(article, null, 2));
  saved++;

  cursor = nextMonSat(new Date(cursor));
}

console.log(`Saved: ${saved}`);
console.log(`Skipped: ${skipped}`);
console.log(`Last scheduledFor (approx): ${new Date(cursor.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10)}`);
