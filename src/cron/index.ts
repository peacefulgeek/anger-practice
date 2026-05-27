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

// ---- Cron 1: publish next queued article (or promote next gated) — 6/week ----
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
// HEAD-only checks miss the most common failure modes ("Currently unavailable"
// and the dogs-of-Amazon page both return HTTP 200). This does a real GET with
// a desktop User-Agent, then scans the HTML for known failure strings. Result
// gets persisted to data/asin-health.json so we can read history.
async function asinHealthCheck() {
  const items: { asin: string; source: "HERB" | "BOOK"; title: string }[] = [
    ...HERBS.map((h) => ({ asin: h.asin, source: "HERB" as const, title: h.title })),
    ...BOOKS.map((b) => ({ asin: b.asin, source: "BOOK" as const, title: b.title })),
  ];

  const NOT_FOUND_RE = /Page Not Found|Sorry! We couldn['’]t find that page|Looking for something/i;
  const UNAVAILABLE_RE = /Currently unavailable|We don['’]t know when or if this item will be back/i;
  const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

  type Verdict = "ok" | "not_found" | "unavailable" | "redirect" | "network_error" | "blocked";
  const results: { asin: string; source: string; title: string; verdict: Verdict; httpStatus?: number; finalUrl?: string }[] = [];

  // CAPTCHA detection: when Amazon bot-blocks Node fetch (very common from
  // datacenter IPs like Railway), they serve `opfcaptcha.amazon.com` HTML with
  // a tiny page that contains the api-services-support email and no
  // `productTitle`. We MUST detect this case first so we never falsely flag a
  // live ASIN as dead just because we got CAPTCHA'd.
  const CAPTCHA_HTML_RE =
    /opfcaptcha\.amazon\.com|api-services-support@amazon\.com|To discuss automated access to Amazon data/i;

  // Limit concurrency so we don't hammer Amazon and trigger a global ban
  const CONC = 4;
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      const it = items[i];
      let verdict: Verdict = "ok";
      let httpStatus: number | undefined;
      let finalUrl: string | undefined;
      try {
        const r = await fetch(`https://www.amazon.com/dp/${it.asin}`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "user-agent": UA,
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.9",
          },
        });
        httpStatus = r.status;
        finalUrl = r.url;
        const html = await r.text();
        // 1. CAPTCHA must be detected FIRST. The CAPTCHA page is short, contains
        //    the api-services-support email, and has no #productTitle. Treat
        //    this as "blocked" — NEVER kill an ASIN based on a blocked verdict.
        const looksLikeCaptcha =
          CAPTCHA_HTML_RE.test(html) && !html.includes("productTitle");
        if (looksLikeCaptcha) {
          verdict = "blocked";
        } else if (!r.ok) {
          verdict = "not_found";
        } else if (!finalUrl.includes(`/dp/${it.asin}`) && !finalUrl.includes(`/${it.asin}`)) {
          verdict = "redirect";
        } else if (NOT_FOUND_RE.test(html)) {
          verdict = "not_found";
        } else if (UNAVAILABLE_RE.test(html)) {
          verdict = "unavailable";
        } else {
          verdict = "ok";
        }
      } catch (e) {
        verdict = "network_error";
      }
      results.push({ asin: it.asin, source: it.source, title: it.title, verdict, httpStatus, finalUrl });
      // gentle throttle
      await new Promise((res) => setTimeout(res, 250));
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  const counts: Record<string, number> = {};
  for (const r of results) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  const dead = results.filter((r) => r.verdict === "not_found" || r.verdict === "unavailable" || r.verdict === "redirect");
  const blockedRatio = (counts.blocked || 0) / Math.max(1, items.length);

  console.log(`[cron:asin] checked ${items.length}; counts:`, counts);
  if (blockedRatio > 0.3) {
    // Amazon is bot-blocking us. Anything classified as dead in this run is
    // likely a false positive — do not pretend we have actionable data.
    console.warn(
      `[cron:asin] WARNING: ${(blockedRatio * 100).toFixed(0)}% of probes were CAPTCHA-blocked. ` +
        `Findings unreliable. Recommend running scripts/asin-health-smoke.mjs from a residential IP, ` +
        `or migrating to PA-API for production health checks.`,
    );
  }
  if (dead.length) {
    console.log(`[cron:asin] DEAD/UNAVAILABLE (${dead.length}):`);
    for (const d of dead) console.log(`  ${d.asin} [${d.verdict}] ${d.source} — ${d.title}`);
  }

  const report = {
    runAt: new Date().toISOString(),
    total: items.length,
    counts,
    blockedRatio: Number(blockedRatio.toFixed(3)),
    reliable: blockedRatio <= 0.3,
    dead: dead.map((d) => ({ asin: d.asin, source: d.source, title: d.title, verdict: d.verdict })),
    blocked: results.filter((r) => r.verdict === "blocked").map((d) => ({ asin: d.asin, source: d.source })),
  };
  try {
    const out = path.resolve(process.cwd(), "data", "asin-health.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(`[cron:asin] report written to ${out}`);
  } catch (e) {
    console.error(`[cron:asin] failed to write report:`, (e as Error).message);
  }
}

export function startCrons() {
  if (!AUTO_GEN_ENABLED) {
    console.log("[cron] AUTO_GEN_ENABLED=false — crons skipped");
    return;
  }
  console.log("[cron] starting 5 schedulers");

  // 6 articles per week: Monday–Saturday at 09:00 PT (Sundays off).
  // Earlier this was every 6 hours (4/day) — too aggressive for a sustainable
  // editorial cadence once the launch backlog was published.
  cron.schedule("0 9 * * 1-6", publishNext, { timezone: "America/Los_Angeles" });

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
