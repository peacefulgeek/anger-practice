import { readFileSync, writeFileSync } from 'node:fs';

const main = JSON.parse(readFileSync('/home/ubuntu/gen_unique_hero_per_article.json', 'utf8'));
const retry = JSON.parse(readFileSync('/home/ubuntu/gen_unique_hero_retry.json', 'utf8'));

const map = {};
let okCount = 0;

function ingest(data) {
  for (const r of data.results) {
    const out = r.output || {};
    if (out.ok && out.slug && out.image_url && out.image_url.startsWith('http')) {
      map[out.slug] = out.image_url;
      okCount++;
    }
  }
}

ingest(main);
ingest(retry);

console.log(`Total mapped: ${Object.keys(map).length}`);
console.log(`Sample:`, Object.entries(map).slice(0, 3));

writeFileSync('/home/ubuntu/anger-practice/data/slug-to-genimage.json', JSON.stringify(map, null, 2));
console.log(`Wrote data/slug-to-genimage.json`);
