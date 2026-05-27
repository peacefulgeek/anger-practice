#!/usr/bin/env node
/**
 * Take /tmp/replenish-candidates.json and the verification results from
 * /home/ubuntu/verify_replenishment_asins.json. Keep only candidates whose
 * verification verdict is "ok". Append them to src/lib/herbs.ts inside the
 * HERBS array (just before the closing `];`). Print a per-category report.
 *
 * Run with --apply to actually rewrite herbs.ts.
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const HERBS = path.resolve(process.cwd(), "src", "lib", "herbs.ts");

const cands = JSON.parse(fs.readFileSync("/tmp/replenish-candidates.json", "utf8"));
const verifyRaw = JSON.parse(fs.readFileSync("/home/ubuntu/verify_replenishment_asins.json", "utf8"));
const rows = verifyRaw.results || verifyRaw;

const verdict = new Map();
for (const r of rows) {
  const a = r.input || r?.output?.asin;
  const s = r?.output?.status || "blocked";
  if (a) verdict.set(a, s);
}

// Merge retry results: if retry returned non-blocked, retry wins
try {
  const retryRaw = JSON.parse(fs.readFileSync("/home/ubuntu/verify_replen_retry.json", "utf8"));
  const retryRows = retryRaw.results || retryRaw;
  for (const r of retryRows) {
    const a = r.input || r?.output?.asin;
    const s = r?.output?.status || "blocked";
    if (a && s !== "blocked") verdict.set(a, s);
  }
} catch (e) {
  // optional file
}

const ok = [];
const drop = [];
for (const c of cands) {
  const v = verdict.get(c.asin);
  if (v === "ok") ok.push(c);
  else drop.push({ ...c, verdict: v || "unknown" });
}

const byCat = {};
for (const c of ok) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(`Verified OK: ${ok.length}, dropped: ${drop.length}`);
console.log("Adding by category:", byCat);
console.log("\nDropped (failed re-verify):");
for (const d of drop) console.log(`  ${d.asin} [${d.verdict}] ${d.title.slice(0, 60)}`);

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply.");
  process.exit(0);
}

// Build TS entries
function esc(s) {
  return (s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
const block = ok
  .map(
    (c) =>
      `  { asin: "${c.asin}", title: "${esc(c.title)}", brand: "${esc(c.brand)}", category: "${c.category}", summary: "${esc(c.summary)}", mechanism: "${esc(c.mechanism)}", caution: "${esc(c.caution)}" },`,
  )
  .join("\n");

const sectionHeader =
  "\n  // ===================== REPLENISHMENT — May 2026 verification pass =====================\n  // " +
  ok.length +
  " entries added after re-verifying live on amazon.com (Add to Cart confirmed).\n";

const herbsRaw = fs.readFileSync(HERBS, "utf8");
// Insert before the `];` that closes the HERBS array. Find the array close
// by locating the unique trailing `\n];\n` after the last `},` in our entries.
const closeIdx = herbsRaw.indexOf("\n];");
if (closeIdx < 0) {
  console.error("Could not locate end of HERBS array");
  process.exit(2);
}
const before = herbsRaw.slice(0, closeIdx);
const after = herbsRaw.slice(closeIdx);
const next = before + sectionHeader + block + "\n" + after;
fs.writeFileSync(HERBS, next);
console.log(`\nAppended ${ok.length} entries to ${HERBS}`);
