#!/usr/bin/env node
// Re-assign heroImage on existing articles to bucket-aware bunny URLs
import fs from "node:fs";
import path from "node:path";
const { bucketImageForTopic } = await import("../src/lib/buckets.ts");

const dir = path.resolve("data/articles");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
let n = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const a = JSON.parse(fs.readFileSync(p, "utf8"));
  const newHero = bucketImageForTopic(a.title);
  if (a.heroImage !== newHero) {
    a.heroImage = newHero;
    if (typeof a.published === "undefined") {
      a.published = true;
    }
    fs.writeFileSync(p, JSON.stringify(a, null, 2));
    n++;
  }
}
console.log(`updated ${n}/${files.length} articles`);
