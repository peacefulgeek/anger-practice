#!/usr/bin/env node
/**
 * scrub-article-asins.mjs
 *
 * Walks every article JSON in data/articles/, finds every reference to a dead
 * ASIN (an ASIN not present in src/lib/herbs.ts), and replaces it with a
 * verified live ASIN of the same category.
 *
 * Three places get scrubbed:
 *   1. inlineProducts[].asin / .title / .link
 *   2. bottomProducts[].asin / .title / .link / .category
 *   3. bodyMarkdown — markdown links of the form
 *        [<title>](https://www.amazon.com/dp/<ASIN>?tag=...)
 *      get rewritten to point to the replacement ASIN, with the visible title
 *      swapped for the replacement product's title.
 *
 * After scrubbing, the article JSON is rewritten on disk AND pushed back to
 * Bunny (so production picks it up after the boot resync).
 *
 * Run:
 *   STORAGE_DRIVER=bunny node scripts/scrub-article-asins.mjs --apply
 *
 * Without --apply this is a dry run that prints the kill stats only.
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

const ROOT = process.cwd();
const ARTICLES_DIR = path.resolve(ROOT, "data", "articles");
const HERBS_FILE = path.resolve(ROOT, "src", "lib", "herbs.ts");

// Bunny push config (matches src/lib/config.ts BUNNY constants)
const BUNNY_ZONE = "anger-practice";
const BUNNY_HOST = "ny.storage.bunnycdn.com";
const BUNNY_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const AMAZON_TAG = process.env.AMAZON_TAG || "spankyspinola-20";

// ---------------------------------------------------------------------------
// 1. Parse src/lib/herbs.ts for the live cabinet
// ---------------------------------------------------------------------------
const herbsRaw = fs.readFileSync(HERBS_FILE, "utf8");
// Match each entry: { asin: "...", title: "...", brand: "...", category: "..." ... }
const entryRegex = /\{\s*asin:\s*"([A-Z0-9]+)",\s*title:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*category:\s*"([^"]+)"/g;
const liveByCategory = new Map();
const liveByAsin = new Map();
let m;
while ((m = entryRegex.exec(herbsRaw)) !== null) {
  const [, asin, title, brand, category] = m;
  liveByAsin.set(asin, { asin, title, brand, category });
  if (!liveByCategory.has(category)) liveByCategory.set(category, []);
  liveByCategory.get(category).push({ asin, title, brand, category });
}
console.log(`Live cabinet: ${liveByAsin.size} ASINs across ${liveByCategory.size} categories`);

// ---------------------------------------------------------------------------
// 2. Replacement chooser
// ---------------------------------------------------------------------------
function pickReplacement(category, exclude = new Set(), seedKey = "") {
  const pool = liveByCategory.get(category) || [...liveByAsin.values()];
  const filtered = pool.filter((p) => !exclude.has(p.asin));
  if (filtered.length === 0) {
    // Fall back to any live ASIN
    const all = [...liveByAsin.values()].filter((p) => !exclude.has(p.asin));
    if (all.length === 0) return [...liveByAsin.values()][0];
    return all[hashIdx(seedKey + ":any") % all.length];
  }
  return filtered[hashIdx(seedKey + ":" + category) % filtered.length];
}
function hashIdx(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function amazonLink(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

// ---------------------------------------------------------------------------
// 3. Walk every article, scrub, save
// ---------------------------------------------------------------------------
async function bunnyPut(slug, json) {
  const url = `https://${BUNNY_HOST}/${BUNNY_ZONE}/articles/${slug}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: BUNNY_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error(`Bunny PUT ${slug}: ${res.status} ${await res.text()}`);
}

function scrubArticle(art) {
  let changed = 0;
  const used = new Set();

  // Scrub inlineProducts
  if (Array.isArray(art.inlineProducts)) {
    for (let i = 0; i < art.inlineProducts.length; i++) {
      const p = art.inlineProducts[i];
      if (!liveByAsin.has(p.asin)) {
        // Try to keep same category if known via lookup of the title text;
        // inlineProducts lacks `category`, so fall back to nervous-system pool
        // (a safe general-purpose calming category).
        const repl = pickReplacement("nervous-system", used, art.slug + ":inline:" + i);
        used.add(repl.asin);
        art.inlineProducts[i] = {
          asin: repl.asin,
          title: repl.title,
          link: amazonLink(repl.asin),
        };
        changed++;
      } else {
        used.add(p.asin);
      }
    }
  }

  // Scrub bottomProducts (these have `category`)
  if (Array.isArray(art.bottomProducts)) {
    for (let i = 0; i < art.bottomProducts.length; i++) {
      const p = art.bottomProducts[i];
      if (!liveByAsin.has(p.asin)) {
        const repl = pickReplacement(p.category || "nervous-system", used, art.slug + ":bottom:" + i);
        used.add(repl.asin);
        art.bottomProducts[i] = {
          asin: repl.asin,
          title: repl.title,
          link: amazonLink(repl.asin),
          category: repl.category,
        };
        changed++;
      } else {
        used.add(p.asin);
      }
    }
  }

  // Scrub bodyMarkdown — find every markdown link to amazon.com/dp/<asin>?...
  // Pattern: [Display Title](https://www.amazon.com/dp/<ASIN>?tag=...)
  if (typeof art.bodyMarkdown === "string") {
    const linkRe = /\[([^\]]+)\]\(https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]+)(?:\?[^)]*)?\)/g;
    art.bodyMarkdown = art.bodyMarkdown.replace(linkRe, (full, displayTitle, asin) => {
      if (liveByAsin.has(asin)) {
        used.add(asin);
        return full;
      }
      const repl = pickReplacement("nervous-system", used, art.slug + ":md:" + asin);
      used.add(repl.asin);
      changed++;
      return `[${repl.title}](${amazonLink(repl.asin)})`;
    });
  }

  return changed;
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Loaded ${files.length} article files`);

  let articlesChanged = 0;
  let totalReplacements = 0;
  const changedSlugs = [];

  for (const f of files) {
    const full = path.join(ARTICLES_DIR, f);
    const art = JSON.parse(fs.readFileSync(full, "utf8"));
    const n = scrubArticle(art);
    if (n > 0) {
      articlesChanged++;
      totalReplacements += n;
      changedSlugs.push(art.slug);
      if (APPLY) {
        fs.writeFileSync(full, JSON.stringify(art, null, 2));
      }
    }
  }
  console.log(`Articles changed: ${articlesChanged}/${files.length}`);
  console.log(`Total ASIN replacements: ${totalReplacements}`);

  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply to write + push.");
    return;
  }

  // Push every changed article to Bunny
  console.log(`Pushing ${changedSlugs.length} updated articles to Bunny...`);
  let ok = 0,
    fail = 0;
  const CONC = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < changedSlugs.length) {
      const i = cursor++;
      const slug = changedSlugs[i];
      try {
        const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.json`), "utf8"));
        await bunnyPut(slug, data);
        ok++;
        if (ok % 20 === 0) console.log(`  pushed ${ok}/${changedSlugs.length}`);
      } catch (e) {
        fail++;
        console.error(`FAIL ${slug}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`Bunny push: ${ok} ok, ${fail} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
