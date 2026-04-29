import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { startCrons } from "../src/cron/index.js";
import { listArticles } from "../src/lib/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
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

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });

  try {
    startCrons();
  } catch (e) {
    console.error("[cron] failed to start:", e);
  }
}

startServer().catch(console.error);
