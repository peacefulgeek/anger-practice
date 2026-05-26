#!/usr/bin/env node
// Bulk article seeder with parallel concurrency, resumable, JSONL log.
// Usage: node scripts/bulk-seed.mjs [count] [concurrency]

const COUNT = parseInt(process.argv[2] || "500", 10);
const CONCURRENCY = parseInt(process.argv[3] || "6", 10);

const { generateWithRetry } = await import("../src/lib/generator.ts");
const { ensureDirs, saveArticle, readQueue, writeQueue, listArticles } = await import(
  "../src/lib/store.ts"
);
import fs from "node:fs";
import path from "node:path";

ensureDirs();

const LOG_PATH = path.resolve("data/seed-log.jsonl");
function log(rec) {
  fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...rec }) + "\n");
}

let queue = await readQueue();
const existingSlugs = new Set(listArticles().map((a) => a.slug));
console.log(`[bulk-seed] start: queue=${queue.length} existing=${existingSlugs.size} target=${COUNT} concurrency=${CONCURRENCY}`);

let done = 0;
let failed = 0;
let inFlight = 0;
let queueIdx = 0;

// Pull next topic that isn't already a known slug
function nextTopic() {
  while (queueIdx < queue.length) {
    const t = queue[queueIdx++];
    return t;
  }
  return null;
}

async function worker(id) {
  while (done + failed < COUNT && queueIdx < queue.length) {
    const topic = nextTopic();
    if (!topic) return;
    inFlight++;
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    if (existingSlugs.has(slug)) {
      inFlight--;
      log({ event: "skip-dup", topic });
      continue;
    }
    const t0 = Date.now();
    try {
      const a = await generateWithRetry(topic, 8);
      if (existingSlugs.has(a.slug)) {
        log({ event: "skip-dup-after", topic, slug: a.slug });
        inFlight--;
        continue;
      }
      // Save every generated article as GATED. The cap-published step at the
      // end will promote the OLDEST 100 (≥1,800 words) to published.
      const totalSoFar = existingSlugs.size + done;
      const scheduledFor = new Date(Date.now() + totalSoFar * 6 * 3600 * 1000).toISOString();
      await saveArticle({
        ...a,
        publishedAt: null,
        scheduledFor,
        published: false,
      });
      existingSlugs.add(a.slug);
      done++;
      const ms = Date.now() - t0;
      console.log(`[${done + failed}/${COUNT}] worker${id} OK ${a.slug} ${a.wordCount}w v=${a.voiceScore} ${ms}ms`);
      log({ event: "ok", topic, slug: a.slug, words: a.wordCount, voice: a.voiceScore, ms });
    } catch (e) {
      failed++;
      const ms = Date.now() - t0;
      console.log(`[${done + failed}/${COUNT}] worker${id} FAIL ${topic.slice(0, 60)} :: ${e.message} ${ms}ms`);
      log({ event: "fail", topic, error: String(e.message || e), ms });
    } finally {
      inFlight--;
      // Persist queue progress periodically
      if ((done + failed) % 5 === 0) {
        await writeQueue(queue.slice(queueIdx));
      }
      // Inter-call cooldown: 8s per worker between attempts so we don't slam the API
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
}

const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
await Promise.all(workers);

await writeQueue(queue.slice(queueIdx));
console.log(`\n[bulk-seed] done: ok=${done} failed=${failed} remaining=${queue.length - queueIdx}`);
log({ event: "summary", done, failed, remaining: queue.length - queueIdx });
