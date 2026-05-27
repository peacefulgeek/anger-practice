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
  app.get("/api/articles", (_req, res) => {
    try {
      res.json(listArticles());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

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
