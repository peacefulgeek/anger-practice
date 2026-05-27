// Updates each local article's heroImage to its unique Bunny CDN URL,
// then pushes all changed articles back to Bunny so live serves them.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ART_DIR = '/home/ubuntu/anger-practice/data/articles';
const PUBLIC_BASE = 'https://anger-practice.b-cdn.net';
const BUNNY_HOST = 'https://ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'anger-practice';
const BUNNY_KEY = 'f5c045db-2822-4ad7-98ccba130603-6024-44fc';

const files = readdirSync(ART_DIR).filter((f) => f.endsWith('.json')).sort();
console.log(`Updating ${files.length} articles`);

let changed = 0;
let pushFailed = 0;
const CONCURRENCY = 6;

async function processOne(file) {
  const slug = file.replace('.json', '');
  const path = join(ART_DIR, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const newHero = `${PUBLIC_BASE}/articles-hero/${slug}.webp`;

  if (data.heroImage === newHero) return; // already correct

  data.heroImage = newHero;

  // Some articles use heroImageUrl or coverImage too; update if present
  if ('heroImageUrl' in data) data.heroImageUrl = newHero;
  if ('coverImage' in data) data.coverImage = newHero;

  // Save local
  writeFileSync(path, JSON.stringify(data, null, 2));

  // Push to Bunny
  const bunnyUrl = `${BUNNY_HOST}/${BUNNY_ZONE}/articles/${file}`;
  const r = await fetch(bunnyUrl, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error(`PUSH FAIL ${file}: ${r.status} ${t}`);
    pushFailed++;
    return;
  }
  changed++;
  if (changed % 20 === 0) process.stdout.write(`  pushed: ${changed}\n`);
}

async function runBatch() {
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < files.length) {
      const f = files[i++];
      try {
        await processOne(f);
      } catch (e) {
        console.error(`FAIL ${f}:`, e.message);
        pushFailed++;
      }
    }
  });
  await Promise.all(workers);
}

await runBatch();
console.log(`\nUpdated and pushed: ${changed}/${files.length}`);
console.log(`Push failures: ${pushFailed}`);
process.exit(pushFailed === 0 ? 0 : 1);
