// Downloads each generated hero image, converts to optimized .webp,
// and uploads to Bunny at articles-hero/<slug>.webp
// Returns the public CDN URL map slug -> https://anger-practice.b-cdn.net/articles-hero/<slug>.webp

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const BUNNY_HOST = 'https://ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'anger-practice';
const BUNNY_KEY = process.env.BUNNY_KEY || 'f5c045db-2822-4ad7-98ccba130603-6024-44fc';
const PUBLIC_BASE = 'https://anger-practice.b-cdn.net';

const map = JSON.parse(readFileSync('/home/ubuntu/anger-practice/data/slug-to-genimage-unified.json', 'utf8'));
const slugs = Object.keys(map);
console.log(`Processing ${slugs.length} hero images`);

const TMP = '/tmp/heroes-raw';
mkdirSync(TMP, { recursive: true });

const out = {};
const failed = [];

const CONCURRENCY = 8;

async function processOne(slug) {
  const srcUrl = map[slug];
  // 1. Download
  const r = await fetch(srcUrl);
  if (!r.ok) throw new Error(`download failed ${r.status}`);
  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);

  // 2. Re-encode to webp at 1600x900, quality 78, progressive
  const webp = await sharp(buf)
    .resize(1600, 900, { fit: 'cover', position: 'center' })
    .webp({ quality: 78, effort: 5 })
    .toBuffer();

  // 3. PUT to Bunny
  const path = `articles-hero/${slug}.webp`;
  const url = `${BUNNY_HOST}/${BUNNY_ZONE}/${path}`;
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_KEY,
      'Content-Type': 'image/webp',
    },
    body: webp,
  });
  if (!putRes.ok) {
    const t = await putRes.text();
    throw new Error(`bunny PUT ${putRes.status}: ${t}`);
  }

  out[slug] = `${PUBLIC_BASE}/${path}`;
}

async function runBatch() {
  let i = 0;
  let done = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < slugs.length) {
      const slug = slugs[i++];
      try {
        await processOne(slug);
        done++;
        process.stdout.write(`[${done}/${slugs.length}] ${slug}\n`);
      } catch (e) {
        console.error(`FAIL ${slug}:`, e.message);
        failed.push({ slug, err: e.message });
      }
    }
  });
  await Promise.all(workers);
}

await runBatch();

writeFileSync('/home/ubuntu/anger-practice/data/slug-to-bunny-hero.json', JSON.stringify(out, null, 2));
console.log(`\nUploaded ${Object.keys(out).length}/${slugs.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) {
  console.log(JSON.stringify(failed, null, 2));
  process.exit(1);
}
