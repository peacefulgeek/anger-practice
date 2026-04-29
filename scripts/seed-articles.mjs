#!/usr/bin/env node
// Generate first N articles via DeepSeek, pull from queue, save to data/articles, rebuild client bundle.
// Usage: node scripts/seed-articles.mjs [count]

const COUNT = parseInt(process.argv[2] || "12", 10);

const { generateWithRetry } = await import("../src/lib/generator.ts");
const { ensureDirs, saveArticle, readQueue, writeQueue, listArticles } = await import(
  "../src/lib/store.ts"
);

ensureDirs();

let queue = readQueue();
if (!queue.length) {
  console.error("Queue is empty. Run scripts/build-queue.mjs first.");
  process.exit(1);
}

const existing = new Set(listArticles().map((a) => a.slug));
let generated = 0;
let attempts = 0;

while (generated < COUNT && queue.length && attempts < COUNT * 3) {
  attempts++;
  const topic = queue.shift();
  console.log(`\n[${generated + 1}/${COUNT}] ${topic}`);
  try {
    const a = await generateWithRetry(topic, 2);
    if (existing.has(a.slug)) {
      console.log("  (duplicate slug, skipping)");
      continue;
    }
    saveArticle({ ...a, publishedAt: new Date().toISOString() });
    existing.add(a.slug);
    generated++;
    console.log(`  OK ${a.slug} — ${a.wordCount}w, voice=${a.voiceScore}`);
  } catch (e) {
    console.error(`  FAIL: ${e.message}`);
    queue.push(topic);
  }
  writeQueue(queue);
}

console.log(`\nDone. Generated ${generated} articles. Queue size: ${queue.length}`);
