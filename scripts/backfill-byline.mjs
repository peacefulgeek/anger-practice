#!/usr/bin/env node
// Append the theoraclelover.com byline paragraph to any article that lacks it.
import fs from "fs";
import path from "path";

const dir = path.resolve("data/articles");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const byline =
  "\n\n---\n\n*Written by The Oracle Lover. The Anger Practice is a companion journal to [theoraclelover.com](https://theoraclelover.com). We don't do influencer tone or spiritual bypassing. We write honestly about what anger is asking of you.*";

let fixed = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const a = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!String(a.bodyMarkdown || "").toLowerCase().includes("theoraclelover.com")) {
    a.bodyMarkdown = (a.bodyMarkdown || "") + byline;
    a.wordCount = String(a.bodyMarkdown).trim().split(/\s+/).length;
    fs.writeFileSync(p, JSON.stringify(a, null, 2));
    fixed++;
    console.log(`  + ${a.slug}`);
  }
}
console.log(`Backfilled byline on ${fixed} article(s).`);
