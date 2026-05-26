#!/usr/bin/env node
/**
 * One-time migration: push every local article JSON + topics-queue.json to
 * Bunny Storage so Bunny becomes the source of truth.
 *
 * Safe to re-run — it overwrites with whatever is currently on disk.
 *
 * Usage:
 *   node scripts/migrate-to-bunny.mjs
 *   STORAGE_DRIVER=bunny node scripts/migrate-to-bunny.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BUNNY = {
  storageHost: "ny.storage.bunnycdn.com",
  zone: "anger-practice",
  storageKey: "f5c045db-2822-4ad7-98ccba130603-6024-44fc",
};

const ART_DIR = path.resolve("data/articles");
const QUEUE = path.resolve("data/topics-queue.json");

const CONC = 16;

async function put(remote, body) {
  const url = `https://${BUNNY.storageHost}/${BUNNY.zone}/${remote}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: BUNNY.storageKey, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PUT ${remote} -> ${res.status} ${t}`);
  }
}

const files = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".json"));
console.log(`[migrate] ${files.length} articles to upload`);

let done = 0;
let failed = 0;
let cursor = 0;

async function worker(id) {
  while (cursor < files.length) {
    const i = cursor++;
    const f = files[i];
    const body = fs.readFileSync(path.join(ART_DIR, f), "utf8");
    try {
      await put(`articles/${f}`, body);
      done++;
      if (done % 20 === 0) console.log(`  [migrate] ${done}/${files.length}`);
    } catch (e) {
      failed++;
      console.error(`  [migrate] FAIL ${f}: ${e.message}`);
    }
  }
}

const t0 = Date.now();
await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i + 1)));
console.log(`[migrate] articles done: ok=${done} failed=${failed} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

// Queue
if (fs.existsSync(QUEUE)) {
  const body = fs.readFileSync(QUEUE, "utf8");
  await put("data/topics-queue.json", body);
  console.log(`[migrate] queue uploaded (${JSON.parse(body).length} topics)`);
}

console.log("[migrate] complete");
