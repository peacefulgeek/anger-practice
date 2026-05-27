#!/usr/bin/env node
/**
 * apply-asin-verdicts.mjs
 *
 * Reads /home/ubuntu/verify_asins_v2.json (the parallel verification result),
 * computes which ASINs in src/lib/herbs.ts must be removed (status != "ok"),
 * prints the kill list, then rewrites src/lib/herbs.ts in place by deleting
 * any line whose `asin: "..."` matches a kill ASIN.
 *
 * The herbs.ts file uses one entry per line, so a line-based delete is safe.
 */
import fs from "node:fs";
import path from "node:path";

const RESULT_FILE = "/home/ubuntu/verify_asins_v2.json";
const HERBS_FILE = path.resolve(process.cwd(), "src", "lib", "herbs.ts");

const raw = JSON.parse(fs.readFileSync(RESULT_FILE, "utf8"));
const rows = raw.results || raw;

const verdicts = new Map();
for (const r of rows) {
  const asin = r.input || (r.output && r.output.asin);
  const status = (r.output && r.output.status) || "blocked";
  const title = (r.output && r.output.product_title) || "";
  const notes = (r.output && r.output.notes) || "";
  if (asin) verdicts.set(asin, { status, title, notes });
}

const counts = { ok: 0, not_found: 0, unavailable: 0, redirect: 0, blocked: 0, other: 0 };
const kills = [];
for (const [asin, v] of verdicts.entries()) {
  if (v.status === "ok") counts.ok++;
  else if (v.status === "not_found") { counts.not_found++; kills.push({ asin, ...v }); }
  else if (v.status === "unavailable") { counts.unavailable++; kills.push({ asin, ...v }); }
  else if (v.status === "redirect") { counts.redirect++; kills.push({ asin, ...v }); }
  else if (v.status === "blocked") { counts.blocked++; kills.push({ asin, ...v }); }
  else { counts.other++; kills.push({ asin, ...v }); }
}

console.log("=== Verdict counts ===");
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
console.log(`  total: ${verdicts.size}`);

console.log("\n=== Kill list (will be removed from herbs.ts) ===");
for (const k of kills) {
  console.log(`  ${k.asin} [${k.status}] ${k.title.slice(0, 60)} — ${k.notes.slice(0, 80)}`);
}

if (process.argv.includes("--apply")) {
  const lines = fs.readFileSync(HERBS_FILE, "utf8").split("\n");
  const killSet = new Set(kills.map((k) => k.asin));
  const out = [];
  let removed = 0;
  for (const line of lines) {
    const m = line.match(/asin:\s*"([A-Z0-9]+)"/);
    if (m && killSet.has(m[1])) {
      removed++;
      continue;
    }
    out.push(line);
  }
  fs.writeFileSync(HERBS_FILE, out.join("\n"));
  console.log(`\nRemoved ${removed} entries from ${HERBS_FILE}`);
} else {
  console.log("\nDry run. Re-run with --apply to rewrite herbs.ts.");
}
