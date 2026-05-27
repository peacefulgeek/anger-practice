#!/usr/bin/env node
/**
 * Re-upload every locally-clean article JSON to Bunny CDN.
 *
 * The earlier scrub run wrote to local data/articles/*.json, but the Bunny
 * copies are stale (some articles still reference dead/orphan ASINs in
 * inlineProducts/bottomProducts). Railway's runtime hydrates from Bunny on
 * cold-start, so it serves the stale data.
 *
 * This script force-PUTs every local article to Bunny, then triggers a
 * Railway redeploy via a no-op commit.
 */
import fs from "node:fs";
import path from "node:path";

const ZONE = "anger-practice";
const HOST = "ny.storage.bunnycdn.com";
const KEY = "f5c045db-2822-4ad7-98ccba130603-6024-44fc";

const ART_DIR = path.resolve(process.cwd(), "data", "articles");
const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json")).sort();

console.log(`Pushing ${files.length} local articles to Bunny zone=${ZONE}`);

const CONC = 8;
let cursor = 0;
let ok = 0;
let fail = 0;
const failures = [];

async function worker() {
  while (cursor < files.length) {
    const i = cursor++;
    const file = files[i];
    const slug = file.slice(0, -5);
    const body = fs.readFileSync(path.join(ART_DIR, file), "utf8");
    try {
      const r = await fetch(`https://${HOST}/${ZONE}/articles/${file}`, {
        method: "PUT",
        headers: {
          AccessKey: KEY,
          "Content-Type": "application/json",
        },
        body,
      });
      if (!r.ok) {
        fail++;
        const t = await r.text();
        failures.push({ slug, status: r.status, text: t.slice(0, 200) });
      } else {
        ok++;
        if (ok % 25 === 0) console.log(`  ${ok}/${files.length} pushed`);
      }
    } catch (e) {
      fail++;
      failures.push({ slug, error: e.message });
    }
  }
}

await Promise.all(Array.from({ length: CONC }, worker));

console.log(`\ndone: ${ok} ok, ${fail} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures.slice(0, 20)) {
    console.log(`  ${f.slug}: ${f.status || ""} ${f.text || f.error || ""}`);
  }
}

if (fail > 0) process.exit(1);
