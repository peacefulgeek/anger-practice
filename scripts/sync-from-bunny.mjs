// Pull every article + queue from Bunny into local data/.
// Use this in dev whenever you want a clean local mirror of canonical Bunny state.
import fs from "node:fs";
import path from "node:path";

const ZONE = "anger-practice";
const KEY = "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const STORAGE = `https://ny.storage.bunnycdn.com/${ZONE}`;
const ROOT = process.cwd();
const ARTS_DIR = path.resolve(ROOT, "data", "articles");
const QUEUE_PATH = path.resolve(ROOT, "data", "topics-queue.json");

fs.mkdirSync(ARTS_DIR, { recursive: true });

const listResp = await fetch(`${STORAGE}/articles/`, {
  headers: { AccessKey: KEY, Accept: "application/json" },
});
if (!listResp.ok) throw new Error(`list ${listResp.status}`);
const rows = await listResp.json();
const names = rows
  .filter((x) => !x.IsDirectory && x.ObjectName.endsWith(".json"))
  .map((x) => x.ObjectName);

console.log(`[sync] ${names.length} files on Bunny → pulling into ${ARTS_DIR}`);

let pulled = 0;
const CONCURRENCY = 10;
for (let i = 0; i < names.length; i += CONCURRENCY) {
  const batch = names.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (name) => {
      const r = await fetch(`${STORAGE}/articles/${name}`, { headers: { AccessKey: KEY } });
      if (!r.ok) {
        console.error(`[sync] ${name}: ${r.status}`);
        return;
      }
      const text = await r.text();
      fs.writeFileSync(path.join(ARTS_DIR, name), text);
      pulled++;
    }),
  );
  process.stdout.write(`\r[sync] ${pulled}/${names.length}...`);
}
console.log(`\n[sync] articles pulled: ${pulled}`);

// queue
try {
  const q = await fetch(`${STORAGE}/data/topics-queue.json`, { headers: { AccessKey: KEY } });
  if (q.ok) {
    fs.writeFileSync(QUEUE_PATH, await q.text());
    console.log(`[sync] queue pulled to ${QUEUE_PATH}`);
  }
} catch (e) {
  console.error(`[sync] queue: ${e.message}`);
}
