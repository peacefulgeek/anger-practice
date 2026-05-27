#!/usr/bin/env node
/**
 * Pre-build ASIN guard.
 *
 * Walks every data/articles/*.json and every product entry / amazon.com/dp/<ASIN>
 * link inside bodyMarkdown, and fails the build if ANY reference is not in the
 * verified pool (HERBS + BOOKS).
 *
 * Wired into `pnpm build` via the prebuild script. The build will not produce
 * dist/ if the cabinet has been pruned but articles still reference removed
 * ASINs.
 *
 * Run manually:
 *   node scripts/verify-asins.mjs            # exit 1 on any unverified
 *   node scripts/verify-asins.mjs --report   # print counts only, exit 0
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "data", "articles");
const HERBS_TS = path.join(ROOT, "src", "lib", "herbs.ts");
const BOOKS_TS = path.join(ROOT, "src", "lib", "books.ts");

const reportOnly = process.argv.includes("--report");

function parseAsins(file) {
  const raw = fs.readFileSync(file, "utf8");
  const out = new Set();
  for (const m of raw.matchAll(/\basin:\s*"([A-Z0-9]+)"/g)) out.add(m[1]);
  return out;
}

const verified = new Set([...parseAsins(HERBS_TS), ...parseAsins(BOOKS_TS)]);
console.log(`[verify-asins] verified pool: ${verified.size}`);

if (!fs.existsSync(ARTICLES_DIR)) {
  console.log("[verify-asins] no data/articles dir; nothing to check");
  process.exit(0);
}

const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json")).sort();
console.log(`[verify-asins] scanning ${files.length} articles`);

const offenders = []; // { slug, asin, where }
for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const a = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8"));
  // bodyMarkdown amazon links
  const body = a.bodyMarkdown || "";
  for (const m of body.matchAll(/amazon\.com\/dp\/([A-Z0-9]+)/g)) {
    if (!verified.has(m[1])) offenders.push({ slug, asin: m[1], where: "body" });
  }
  // inlineProducts
  for (const p of a.inlineProducts || []) {
    if (p.asin && !verified.has(p.asin)) offenders.push({ slug, asin: p.asin, where: "inline" });
  }
  // bottomProducts
  for (const p of a.bottomProducts || []) {
    if (p.asin && !verified.has(p.asin)) offenders.push({ slug, asin: p.asin, where: "bottom" });
  }
}

if (offenders.length === 0) {
  console.log("[verify-asins] PASS: every article ASIN is in the verified pool");
  process.exit(0);
}

// Group by ASIN for a compact report
const byAsin = new Map();
for (const o of offenders) {
  if (!byAsin.has(o.asin)) byAsin.set(o.asin, []);
  byAsin.get(o.asin).push(`${o.slug}:${o.where}`);
}

console.error(`\n[verify-asins] FAIL: ${offenders.length} offending refs across ${byAsin.size} unverified ASINs`);
for (const [asin, refs] of byAsin) {
  console.error(`  ${asin}  (${refs.length} refs)  e.g. ${refs.slice(0, 2).join(", ")}`);
}

if (reportOnly) process.exit(0);
process.exit(1);
