import fs from "node:fs";
import path from "node:path";
import {
  activeDriver,
  putArticle as putArticleRemote,
  deleteArticle as deleteArticleRemote,
  listSlugs as listSlugsRemote,
  fullResyncFromBunny,
  readQueueRemote,
  writeQueueRemote,
  BUNNY_PATHS,
} from "./bunnyStore.js";

/**
 * Storage layer for articles. Two drivers are supported:
 *   - "local": pure local filesystem (default in dev)
 *   - "bunny": Bunny Storage as source of truth, local-disk used as cache
 *             (default in production / Railway)
 *
 * The server boots, runs `syncCacheFromBunny()` once, then all read paths
 * stay synchronous against the local cache. Writes go through `saveArticle`
 * which updates both Bunny and the cache.
 */

const ROOT = process.cwd();
export const DATA_ROOT = process.env.DATA_ROOT
  ? path.resolve(process.env.DATA_ROOT)
  : path.resolve(ROOT, "data");
export const ARTICLES_DIR = BUNNY_PATHS.CACHE_ART_DIR;
export const QUEUE_FILE = BUNNY_PATHS.CACHE_QUEUE;
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
 * Gated drafts (published: false OR future scheduledFor) are excluded from
 * the public list.
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

/**
 * Boot hook. Call this once during server startup. In bunny mode it pulls
 * any missing article files from Bunny into the local cache.
 */
export async function bootstrapStore(): Promise<{ driver: string; pulled: number; total: number }> {
  ensureDirs();
  const driver = activeDriver();
  if (driver === "bunny") {
    // Force-pull every article on boot so Bunny stays authoritative even if
    // the container has a stale local cache. ~5 MB / 6s for 171 articles.
    const pulled = await fullResyncFromBunny();
    return { driver, pulled, total: fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json")).length };
  }
  return { driver, pulled: 0, total: fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json")).length };
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
 * Public listing — only live articles.
 */
export function listArticles(): StoredArticle[] {
  const now = new Date();
  return listAllArticles().filter((a) => isLive(a, now));
}

/**
 * Persist a single article. Writes to Bunny (if active driver) AND the local
 * cache, then refreshes the client bundle.
 */
export async function saveArticle(a: StoredArticle): Promise<void> {
  ensureDirs();
  const body = JSON.stringify(a, null, 2);
  await putArticleRemote(a.slug, body);
  rebuildClientBundle();
}

/**
 * Local-cache existence check. Use after `bootstrapStore` so the cache is
 * warm.
 */
export function articleExists(slug: string): boolean {
  return fs.existsSync(path.join(ARTICLES_DIR, `${slug}.json`));
}

export async function deleteArticle(slug: string): Promise<void> {
  await deleteArticleRemote(slug);
}

export async function readQueue(): Promise<string[]> {
  return await readQueueRemote();
}

export async function writeQueue(q: string[]): Promise<void> {
  await writeQueueRemote(q);
}

export async function popQueue(): Promise<string | null> {
  const q = await readQueueRemote();
  if (!q.length) return null;
  const topic = q.shift()!;
  await writeQueueRemote(q);
  return topic;
}

export function rebuildClientBundle() {
  const arts = listArticles();
  fs.writeFileSync(CLIENT_BUNDLE, JSON.stringify(arts, null, 2));
}

export async function refreshSlugList(): Promise<string[]> {
  return await listSlugsRemote();
}
