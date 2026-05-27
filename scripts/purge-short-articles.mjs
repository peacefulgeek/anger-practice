// One-time sweep: delete every article on Bunny (and local) under 1800 words.
// This protects the publish floor — when the cron promotes a matured gated
// article it will only find articles that already pass the floor.
import fs from "node:fs";
import path from "node:path";

const ZONE = "anger-practice";
const KEY = "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const STORAGE = `https://ny.storage.bunnycdn.com/${ZONE}`;
const FLOOR = 1800;

function wordCount(md) {
  return (md || "").trim().split(/\s+/).filter(Boolean).length;
}

async function listBunny() {
  const r = await fetch(`${STORAGE}/articles/`, {
    headers: { AccessKey: KEY, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`list ${r.status}`);
  const rows = await r.json();
  return rows
    .filter((x) => !x.IsDirectory && x.ObjectName.endsWith(".json") && !x.ObjectName.startsWith("_"))
    .map((x) => x.ObjectName);
}

async function getArticle(name) {
  const r = await fetch(`${STORAGE}/articles/${name}`, { headers: { AccessKey: KEY } });
  if (!r.ok) throw new Error(`get ${name} ${r.status}`);
  return await r.json();
}

async function delBunny(name) {
  const r = await fetch(`${STORAGE}/articles/${name}`, {
    method: "DELETE",
    headers: { AccessKey: KEY },
  });
  if (!r.ok) throw new Error(`del ${name} ${r.status}`);
}

const bunnyFiles = await listBunny();
console.log(`[purge] ${bunnyFiles.length} files on Bunny`);

const short = [];
for (const name of bunnyFiles) {
  try {
    const a = await getArticle(name);
    const wc = a.wordCount || wordCount(a.body || a.content || "");
    if (wc < FLOOR) short.push({ name, wc, slug: a.slug });
  } catch (e) {
    console.error(`[purge] read fail ${name}: ${e.message}`);
  }
}

console.log(`[purge] ${short.length} articles under ${FLOOR} words on Bunny`);
for (const s of short) console.log(`  - ${s.name}  ${s.wc}w`);

if (process.argv.includes("--apply")) {
  console.log(`[purge] applying deletions...`);
  let killed = 0;
  for (const s of short) {
    try {
      await delBunny(s.name);
      killed++;
      // also delete local cache copy if present
      const local = path.resolve(process.cwd(), "data", "articles", s.name);
      if (fs.existsSync(local)) fs.unlinkSync(local);
    } catch (e) {
      console.error(`[purge] del fail ${s.name}: ${e.message}`);
    }
  }
  console.log(`[purge] deleted ${killed} short articles`);
} else {
  console.log("[purge] DRY RUN — pass --apply to actually delete");
}
