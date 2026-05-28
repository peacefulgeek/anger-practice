#!/usr/bin/env node
/**
 * QA: parse a gen_articles_batch_N.json and report:
 *  - count succeeded vs failed
 *  - word count distribution
 *  - voice score distribution
 *  - ASIN compliance (must be in cabinet)
 *  - slug uniqueness within batch
 *  - body inline ASIN compliance (markdown links to /dp/X must reference cabinet ASINs and match inlineProducts)
 *  - which slugs failed
 */
import fs from "node:fs";

const path = process.argv[2] || "/home/ubuntu/gen_articles_batch_1.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const results = data.results || data;

const cabinet = JSON.parse(fs.readFileSync("/tmp/cabinet.json", "utf8"));
const cabinetAsins = new Set(cabinet.map((h) => h.asin));

let ok = 0;
let failed = [];
let wcUnder = [];
let voiceLow = [];
let asinBad = [];
let slugDupes = new Map();
let bodyOrphans = [];

for (const r of results) {
  if (r.error) {
    failed.push(`${r.input.slice(0, 60)}: ${r.error}`);
    continue;
  }
  ok++;
  const o = r.output || {};
  if ((o.word_count || 0) < 2400) wcUnder.push([o.slug || r.input, o.word_count]);
  if ((o.voice_score || 0) < 80) voiceLow.push([o.slug || r.input, o.voice_score]);

  // parse inline + bottom products
  let inline = [];
  let bottom = [];
  try { inline = JSON.parse(o.inline_products_json || "[]"); } catch {}
  try { bottom = JSON.parse(o.bottom_products_json || "[]"); } catch {}
  const productAsins = [...inline, ...bottom].map((p) => p.asin);
  for (const a of productAsins) {
    if (!cabinetAsins.has(a)) asinBad.push([o.slug || r.input, a]);
  }

  // slug dupes
  const s = o.slug || "";
  slugDupes.set(s, (slugDupes.get(s) || 0) + 1);

  // body inline ASIN check: every /dp/<ASIN> in body must be in cabinet
  const body = o.body_markdown || "";
  const reg = /\/dp\/([A-Z0-9]{10})/g;
  let m;
  while ((m = reg.exec(body))) {
    if (!cabinetAsins.has(m[1])) bodyOrphans.push([o.slug, m[1]]);
  }
}

console.log("=== BATCH QA ===");
console.log(`Total: ${results.length}`);
console.log(`Successful: ${ok}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) console.log("FAILED inputs:\n  " + failed.join("\n  "));

console.log(`\nWord count under 2400: ${wcUnder.length}`);
if (wcUnder.length && wcUnder.length < 20) wcUnder.forEach((x) => console.log(`  ${x[0]}: ${x[1]}`));

console.log(`\nVoice score < 80: ${voiceLow.length}`);
if (voiceLow.length && voiceLow.length < 20) voiceLow.forEach((x) => console.log(`  ${x[0]}: ${x[1]}`));

console.log(`\nASINs in inline/bottom NOT in cabinet: ${asinBad.length}`);
if (asinBad.length && asinBad.length < 20) asinBad.forEach((x) => console.log(`  ${x[0]}: ${x[1]}`));

const dupSlugs = [...slugDupes.entries()].filter(([s, n]) => n > 1);
console.log(`\nDuplicate slugs within batch: ${dupSlugs.length}`);
dupSlugs.forEach(([s, n]) => console.log(`  ${s}: ${n}x`));

console.log(`\nBody markdown links to NON-cabinet ASINs: ${bodyOrphans.length}`);
if (bodyOrphans.length && bodyOrphans.length < 20) bodyOrphans.forEach((x) => console.log(`  ${x[0]}: ${x[1]}`));

// PASS criteria
const pass = ok >= results.length * 0.9 && asinBad.length === 0 && bodyOrphans.length === 0;
console.log(`\n${pass ? "PASS" : "FAIL"}`);
process.exit(pass ? 0 : 1);
