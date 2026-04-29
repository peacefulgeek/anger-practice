import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Articles are stored as individual JSON files + a master index.
// In production they are bundled into the build via scripts/bundle-articles.mjs
// which writes to client/src/data/articles.json so the client can import them.

export const ARTICLES_DIR = path.resolve(__dirname, "..", "..", "data", "articles");
export const QUEUE_FILE = path.resolve(__dirname, "..", "..", "data", "topics-queue.json");
export const CLIENT_BUNDLE = path.resolve(__dirname, "..", "..", "client", "src", "data", "articles.json");

export interface StoredArticle {
  title: string;
  slug: string;
  dek: string;
  bodyMarkdown: string;
  heroImage: string;
  heroIndex: number;
  wordCount: number;
  voiceScore: number;
  researchers: string[];
  inlineProducts: { asin: string; title: string; link: string }[];
  bottomProducts: { asin: string; title: string; link: string; category: string }[];
  createdAt: string;
  publishedAt: string;
}

export function ensureDirs() {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(CLIENT_BUNDLE), { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, "[]");
}

export function listArticles(): StoredArticle[] {
  ensureDirs();
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8")) as StoredArticle)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function saveArticle(a: StoredArticle) {
  ensureDirs();
  fs.writeFileSync(path.join(ARTICLES_DIR, `${a.slug}.json`), JSON.stringify(a, null, 2));
  rebuildClientBundle();
}

export function articleExists(slug: string): boolean {
  return fs.existsSync(path.join(ARTICLES_DIR, `${slug}.json`));
}

export function readQueue(): string[] {
  ensureDirs();
  return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8")) as string[];
}

export function writeQueue(q: string[]) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

export function popQueue(): string | null {
  const q = readQueue();
  if (!q.length) return null;
  const topic = q.shift()!;
  writeQueue(q);
  return topic;
}

export function rebuildClientBundle() {
  const arts = listArticles();
  fs.writeFileSync(CLIENT_BUNDLE, JSON.stringify(arts, null, 2));
}
