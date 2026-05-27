#!/usr/bin/env node
/**
 * Walk data/articles/*.json and emit a JSON array of
 * { slug, title, dek } that the image generator will iterate over.
 */
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(process.cwd(), "data", "articles");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const out = [];
for (const f of files) {
  const a = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  out.push({ slug: a.slug, title: a.title || "", dek: a.dek || "" });
}
fs.writeFileSync(path.resolve(process.cwd(), "data", "image-inputs.json"), JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} entries to data/image-inputs.json`);
