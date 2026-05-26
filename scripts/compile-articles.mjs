#!/usr/bin/env node
// Compile /data/articles/*.json into client/src/data/articles.json for the client bundle,
// sorted by publishedAt descending (newest first).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "data", "articles");
const outPath = path.join(root, "client", "src", "data", "articles.json");

const files = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter((f) => f.endsWith(".json"))
  : [];
const all = files.map((f) =>
  JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"))
);

// LIVE-ONLY: an article is bundled to the client only if it is genuinely public.
// Gated drafts (published: false OR future scheduledFor) are kept out of the bundle.
const now = Date.now();
const isLive = (a) => {
  if (a.published !== true) return false;
  if (!a.publishedAt) return false;
  if (new Date(a.publishedAt).getTime() > now) return false;
  if (a.scheduledFor && new Date(a.scheduledFor).getTime() > now) return false;
  return true;
};
const articles = all.filter(isLive);
articles.sort((a, b) =>
  new Date(b.publishedAt || b.createdAt).getTime() -
  new Date(a.publishedAt || a.createdAt).getTime()
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(articles, null, 2));
console.log(
  `Compiled ${articles.length} live articles → ${outPath} (${all.length - articles.length} gated kept server-side)`,
);
