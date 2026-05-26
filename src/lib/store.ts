import fs from "fs";
import path from "path";

// Articles are stored as individual JSON files + a master index.
// In production they are bundled into the build via scripts/compile-articles.mjs
// which writes to client/src/data/articles.json so the client can import them.
//
// We anchor paths off process.cwd() so they resolve identically in dev (tsx from
// project root) and prod (Railway/Nixpacks runs `node dist/index.js` with cwd at
// the project root). The DATA_ROOT env var lets Railway volumes override the
// default location — e.g. set DATA_ROOT=/data when mounting a persistent volume.

const ROOT = process.cwd();
export const DATA_ROOT = process.env.DATA_ROOT
  ? path.resolve(process.env.DATA_ROOT)
  : path.resolve(ROOT, "data");
export const ARTICLES_DIR = path.join(DATA_ROOT, "articles");
export const QUEUE_FILE = path.join(DATA_ROOT, "topics-queue.json");
export const CLIENT_BUNDLE = path.resolve(ROOT, "client", "src", "data", "articles.json");

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
  publishedAt: string | null;
  scheduledFor?: string;
  published?: boolean;
}

export function ensureDirs() {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(CLIENT_BUNDLE), { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, "[]");
}

/**
 * An article is "live" (public-visible) when:
 *   - published === true
 *   - publishedAt exists and is in the past
 *   - scheduledFor (if set) is in the past
 *
 * Gated drafts (published: false OR future scheduledFor) are excluded from the
 * public list. The publish-cron promotes them as their `scheduledFor` matures.
 */
export function isLive(a: StoredArticle, now: Date = new Date()): boolean {
  if (a.published !== true) return false;
  const pubAt = a.publishedAt ? new Date(a.publishedAt) : null;
  if (!pubAt || pubAt.getTime() > now.getTime()) return false;
  if (a.scheduledFor) {
    const s = new Date(a.scheduledFor);
    if (s.getTime() > now.getTime()) return false;
  }
  return true;
}

export function listAllArticles(): StoredArticle[] {
  ensureDirs();
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8")) as StoredArticle)
    .sort((a, b) => {
      const ap = a.publishedAt || a.scheduledFor || a.createdAt;
      const bp = b.publishedAt || b.scheduledFor || b.createdAt;
      return ap < bp ? 1 : -1;
    });
}

/**
 * Public listing — only live articles. This is the function the server API
 * and the client bundle should always use.
 */
export function listArticles(): StoredArticle[] {
  const now = new Date();
  return listAllArticles().filter((a) => isLive(a, now));
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
