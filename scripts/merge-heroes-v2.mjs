// Merge all 4 hero-image batches into a single slug→image_url map
import fs from "fs";
import path from "path";

const BATCHES = [
  "/home/ubuntu/gen_heroes_batch_1.json",
  "/home/ubuntu/gen_heroes_batch_2.json",
  "/home/ubuntu/gen_heroes_batch_3.json",
  "/home/ubuntu/gen_heroes_batch_4.json",
];

const ARTICLES_DIR = path.join(process.cwd(), "data", "articles");
const validSlugs = new Set(
  fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
);

const map = {};
let totalReturned = 0;
let validCount = 0;
let invalidSlug = 0;
let missingUrl = 0;

for (const batchPath of BATCHES) {
  if (!fs.existsSync(batchPath)) continue;
  const data = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  for (const r of (data.results || [])) {
    totalReturned++;
    const out = r.output || {};
    const slug = out.slug;
    const url = out.image_url;
    if (!slug || !validSlugs.has(slug)) { invalidSlug++; continue; }
    if (!url || !/^https?:\/\//.test(url)) { missingUrl++; continue; }
    if (!map[slug]) {
      map[slug] = url;
      validCount++;
    }
  }
}

const out = "/tmp/heroes-v2-map.json";
fs.writeFileSync(out, JSON.stringify(map, null, 2));

console.log(`Total subagent returns: ${totalReturned}`);
console.log(`Valid slug+url:         ${validCount}`);
console.log(`Invalid slug rejected:  ${invalidSlug}`);
console.log(`Missing url rejected:   ${missingUrl}`);
console.log(`Distinct slugs in map:  ${Object.keys(map).length}`);
console.log(`Map saved → ${out}`);

// Now find which articles still don't have a hero in the unified map
const missing = [...validSlugs].filter(s => !map[s]);
const cdnHavePath = "/tmp/cdn-existing-heroes.json";
const cdnHave = fs.existsSync(cdnHavePath)
  ? new Set(JSON.parse(fs.readFileSync(cdnHavePath, "utf8")))
  : new Set();
const stillMissing = missing.filter(s => !cdnHave.has(s));
console.log(`\nArticles total:          ${validSlugs.size}`);
console.log(`Articles with new hero:  ${Object.keys(map).length}`);
console.log(`Articles already on CDN: ${[...cdnHave].length}`);
console.log(`Articles still missing:  ${stillMissing.length}`);
if (stillMissing.length > 0 && stillMissing.length < 20) {
  console.log("Missing slugs:");
  stillMissing.forEach(s => console.log("  -", s));
}
