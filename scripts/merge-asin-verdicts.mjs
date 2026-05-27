#!/usr/bin/env node
/**
 * merge-asin-verdicts.mjs
 *
 * Merge results from verify_asins_v2.json + verify_asins_retry.json.
 * For any ASIN, if the retry returned a non-"blocked" status, that wins
 * (because the original "blocked" was likely a CAPTCHA false positive).
 * Then compute the final kill list (anything not "ok") and rewrite herbs.ts.
 */
import fs from "node:fs";
import path from "node:path";

const PRIMARY = "/home/ubuntu/verify_asins_v2.json";
const RETRY = "/home/ubuntu/verify_asins_retry.json";
const HERBS_FILE = path.resolve(process.cwd(), "src", "lib", "herbs.ts");

function loadRows(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return raw.results || raw;
}

const primary = loadRows(PRIMARY);
const retry = loadRows(RETRY);

const verdicts = new Map();
for (const r of primary) {
  const asin = r.input || (r.output && r.output.asin);
  const status = (r.output && r.output.status) || "blocked";
  const title = (r.output && r.output.product_title) || "";
  const notes = (r.output && r.output.notes) || "";
  if (asin) verdicts.set(asin, { status, title, notes, source: "primary" });
}
for (const r of retry) {
  const asin = r.input || (r.output && r.output.asin);
  const status = (r.output && r.output.status) || "blocked";
  const title = (r.output && r.output.product_title) || "";
  const notes = (r.output && r.output.notes) || "";
  // Retry wins unless retry itself is "blocked"
  if (asin && status !== "blocked") {
    verdicts.set(asin, { status, title, notes, source: "retry" });
  }
}

const counts = { ok: 0, not_found: 0, unavailable: 0, redirect: 0, blocked: 0, other: 0 };
const kills = [];
const keeps = [];
for (const [asin, v] of verdicts.entries()) {
  if (v.status === "ok") {
    counts.ok++;
    keeps.push(asin);
  } else {
    counts[v.status] = (counts[v.status] || 0) + 1;
    kills.push({ asin, ...v });
  }
}

console.log("=== Verdict counts (after retry merge) ===");
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
console.log(`  total: ${verdicts.size}, keep: ${keeps.length}, kill: ${kills.length}`);

console.log("\n=== Final kill list ===");
for (const k of kills) {
  console.log(`  ${k.asin} [${k.status}] ${k.title.slice(0, 60)} — ${k.notes.slice(0, 80)} (src: ${k.source})`);
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
