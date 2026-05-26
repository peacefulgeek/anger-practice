/**
 * Bunny Storage driver for article JSON files.
 *
 * Why: Railway is a stateless runtime. Without a volume, anything written to
 * the local disk evaporates on every redeploy. We use Bunny Storage as the
 * source of truth for article JSON, with a local-disk cache to keep cold
 * starts and dev iteration fast.
 *
 * Layout on Bunny:
 *   anger-practice/articles/<slug>.json
 *   anger-practice/articles/_index.json   (list of slugs for fast listing)
 *   anger-practice/data/topics-queue.json
 *
 * Public reads go through the pull-zone (CDN-cached, free egress).
 * Writes go through ny.storage.bunnycdn.com with the storage key.
 *
 * Env override:
 *   STORAGE_DRIVER=local  -> force local-disk only (default in dev)
 *   STORAGE_DRIVER=bunny  -> force Bunny (default in prod / Railway)
 *
 * The driver is auto-selected based on NODE_ENV when STORAGE_DRIVER is unset:
 *   NODE_ENV=production -> bunny
 *   anything else       -> local
 */
import fs from "node:fs";
import path from "node:path";
import { BUNNY } from "./config.js";

const STORAGE_HOST = `https://${BUNNY.storageHost}`;
const ZONE = BUNNY.zone;
const STORAGE_KEY = BUNNY.storageKey;
const PULL_ZONE = BUNNY.pullZone;

const ART_PREFIX = "articles";
const QUEUE_PATH = "data/topics-queue.json";
const INDEX_PATH = `${ART_PREFIX}/_index.json`;

// Local cache directory (used for both dev "local" driver and a warm cache in
// "bunny" mode so reads are fast). Anchored on process.cwd() so it works in
// both dev (tsx) and prod (node dist/index.js).
const CACHE_ROOT = process.env.DATA_ROOT
  ? path.resolve(process.env.DATA_ROOT)
  : path.resolve(process.cwd(), "data");
const CACHE_ART_DIR = path.join(CACHE_ROOT, "articles");
const CACHE_QUEUE = path.join(CACHE_ROOT, "topics-queue.json");

function ensureLocalDirs() {
  fs.mkdirSync(CACHE_ART_DIR, { recursive: true });
  if (!fs.existsSync(CACHE_QUEUE)) fs.writeFileSync(CACHE_QUEUE, "[]");
}

export type StorageDriver = "local" | "bunny";

export function activeDriver(): StorageDriver {
  const explicit = (process.env.STORAGE_DRIVER || "").toLowerCase();
  if (explicit === "local" || explicit === "bunny") return explicit;
  return process.env.NODE_ENV === "production" ? "bunny" : "local";
}

// ---------------------------------------------------------------------------
// Low-level Bunny HTTP helpers
// ---------------------------------------------------------------------------

async function bunnyPut(remotePath: string, body: string): Promise<void> {
  const url = `${STORAGE_HOST}/${ZONE}/${remotePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_KEY,
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`bunny PUT ${remotePath} failed: ${res.status} ${text}`);
  }
}

async function bunnyDelete(remotePath: string): Promise<void> {
  const url = `${STORAGE_HOST}/${ZONE}/${remotePath}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { AccessKey: STORAGE_KEY },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`bunny DELETE ${remotePath} failed: ${res.status} ${text}`);
  }
}

/**
 * Read via pull-zone (CDN-cached). Falls back to direct storage GET if the
 * pull-zone returns 404 (which can happen for freshly written files before
 * CDN propagation).
 */
async function bunnyGet(remotePath: string): Promise<string | null> {
  // Try pull-zone first (free, cached)
  const pullUrl = `${PULL_ZONE}/${remotePath}?t=${Date.now()}`;
  let res = await fetch(pullUrl, { cache: "no-store" as RequestCache });
  if (res.status === 200) return await res.text();
  if (res.status !== 404) {
    // Some other error — try direct storage as a fallback
  }
  const storageUrl = `${STORAGE_HOST}/${ZONE}/${remotePath}`;
  res = await fetch(storageUrl, {
    headers: { AccessKey: STORAGE_KEY },
  });
  if (res.status === 200) return await res.text();
  if (res.status === 404) return null;
  throw new Error(`bunny GET ${remotePath} failed: ${res.status}`);
}

/**
 * List object names by directly listing the storage zone subdirectory.
 * Returns an array of `<slug>.json` filenames.
 */
async function bunnyList(prefix: string): Promise<string[]> {
  const url = `${STORAGE_HOST}/${ZONE}/${prefix}/`;
  const res = await fetch(url, {
    headers: { AccessKey: STORAGE_KEY },
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    throw new Error(`bunny LIST ${prefix} failed: ${res.status} ${text}`);
  }
  type Row = { ObjectName: string; IsDirectory: boolean };
  const rows = (await res.json()) as Row[];
  return rows
    .filter((r) => !r.IsDirectory && r.ObjectName.endsWith(".json"))
    .map((r) => r.ObjectName);
}

// ---------------------------------------------------------------------------
// Public driver API (mirrors what store.ts needs)
// ---------------------------------------------------------------------------

export async function putArticle(slug: string, json: string): Promise<void> {
  const driver = activeDriver();
  ensureLocalDirs();
  // Always update the local cache (so subsequent reads are fast and
  // compile-articles.mjs has a snapshot to scan).
  fs.writeFileSync(path.join(CACHE_ART_DIR, `${slug}.json`), json);
  if (driver === "bunny") {
    await bunnyPut(`${ART_PREFIX}/${slug}.json`, json);
  }
}

export async function deleteArticle(slug: string): Promise<void> {
  const driver = activeDriver();
  const local = path.join(CACHE_ART_DIR, `${slug}.json`);
  if (fs.existsSync(local)) fs.unlinkSync(local);
  if (driver === "bunny") {
    await bunnyDelete(`${ART_PREFIX}/${slug}.json`);
  }
}

export async function getArticle(slug: string): Promise<string | null> {
  const driver = activeDriver();
  const local = path.join(CACHE_ART_DIR, `${slug}.json`);
  if (driver === "local") {
    return fs.existsSync(local) ? fs.readFileSync(local, "utf8") : null;
  }
  // bunny: try local cache first (fast path), then Bunny
  if (fs.existsSync(local)) return fs.readFileSync(local, "utf8");
  const remote = await bunnyGet(`${ART_PREFIX}/${slug}.json`);
  if (remote) {
    fs.writeFileSync(local, remote);
  }
  return remote;
}

export async function listSlugs(): Promise<string[]> {
  const driver = activeDriver();
  if (driver === "local") {
    ensureLocalDirs();
    return fs
      .readdirSync(CACHE_ART_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5));
  }
  // bunny: use Bunny's directory listing (single HTTP call) and refresh cache
  const names = await bunnyList(ART_PREFIX);
  return names.map((n) => n.replace(/\.json$/, "")).filter((s) => s !== "_index");
}

/**
 * Pull every article from Bunny into the local cache. Used on server boot in
 * production so that synchronous code paths (e.g. /api/articles serving) can
 * read articles without async-fetching every request.
 */
export async function syncCacheFromBunny(): Promise<{ pulled: number; skipped: number }> {
  ensureLocalDirs();
  if (activeDriver() !== "bunny") return { pulled: 0, skipped: 0 };
  const slugs = await listSlugs();
  let pulled = 0;
  let skipped = 0;
  // Cap concurrency at 16 to be polite to Bunny
  const CONC = 16;
  let cursor = 0;
  async function worker() {
    while (cursor < slugs.length) {
      const i = cursor++;
      const slug = slugs[i];
      const local = path.join(CACHE_ART_DIR, `${slug}.json`);
      if (fs.existsSync(local)) {
        skipped++;
        continue;
      }
      const json = await bunnyGet(`${ART_PREFIX}/${slug}.json`);
      if (json) {
        fs.writeFileSync(local, json);
        pulled++;
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  return { pulled, skipped };
}

/**
 * Force-pull (overwrite) every article from Bunny into local cache.
 */
export async function fullResyncFromBunny(): Promise<number> {
  ensureLocalDirs();
  if (activeDriver() !== "bunny") return 0;
  const slugs = await listSlugs();
  let n = 0;
  const CONC = 16;
  let cursor = 0;
  async function worker() {
    while (cursor < slugs.length) {
      const i = cursor++;
      const slug = slugs[i];
      const local = path.join(CACHE_ART_DIR, `${slug}.json`);
      const json = await bunnyGet(`${ART_PREFIX}/${slug}.json`);
      if (json) {
        fs.writeFileSync(local, json);
        n++;
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  return n;
}

// ---------------------------------------------------------------------------
// Queue (topics-queue.json) — same dual-driver pattern
// ---------------------------------------------------------------------------

export async function readQueueRemote(): Promise<string[]> {
  const driver = activeDriver();
  if (driver === "local") {
    ensureLocalDirs();
    return JSON.parse(fs.readFileSync(CACHE_QUEUE, "utf8")) as string[];
  }
  const text = await bunnyGet(QUEUE_PATH);
  if (!text) {
    // Seed from local cache if Bunny doesn't have it yet
    if (fs.existsSync(CACHE_QUEUE)) {
      const seed = fs.readFileSync(CACHE_QUEUE, "utf8");
      await bunnyPut(QUEUE_PATH, seed);
      return JSON.parse(seed) as string[];
    }
    return [];
  }
  fs.writeFileSync(CACHE_QUEUE, text);
  return JSON.parse(text) as string[];
}

export async function writeQueueRemote(q: string[]): Promise<void> {
  ensureLocalDirs();
  const body = JSON.stringify(q, null, 2);
  fs.writeFileSync(CACHE_QUEUE, body);
  if (activeDriver() === "bunny") {
    await bunnyPut(QUEUE_PATH, body);
  }
}

export const BUNNY_PATHS = {
  ART_PREFIX,
  QUEUE_PATH,
  INDEX_PATH,
  CACHE_ART_DIR,
  CACHE_QUEUE,
};
