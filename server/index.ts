// ===========================================================================
// Crash handlers FIRST. If any import or top-level code throws, we want a
// readable line in Railway's deploy logs instead of a silent exit.
// ===========================================================================
process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaughtException:", err && (err.stack || err));
});
process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandledRejection:", reason);
});

import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { startCrons } from "../src/cron/index.js";
import {
  listArticles,
  listAllArticles,
  bootstrapStore,
  saveArticle,
} from "../src/lib/store.js";
import { generateWithRetry } from "../src/lib/generator.js";
import { activeDriver } from "../src/lib/bunnyStore.js";
import {
  injectHead,
  buildArticleContext,
  buildHomeContext,
  buildArticlesIndexContext,
  buildAboutContext,
  buildStaticContext,
  canonicalUrl,
  SITE_URL,
} from "./seoHead.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8080;

// ---------------------------------------------------------------------------
// AI / crawler robots.txt — every major AI bot explicitly allowed.
// ---------------------------------------------------------------------------
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Bingbot",
  "CCBot",
  "Applebot",
  "Applebot-Extended",
  "DuckAssistBot",
  "Meta-ExternalAgent",
  "YouBot",
  "MistralAI-User",
  "Cohere-AI",
];

function buildRobotsTxt(): string {
  const lines: string[] = [];
  lines.push("# theangerpractice.com");
  lines.push("# AI bots explicitly allowed. Sitemap + llms files at the bottom.");
  lines.push("");
  for (const bot of AI_BOTS) {
    lines.push(`User-agent: ${bot}`);
    lines.push("Allow: /");
    lines.push("");
  }
  lines.push("User-agent: *");
  lines.push("Allow: /");
  lines.push("Disallow: /api/");
  lines.push("");
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push(`# Plain-language index for LLMs`);
  lines.push(`# ${SITE_URL}/llms.txt`);
  lines.push(`# ${SITE_URL}/llms-full.txt`);
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// llms.txt - plain-markdown index of published articles grouped by category.
// ---------------------------------------------------------------------------
function categoryOf(title: string): string {
  const t = title.toLowerCase();
  if (/somatic|body|nervous system|breath|breathwork|grounding|polyvagal|tremor|shake/.test(t)) return "Somatic & Body";
  if (/spirit|sacred|prayer|divine|ritual|altar|meditation|practice/.test(t)) return "Spiritual & Practice";
  if (/relationship|partner|marriage|family|parent|child|sibling|friend/.test(t)) return "Relationships & Family";
  if (/work|career|burn|colleague|boss|workplace|activism|leadership/.test(t)) return "Work & Activism";
  if (/health|herb|sleep|alcohol|caffein|cortisol|adrenal|chronic|pain|inflammation/.test(t)) return "Health & The Body";
  if (/grief|loss|death|trauma|abuse|wound/.test(t)) return "Grief & Trauma";
  if (/woman|female|girl|mother|daughter/.test(t)) return "Women & Anger";
  if (/man|male|boy|father|son/.test(t)) return "Men & Anger";
  return "Anger Practice";
}

function buildLlmsTxt(arts: { slug: string; title: string; dek: string }[]): string {
  const buckets = new Map<string, { slug: string; title: string; dek: string }[]>();
  for (const a of arts) {
    const c = categoryOf(a.title);
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(a);
  }
  const lines: string[] = [];
  lines.push("# The Anger Practice - llms.txt");
  lines.push("");
  lines.push(
    "> A literary journal on healthy anger, rage work, suppressed anger recovery, somatic release, and the spiritual dimension of feeling fully. Written by The Oracle Lover.",
  );
  lines.push("");
  lines.push(`Site: ${SITE_URL}`);
  lines.push(`Author: The Oracle Lover (https://theoraclelover.com)`);
  lines.push(`Total published essays: ${arts.length}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  const catKeys: string[] = [];
  buckets.forEach((_v, k) => catKeys.push(k));
  catKeys.sort();
  for (const cat of catKeys) {
    lines.push(`## ${cat}`);
    lines.push("");
    for (const a of buckets.get(cat)!) {
      const desc = (a.dek || "").replace(/\s+/g, " ").trim().slice(0, 180);
      lines.push(`- [${a.title}](${SITE_URL}/article/${a.slug}) - ${desc}`);
    }
    lines.push("");
  }
  lines.push("## Other resources");
  lines.push("");
  lines.push(`- [Assessments](${SITE_URL}/assessments) - 9 nurturing self-assessments for anger and emotional patterns.`);
  lines.push(`- [Herbal Cabinet](${SITE_URL}/herbs) - 130+ verified nervines, adaptogens, and supplements with affiliate links.`);
  lines.push(`- [Fire Toolkit](${SITE_URL}/fire-toolkit) - In-the-moment practices for moving through anger.`);
  lines.push(`- [About](${SITE_URL}/about) - Editorial stance and author note.`);
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// llms-full.txt - frontmatter-delimited corpus of all published article bodies.
// ---------------------------------------------------------------------------
function buildLlmsFullTxt(arts: {
  slug: string;
  title: string;
  dek: string;
  bodyMarkdown: string;
  publishedAt: string | null;
  updatedAt?: string;
  wordCount: number;
}[]): string {
  const out: string[] = [];
  out.push(`# The Anger Practice - llms-full.txt`);
  out.push(`# Total: ${arts.length} essays. Generated: ${new Date().toISOString()}`);
  out.push("");
  for (const a of arts) {
    out.push("---");
    out.push(`title: ${a.title.replace(/\n/g, " ")}`);
    out.push(`slug: ${a.slug}`);
    out.push(`url: ${SITE_URL}/article/${a.slug}`);
    out.push(`author: The Oracle Lover`);
    if (a.publishedAt) out.push(`published: ${a.publishedAt}`);
    if (a.updatedAt) out.push(`updated: ${a.updatedAt}`);
    out.push(`wordcount: ${a.wordCount}`);
    out.push(`description: ${(a.dek || "").replace(/\n/g, " ").slice(0, 280)}`);
    out.push("---");
    out.push("");
    out.push(a.bodyMarkdown || "");
    out.push("");
  }
  return out.join("\n");
}

async function startServer() {
  console.log(
    `[boot] node=${process.version} env=${process.env.NODE_ENV || "development"} port=${PORT} driver=${activeDriver()}`,
  );

  const t0 = Date.now();
  const boot = await bootstrapStore();
  console.log(
    `[store] driver=${boot.driver} pulled=${boot.pulled} cached=${boot.total} in ${Date.now() - t0}ms`,
  );

  const app = express();
  const server = createServer(app);

  const PULL_BASE = "https://anger-practice.b-cdn.net";
  function withCanonicalHero<T extends { slug?: string; heroImage?: string }>(a: T): T {
    if (!a || !a.slug) return a;
    return { ...a, heroImage: `${PULL_BASE}/articles-hero/${a.slug}.webp` };
  }

  // ---------- API ----------
  app.get("/api/articles", (_req, res) => {
    try {
      const arts = listArticles().map(withCanonicalHero);
      res.json(arts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ---------- /sitemap.xml ----------
  app.get("/sitemap.xml", (_req, res) => {
    try {
      const staticPaths: { p: string; freq: string; pri: string }[] = [
        { p: "/", freq: "weekly", pri: "1.0" },
        { p: "/articles", freq: "daily", pri: "0.9" },
        { p: "/assessments", freq: "monthly", pri: "0.7" },
        { p: "/herbs", freq: "monthly", pri: "0.7" },
        { p: "/fire-toolkit", freq: "monthly", pri: "0.6" },
        { p: "/about", freq: "monthly", pri: "0.4" },
      ];
      const arts = listArticles().slice().sort((a, b) => {
        const ad = a.publishedAt || a.createdAt || "";
        const bd = b.publishedAt || b.createdAt || "";
        return ad < bd ? 1 : -1;
      });
      const urls: string[] = [];
      for (const sp of staticPaths) {
        urls.push(
          `<url><loc>${SITE_URL}${sp.p}</loc><changefreq>${sp.freq}</changefreq><priority>${sp.pri}</priority></url>`,
        );
      }
      for (const a of arts) {
        const lastmod =
          (a as any).updatedAt || a.publishedAt || a.createdAt || new Date().toISOString();
        urls.push(
          `<url><loc>${SITE_URL}/article/${a.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        );
      }
      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).type("text/plain").send((e as Error).message);
    }
  });

  // ---------- /robots.txt ----------
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(buildRobotsTxt());
  });

  // ---------- /llms.txt ----------
  app.get("/llms.txt", (_req, res) => {
    try {
      const arts = listArticles().map((a) => ({ slug: a.slug, title: a.title, dek: a.dek || "" }));
      res.type("text/markdown; charset=utf-8").send(buildLlmsTxt(arts));
    } catch (e) {
      res.status(500).type("text/plain").send((e as Error).message);
    }
  });

  // ---------- /llms-full.txt ----------
  app.get("/llms-full.txt", (_req, res) => {
    try {
      const arts = listArticles().map((a) => ({
        slug: a.slug,
        title: a.title,
        dek: a.dek || "",
        bodyMarkdown: a.bodyMarkdown || "",
        publishedAt: a.publishedAt,
        updatedAt: (a as any).updatedAt,
        wordCount: a.wordCount,
      }));
      res.type("text/plain; charset=utf-8").send(buildLlmsFullTxt(arts));
    } catch (e) {
      res.status(500).type("text/plain").send((e as Error).message);
    }
  });

  // ---------- admin refresh ----------
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.JWT_SECRET || "";

  // ----- Banned-word / banned-phrase detection (mirrors voice gate) -----
  const BANNED_WORDS = ["delve","tapestry","paradigm","synergy","leverage","unlock","empower","utilize","pivotal","embark","underscore","paramount","seamlessly","robust","beacon","foster","elevate","curate","bespoke","resonate","harness","intricate","plethora","myriad","comprehensive","transformative","groundbreaking","innovative","cutting-edge","revolutionary","state-of-the-art","ever-evolving","profound","holistic","nuanced","multifaceted","stakeholders","ecosystem","landscape","realm","sphere","domain","furthermore","moreover","additionally","consequently","subsequently","thereby","streamline","optimize","facilitate","amplify","catalyze"];
  const BANNED_PHRASES = ["it's important to note","in conclusion","in summary","in the realm of","dive deep into","at the end of the day","in today's fast-paced world","plays a crucial role","a testament to","when it comes to","cannot be overstated","needless to say","first and foremost","last but not least","delve into","a tapestry of","navigate the complexities","unlock your best self","journey of self-discovery","embark on a journey","harness the power","holistic approach"];
  function isViolator(body: string): boolean {
    const lower = body.toLowerCase();
    for (const w of BANNED_WORDS) {
      const re = new RegExp("(^|[^a-z])" + w.replace(/-/g, "\\-") + "(?=$|[^a-z])", "i");
      if (re.test(body)) return true;
    }
    for (const p of BANNED_PHRASES) if (lower.includes(p)) return true;
    return false;
  }

  // ----- POST /api/admin/rewrite -----
  // Body: { slugs?: string[]; allViolators?: boolean; limit?: number; concurrency?: number }
  // Header: x-admin-secret: <ADMIN_SECRET>
  // Runs Claude rewrites for the requested articles, with the strict voice
  // gate. Saves to Bunny via saveArticle. Returns a result summary.
  let rewriteInFlight = false;
  app.post("/api/admin/rewrite", express.json(), async (req, res) => {
    if (!ADMIN_SECRET || req.header("x-admin-secret") !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    if (rewriteInFlight) {
      return res.status(409).json({ ok: false, error: "rewrite already in flight" });
    }
    rewriteInFlight = true;
    const body = (req.body || {}) as { slugs?: string[]; allViolators?: boolean; limit?: number; concurrency?: number };
    const conc = Math.max(1, Math.min(8, body.concurrency || 4));
    const limit = Math.max(1, Math.min(200, body.limit || 200));

    // Build target slug list
    let targets: { slug: string; title: string }[] = [];
    try {
      const all = listAllArticles();
      if (Array.isArray(body.slugs) && body.slugs.length) {
        const wanted = new Set(body.slugs);
        targets = all.filter((a) => wanted.has(a.slug)).map((a) => ({ slug: a.slug, title: a.title }));
      } else if (body.allViolators) {
        targets = all
          .filter((a) => a.published === true && isViolator(a.bodyMarkdown || ""))
          .slice(0, limit)
          .map((a) => ({ slug: a.slug, title: a.title }));
      } else {
        rewriteInFlight = false;
        return res.status(400).json({ ok: false, error: "send { slugs: [...] } or { allViolators: true }" });
      }
    } catch (e) {
      rewriteInFlight = false;
      return res.status(500).json({ ok: false, error: (e as Error).message });
    }

    // Respond immediately; run rewrite in the background.
    res.json({ ok: true, started: targets.length, concurrency: conc, limit, mode: body.allViolators ? "all-violators" : "slug-list" });

    (async () => {
      const startedAt = Date.now();
      let ok = 0, failed = 0;
      let cursor = 0;
      const results: { slug: string; status: string; error?: string }[] = [];
      console.log(`[admin:rewrite] running ${targets.length} articles conc=${conc}`);
      async function worker(id: number) {
        while (cursor < targets.length) {
          const i = cursor++;
          const t = targets[i];
          const tag = `[admin:rewrite ${i + 1}/${targets.length} w${id}] ${t.slug}`;
          try {
            const orig = listAllArticles().find((a) => a.slug === t.slug);
            if (!orig) {
              console.error(`${tag} original not found`);
              results.push({ slug: t.slug, status: "missing" });
              failed++;
              continue;
            }
            const fresh = await generateWithRetry(orig.title, 5);
            const now = new Date().toISOString();
            const merged = {
              ...orig,
              bodyMarkdown: fresh.bodyMarkdown,
              dek: fresh.dek || orig.dek,
              wordCount: fresh.wordCount,
              voiceScore: fresh.voiceScore,
              researchers: fresh.researchers,
              inlineProducts: fresh.inlineProducts,
              bottomProducts: fresh.bottomProducts,
              updatedAt: now,
              author: "The Oracle Lover",
              byline: `By The Oracle Lover - ${new Date(now).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
              source: "claude-sonnet-4-5",
            } as any;
            await saveArticle(merged);
            console.log(`${tag} OK ${fresh.wordCount}w v=${fresh.voiceScore}`);
            results.push({ slug: t.slug, status: "rewritten" });
            ok++;
          } catch (e) {
            const msg = (e as Error).message || "unknown";
            console.error(`${tag} FAIL: ${msg}`);
            results.push({ slug: t.slug, status: "failed", error: msg });
            failed++;
          }
        }
      }
      try {
        await Promise.all(Array.from({ length: conc }, (_, i) => worker(i)));
      } finally {
        rewriteInFlight = false;
      }
      const ms = Date.now() - startedAt;
      console.log(`[admin:rewrite] DONE in ${Math.round(ms / 1000)}s ok=${ok} failed=${failed}`);
      // Stash last run for /api/admin/rewrite-status
      (globalThis as any).__lastRewriteRun = { startedAt, finishedAt: Date.now(), ok, failed, results };
    })().catch((e) => {
      console.error("[admin:rewrite] background error:", e);
      rewriteInFlight = false;
    });
  });

  app.get("/api/admin/rewrite-status", (req, res) => {
    if (!ADMIN_SECRET || req.header("x-admin-secret") !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    res.json({
      ok: true,
      inFlight: rewriteInFlight,
      lastRun: (globalThis as any).__lastRewriteRun || null,
    });
  });

  app.post("/api/admin/refresh", async (req, res) => {
    if (!ADMIN_SECRET || req.header("x-admin-secret") !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    try {
      const t = Date.now();
      const r = await bootstrapStore();
      res.json({
        ok: true,
        refreshed: r,
        ms: Date.now() - t,
        instance: process.env.RAILWAY_REPLICA_ID || process.env.HOSTNAME || "unknown",
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: (e as Error).message });
    }
  });

  setInterval(() => {
    bootstrapStore()
      .then((r) => console.log(`[periodic-resync] driver=${r.driver} pulled=${r.pulled} total=${r.total}`))
      .catch((e) => console.error(`[periodic-resync] failed:`, e));
  }, 30 * 60 * 1000);

  app.get("/health", (_req, res) => {
    try {
      const arts = listArticles();
      const all = listAllArticles();
      res.json({
        ok: true,
        site: "anger-practice",
        articles: arts.length,
        total: all.length,
        storageDriver: activeDriver(),
        autoGen: (process.env.AUTO_GEN_ENABLED ?? "true").toLowerCase() === "true",
        writingEngine: "claude-sonnet-4-5",
        time: new Date().toISOString(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: (e as Error).message });
    }
  });

  // ---------- static + SSR head injection ----------
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Read the index.html shell into memory once (it's small), so every SSR
  // response doesn't pay disk-read cost. We re-read in dev to pick up edits.
  const SHELL_PATH = path.join(staticPath, "index.html");
  let shellCache = "";
  function getShell(): string {
    if (process.env.NODE_ENV === "production") {
      if (!shellCache) shellCache = fs.readFileSync(SHELL_PATH, "utf8");
      return shellCache;
    }
    try {
      return fs.readFileSync(SHELL_PATH, "utf8");
    } catch {
      return shellCache;
    }
  }

  // Asset files (CSS/JS/images/etc.) - serve directly. Anything that's NOT
  // an HTML page goes through express.static.
  app.use(
    express.static(staticPath, {
      index: false, // we handle "/" via SSR below
      setHeaders: (res, p) => {
        if (p.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );

  // SSR head injection for HTML routes. Anything that doesn't match a static
  // asset extension and isn't /api or one of the special txt routes lands
  // here and gets a fully rendered <head>.
  app.get("*", (req, res, next) => {
    // Skip files with extensions (assets) and API/admin/sitemap/llms paths.
    const reqPath = req.path;
    if (/\.[a-z0-9]{1,6}$/i.test(reqPath)) return next();
    if (
      reqPath.startsWith("/api/") ||
      reqPath === "/sitemap.xml" ||
      reqPath === "/robots.txt" ||
      reqPath === "/llms.txt" ||
      reqPath === "/llms-full.txt" ||
      reqPath === "/health"
    ) {
      return next();
    }

    const fullPath = req.originalUrl;
    let ctx;
    try {
      const articleMatch = reqPath.match(/^\/article\/([a-z0-9-]+)$/i);
      if (articleMatch) {
        const slug = articleMatch[1];
        const article = listAllArticles().find((a) => a.slug === slug);
        if (article) {
          ctx = buildArticleContext({
            ...article,
            heroImage: `${PULL_BASE}/articles-hero/${slug}.webp`,
          } as any);
        } else {
          ctx = buildStaticContext(fullPath, "Article", "Article not found.");
        }
      } else if (reqPath === "/" || reqPath === "") {
        const arts = listArticles();
        ctx = buildHomeContext(arts.map((a) => ({ slug: a.slug, title: a.title })));
      } else if (reqPath === "/articles") {
        const arts = listArticles();
        ctx = buildArticlesIndexContext(
          arts.map((a) => ({ slug: a.slug, title: a.title, dek: a.dek || "", publishedAt: a.publishedAt })),
        );
      } else if (reqPath === "/about") {
        ctx = buildAboutContext();
      } else if (reqPath === "/assessments") {
        ctx = buildStaticContext(
          fullPath,
          "Assessments",
          "Nine nurturing self-assessments for anger, suppression, somatic patterns, and emotional regulation.",
        );
      } else if (reqPath === "/herbs") {
        ctx = buildStaticContext(
          fullPath,
          "Herbal Cabinet",
          "Verified nervines, adaptogens, and supplements for anger, sleep, and nervous-system regulation.",
        );
      } else if (reqPath === "/fire-toolkit") {
        ctx = buildStaticContext(
          fullPath,
          "Fire Toolkit",
          "In-the-moment practices for moving through anger, with body-anchored exercises.",
        );
      } else {
        ctx = buildStaticContext(fullPath, "The Anger Practice", "A literary journal on healthy anger and emotional healing.");
      }
      // Always rewrite canonical to the cleaned URL for the actual request
      ctx.canonical = canonicalUrl(fullPath);
    } catch (e) {
      console.error("[ssr] context error:", (e as Error).message);
      // Fallback - serve the bare shell
      return res.sendFile(SHELL_PATH);
    }

    try {
      const shell = getShell();
      const html = injectHead(shell, ctx);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "no-cache");
      res.send(html);
    } catch (e) {
      console.error("[ssr] inject error:", (e as Error).message);
      res.sendFile(SHELL_PATH);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    console.error(`[fatal] http server error code=${err.code} message=${err.message}`);
    process.exit(1);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[ready] server listening on http://0.0.0.0:${PORT}/`);
  });

  try {
    startCrons();
  } catch (e) {
    console.error("[cron] failed to start:", e);
  }
}

startServer().catch((e) => {
  console.error("[fatal] startServer rejected:", e && (e.stack || e));
  process.exit(1);
});
// rebuild trigger 2026-05-28T13:36:00Z
