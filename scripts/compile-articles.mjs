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
const articles = files.map((f) =>
  JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"))
);
articles.sort((a, b) =>
  new Date(b.publishedAt || b.createdAt).getTime() -
  new Date(a.publishedAt || a.createdAt).getTime()
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(articles, null, 2));
console.log(`Compiled ${articles.length} articles → ${outPath}`);
