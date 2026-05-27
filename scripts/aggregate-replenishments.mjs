#!/usr/bin/env node
/**
 * Read /home/ubuntu/find_replenishment_asins.json, parse the products_json
 * from each subtask, dedupe against the current herbs.ts ASINs, and write
 * a flat candidate list to /tmp/replenish-candidates.json.
 */
import fs from "node:fs";
import path from "node:path";

const RESULT = "/home/ubuntu/find_replenishment_asins.json";
const HERBS = path.resolve(process.cwd(), "src", "lib", "herbs.ts");

const data = JSON.parse(fs.readFileSync(RESULT, "utf8"));
const rows = data.results || data;

const liveAsins = new Set();
const herbsRaw = fs.readFileSync(HERBS, "utf8");
const re = /asin:\s*"([A-Z0-9]+)"/g;
let m;
while ((m = re.exec(herbsRaw)) !== null) liveAsins.add(m[1]);

const seen = new Set();
const candidates = [];

for (const r of rows) {
  const json = r?.output?.products_json || "[]";
  let items = [];
  try {
    items = JSON.parse(json);
    if (!Array.isArray(items)) {
      // sometimes wrapped in an object
      if (items && Array.isArray(items.products)) items = items.products;
      else items = [];
    }
  } catch (e) {
    console.error("parse error in", r.input, e.message);
    continue;
  }
  for (const it of items) {
    if (!it || !it.asin) continue;
    if (it.asin.length !== 10) continue;
    if (liveAsins.has(it.asin)) continue;
    if (seen.has(it.asin)) continue;
    seen.add(it.asin);
    candidates.push({
      asin: it.asin,
      title: (it.title || "").slice(0, 110),
      brand: it.brand || "",
      category: it.category || "",
      summary: (it.summary || "").slice(0, 200),
      mechanism: (it.mechanism || "").slice(0, 200),
      caution: (it.caution || "").slice(0, 160),
    });
  }
}

fs.writeFileSync("/tmp/replenish-candidates.json", JSON.stringify(candidates, null, 2));
const byCat = {};
for (const c of candidates) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(`Aggregated ${candidates.length} unique candidates`);
console.log("By category:", byCat);
console.log("ASINs:", candidates.map((c) => c.asin).join(","));
