import fs from "node:fs";
import path from "node:path";
import { scrubBannedLexicon } from "../src/lib/generator.ts";
import { runVoiceGate } from "../src/lib/voiceGate.ts";

const dir = "data/articles";
const STORAGE_KEY = "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const slugs = [
  "anger-and-the-workplace-speaking-up-without-blowing-up",
  "how-children-learn-to-suppress-their-anger",
  "sleeping-in-separate-rooms-after-the-fight",
  "tcm-and-anger-liver-qi-stagnation-and-rising-fire",
  "walking-away-vs-disappearing-two-different-things",
  "what-your-partners-tone-is-doing-to-your-nervous-system",
  "when-your-partners-family-is-the-problem",
];

async function main() {
  let fixed = 0, pushed = 0;
  for (const slug of slugs) {
    const fp = path.join(dir, slug + ".json");
    const a = JSON.parse(fs.readFileSync(fp, "utf8"));
    const before = a.bodyMarkdown;
    const after = scrubBannedLexicon(before);
    if (after !== before) {
      a.bodyMarkdown = after;
      a.updatedAt = new Date().toISOString();
      const json = JSON.stringify(a, null, 2);
      fs.writeFileSync(fp, json);
      fixed++;
      const r = runVoiceGate(after, a.title);
      console.log(slug, "pass:", r.pass, "score:", r.score);
      const url = `https://ny.storage.bunnycdn.com/anger-practice/articles/${slug}.json`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
        body: json,
      });
      if (res.ok) pushed++; else console.error("push fail", res.status);
    } else {
      console.log(slug, "no change");
    }
  }
  console.log("fixed:", fixed, "pushed:", pushed);
}
main().catch((e) => { console.error(e); process.exit(1); });
