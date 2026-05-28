// Walk every article in data/articles, set heroImage to the canonical CDN URL,
// push every changed file to Bunny.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BUNNY_HOST = 'https://ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'anger-practice';
const BUNNY_KEY = process.env.BUNNY_KEY || 'f5c045db-2822-4ad7-98ccba130603-6024-44fc';
const PUBLIC_BASE = 'https://anger-practice.b-cdn.net';
const ART_DIR = '/home/ubuntu/anger-practice/data/articles';
const PREFIX = 'articles/';

const files = readdirSync(ART_DIR).filter(f => f.endsWith('.json'));
console.log(`Walking ${files.length} articles`);

let changed = 0;
let unchanged = 0;
let failed = 0;
const fails = [];

const CONCURRENCY = 12;
let i = 0;
let done = 0;

async function processOne(file) {
  const path = join(ART_DIR, file);
  const slug = file.replace(/\.json$/, '');
  const canonical = `${PUBLIC_BASE}/articles-hero/${slug}.webp`;
  let art;
  try {
    art = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    failed++;
    fails.push({ slug, err: 'parse: ' + e.message });
    return;
  }
  if (art.heroImage === canonical) {
    unchanged++;
    return;
  }
  art.heroImage = canonical;
  const json = JSON.stringify(art, null, 2);
  writeFileSync(path, json);

  // Push to Bunny
  const url = `${BUNNY_HOST}/${BUNNY_ZONE}/${PREFIX}${slug}.json`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_KEY,
      'Content-Type': 'application/json',
    },
    body: json,
  });
  if (!res.ok) {
    failed++;
    fails.push({ slug, err: `bunny PUT ${res.status}` });
    return;
  }
  changed++;
}

const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (i < files.length) {
    const f = files[i++];
    await processOne(f);
    done++;
    if (done % 25 === 0 || done === files.length) {
      process.stdout.write(`[${done}/${files.length}] changed=${changed} unchanged=${unchanged} fail=${failed}\n`);
    }
  }
});
await Promise.all(workers);

console.log(`\nDONE: changed=${changed} unchanged=${unchanged} failed=${failed}`);
if (fails.length) {
  console.log('Failures:', JSON.stringify(fails.slice(0, 20), null, 2));
  process.exit(1);
}
