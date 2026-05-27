// ===========================================================================
// Crash handlers FIRST. If any import or top-level code throws, we want a
// readable line in Railway's deploy logs instead of a silent exit.
// ===========================================================================
process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaughtException:", err && (err.stack || err));
  // Don't exit — let Railway's restart policy handle persistence.
});
process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandledRejection:", reason);
});

import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { startCrons } from "../src/cron/index.js";
import { listArticles, bootstrapStore } from "../src/lib/store.js";
import { activeDriver } from "../src/lib/bunnyStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Railway injects PORT. Default to 8080 (Railway's expected default) so that
// if for any reason PORT isn't passed through, the container still binds to
// the port Railway probes against.
const PORT = Number(process.env.PORT) || 8080;

async function startServer() {
  console.log(
    `[boot] node=${process.version} env=${process.env.NODE_ENV || "development"} port=${PORT} driver=${activeDriver()}`,
  );

  // Bootstrap article store FIRST so listArticles() has data to serve.
  // In bunny mode this pulls the article JSON cache down from Bunny on boot.
  const t0 = Date.now();
  const boot = await bootstrapStore();
  console.log(
    `[store] driver=${boot.driver} pulled=${boot.pulled} cached=${boot.total} in ${Date.now() - t0}ms`,
  );

  const app = express();
  const server = createServer(app);

  // API endpoints BEFORE static so they win the catch-all
  // Always normalize heroImage to canonical /articles-hero/<slug>.webp at
  // serve time. This makes the API serve unique-per-article heroes regardless
  // of what's in the cache or what an old generator wrote.
  const PULL_BASE = "https://anger-practice.b-cdn.net";
  function withCanonicalHero<T extends { slug?: string; heroImage?: string }>(a: T): T {
    if (!a || !a.slug) return a;
    return { ...a, heroImage: `${PULL_BASE}/articles-hero/${a.slug}.webp` };
  }
  app.get("/api/articles", (_req, res) => {
    try {
      const arts = listArticles().map(withCanonicalHero);
      res.json(arts);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // sitemap.xml — only published articles + static routes (no gated drafts)
  app.get("/sitemap.xml", (_req, res) => {
    try {
      const base = "https://theangerpractice.com";
      const staticPaths = [
        "/",
        "/articles",
        "/assessments",
        "/herbs",
        "/fire-toolkit",
        "/about",
      ];
      const arts = listArticles();
      const urls: string[] = [];
      for (const p of staticPaths) {
        urls.push(`<url><loc>${base}${p}</loc><changefreq>weekly</changefreq></url>`);
      }
      for (const a of arts) {
        const lastmod = a.publishedAt ? String(a.publishedAt).slice(0, 10) : "";
        urls.push(
          `<url><loc>${base}/article/${a.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq></url>`,
        );
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).type("text/plain").send((e as Error).message);
    }
  });

  app.get("/robots.txt", (_req, res) => {
    res
      .type("text/plain")
      .send(
        `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://theangerpractice.com/sitemap.xml\n`,
      );
  });

  // Admin: force this instance to re-pull from Bunny. Railway runs multiple
  // instances and each has its own in-memory cache; calling this on each
  // instance ensures they all serve fresh data after a Bunny upload.
  // Auth: shared secret in header.
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.JWT_SECRET || "";
  app.post("/api/admin/refresh", async (req, res) => {
    if (!ADMIN_SECRET || req.header("x-admin-secret") !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    try {
      const t = Date.now();
      const r = await bootstrapStore();
      res.json({ ok: true, refreshed: r, ms: Date.now() - t, instance: process.env.RAILWAY_REPLICA_ID || process.env.HOSTNAME || "unknown" });
    } catch (e) {
      res.status(500).json({ ok: false, error: (e as Error).message });
    }
  });

  // Periodic re-sync as a belt-and-suspenders. Every 30 min, every replica
  // independently re-pulls from Bunny so writes propagate across the fleet
  // without manual intervention.
  setInterval(() => {
    bootstrapStore()
      .then((r) => console.log(`[periodic-resync] driver=${r.driver} pulled=${r.pulled} total=${r.total}`))
      .catch((e) => console.error(`[periodic-resync] failed:`, e));
  }, 30 * 60 * 1000);

  app.get("/health", (_req, res) => {
    try {
      const arts = listArticles();
      res.json({
        ok: true,
        site: "anger-practice",
        articles: arts.length,
        storageDriver: activeDriver(),
        autoGen: (process.env.AUTO_GEN_ENABLED ?? "true").toLowerCase() === "true",
        deepseekModel: process.env.OPENAI_MODEL || "deepseek-v4-pro",
        time: new Date().toISOString(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: (e as Error).message });
    }
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Surface bind / listen errors immediately. Without this, EADDRINUSE or
  // EACCES errors die silently and the deploy looks "stuck".
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
// rebuild trigger 2026-05-27T18:41:55Z
