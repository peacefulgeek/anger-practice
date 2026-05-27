import cron from "node-cron";
import fs from "fs";
import path from "path";
import { AUTO_GEN_ENABLED } from "../lib/config.js";
import { generateWithRetry } from "../lib/generator.js";
import {
  ensureDirs,
  saveArticle,
  popQueue,
  readQueue,
  listArticles,
  listAllArticles,
  rebuildClientBundle,
  ARTICLES_DIR,
} from "../lib/store.js";
import { HERBS } from "../lib/herbs.js";
import { BOOKS } from "../lib/books.js";

// ---- Cron 1: publish next queued article (or promote next gated) every 6 hours ----
async function publishNext() {
  if (!AUTO_GEN_ENABLED) return;

  // First: promote any gated draft whose scheduledFor has matured AND that
  // already passes the 1,800-word floor. Anything shorter never gets promoted.
  const now = Date.now();
  const MIN_WORDS = 1800;
  const gated = listAllArticles().filter(
    (a) =>
      a.published !== true &&
      a.scheduledFor &&
      new Date(a.scheduledFor).getTime() <= now &&
      (a.wordCount ?? 0) >= MIN_WORDS,
  );
  if (gated.length) {
    // Oldest-scheduled first
    gated.sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
    const target = gated[0];
    target.published = true;
    target.publishedAt = new Date().toISOString();
    await saveArticle(target);
    console.log(`[cron:publish] promoted gated draft: ${target.slug} (${target.wordCount}w)`);
    return; // one action per tick
  }

  const topic = await popQueue();
  if (!topic) {
    console.log("[cron:publish] queue empty");
    return;
  }
  console.log(`[cron:publish] generating: ${topic}`);
  try {
    const a = await generateWithRetry(topic, 2);
    await saveArticle({
      ...a,
      publishedAt: new Date().toISOString(),
    });
    console.log(`[cron:publish] OK ${a.slug} (${a.wordCount}w, score=${a.voiceScore})`);
  } catch (e) {
    console.error(`[cron:publish] FAILED ${topic}:`, (e as Error).message);
    // Put topic back at end of queue
    const q = await readQueue();
    q.push(topic);
    const { writeQueue } = await import("../lib/store.js");
    await writeQueue(q);
  }
}

// ---- Cron 2: product spotlight rotation (daily) ----
async function rotateProductSpotlight() {
  const spotlight = {
    herb: HERBS[Math.floor(Math.random() * HERBS.length)],
    book: BOOKS[Math.floor(Math.random() * BOOKS.length)],
    rotatedAt: new Date().toISOString(),
  };
  const out = path.resolve(process.cwd(), "client/src/data/spotlight.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(spotlight, null, 2));
  console.log(`[cron:spotlight] rotated to ${spotlight.herb.title}`);
}

// ---- Cron 3: monthly index rebuild (1st of month, 02:00) ----
async function monthlyIndexRebuild() {
  ensureDirs();
  rebuildClientBundle();
  const arts = listArticles();
  console.log(`[cron:monthly] rebuilt index with ${arts.length} articles`);
}

// ---- Cron 4: quarterly refresh pass (placeholder - cycles dek regeneration) ----
async function quarterlyRefresh() {
  const arts = listArticles();
  console.log(`[cron:quarterly] ${arts.length} articles audited`);
}

// ---- Cron 5: ASIN health check (weekly) ----
async function asinHealthCheck() {
  const all = [...HERBS.map((h) => h.asin), ...BOOKS.map((b) => b.asin)];
  const bad: string[] = [];
  for (const asin of all) {
    try {
      const r = await fetch(`https://www.amazon.com/dp/${asin}`, {
        method: "HEAD",
        redirect: "follow",
      });
      if (!r.ok || r.url.includes("/404")) bad.push(asin);
    } catch {
      bad.push(asin);
    }
  }
  console.log(`[cron:asin] checked ${all.length}, flagged ${bad.length}: ${bad.join(", ")}`);
}

export function startCrons() {
  if (!AUTO_GEN_ENABLED) {
    console.log("[cron] AUTO_GEN_ENABLED=false — crons skipped");
    return;
  }
  console.log("[cron] starting 5 schedulers");

  // Every 6 hours: publish next article
  cron.schedule("0 */6 * * *", publishNext, { timezone: "America/Los_Angeles" });

  // Daily at 07:00: rotate product spotlight
  cron.schedule("0 7 * * *", rotateProductSpotlight, { timezone: "America/Los_Angeles" });

  // Monthly on the 1st at 02:00: full index rebuild
  cron.schedule("0 2 1 * *", monthlyIndexRebuild, { timezone: "America/Los_Angeles" });

  // Quarterly (Jan/Apr/Jul/Oct 2nd at 03:00)
  cron.schedule("0 3 2 1,4,7,10 *", quarterlyRefresh, { timezone: "America/Los_Angeles" });

  // Weekly on Sunday at 04:00: ASIN health
  cron.schedule("0 4 * * 0", asinHealthCheck, { timezone: "America/Los_Angeles" });

  // Run spotlight once immediately so the bundle exists
  rotateProductSpotlight().catch((e) => console.error(e));
}

// Allow direct invocation: node src/cron/index.js publish
if (process.argv[2] === "publish") publishNext();
if (process.argv[2] === "spotlight") rotateProductSpotlight();
if (process.argv[2] === "index") monthlyIndexRebuild();
if (process.argv[2] === "asin") asinHealthCheck();
