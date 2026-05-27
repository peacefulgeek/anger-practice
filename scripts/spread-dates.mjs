#!/usr/bin/env node
/**
 * spread-dates.mjs — distribute publishedAt across the published set so the
 * library doesn't look like every piece dropped on May 1, 2026.
 *
 * Strategy:
 *   - Sort published articles by current publishedAt ascending (stable tie-break by slug)
 *   - Spread them across the last NUM_DAYS days, ending today
 *   - Each article gets a random hour-of-day for naturalism
 *   - Then push every changed article back to Bunny
 *
 * Run: node scripts/spread-dates.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "data", "articles");
const APPLY = process.argv.includes("--apply");

const BUNNY_ZONE = "anger-practice";
const BUNNY_REGION = "ny.storage.bunnycdn.com";
const BUNNY_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";

const NUM_DAYS = 180; // spread across last 6 months

function loadAll() {
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const full = path.join(ROOT, f);
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    return { file: full, slug: f.replace(".json", ""), data };
  });
}

function isPublished(a) {
  return a.published === true;
}

async function pushToBunny(slug, json) {
  const url = `https://${BUNNY_REGION}/${BUNNY_ZONE}/articles/${slug}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: BUNNY_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error(`Bunny PUT ${slug}: ${res.status} ${await res.text()}`);
}

async function main() {
  const all = loadAll();
  const pubs = all.filter((a) => isPublished(a.data));
  console.log(`Loaded ${all.length} total, ${pubs.length} published`);

  // Sort by current publishedAt ascending (so order is stable across reruns)
  pubs.sort((a, b) => {
    const ta = new Date(a.data.publishedAt || 0).getTime();
    const tb = new Date(b.data.publishedAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return a.slug.localeCompare(b.slug);
  });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const spanMs = NUM_DAYS * dayMs;

  let changed = 0;
  for (let i = 0; i < pubs.length; i++) {
    const fraction = pubs.length === 1 ? 1 : i / (pubs.length - 1); // 0..1
    const baseTime = now - spanMs + fraction * spanMs;
    // Random hour 6am..10pm so it doesn't look like a bot
    const hourJitter = (6 + Math.floor(Math.random() * 16)) * 60 * 60 * 1000;
    // Strip to date component then add jitter
    const d = new Date(baseTime);
    d.setUTCHours(0, 0, 0, 0);
    const newIso = new Date(d.getTime() + hourJitter).toISOString();

    if (pubs[i].data.publishedAt === newIso) continue;
    pubs[i].data.publishedAt = newIso;
    changed++;
    if (APPLY) {
      fs.writeFileSync(pubs[i].file, JSON.stringify(pubs[i].data, null, 2));
    }
  }
  console.log(`Updated publishedAt on ${changed}/${pubs.length} published articles`);

  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply to write + push to Bunny.");
    return;
  }

  // Push to Bunny
  console.log(`Pushing ${pubs.length} updated articles to Bunny...`);
  let ok = 0;
  let fail = 0;
  for (const p of pubs) {
    try {
      await pushToBunny(p.slug, p.data);
      ok++;
      if (ok % 20 === 0) console.log(`  pushed ${ok}/${pubs.length}`);
    } catch (e) {
      fail++;
      console.error(`FAIL ${p.slug}: ${e.message}`);
    }
  }
  console.log(`Bunny push: ${ok} ok, ${fail} failed`);

  // Date histogram for sanity
  const buckets = {};
  for (const p of pubs) {
    const m = p.data.publishedAt.slice(0, 7);
    buckets[m] = (buckets[m] || 0) + 1;
  }
  console.log("\nDate distribution:");
  for (const k of Object.keys(buckets).sort()) console.log(`  ${k}: ${buckets[k]}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
