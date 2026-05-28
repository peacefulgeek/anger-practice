import { generateWithRetry } from "../src/lib/generator.ts";

async function main() {
  console.log("starting Claude smoke test...");
  const t0 = Date.now();
  const a = await generateWithRetry("Anger and Blood Pressure: Honest Numbers", 3);
  console.log("got article in", Math.round((Date.now() - t0) / 1000), "s wc=", a.wordCount, "voice=", a.voiceScore);
  console.log("head:", a.bodyMarkdown.slice(0, 500));
}
main().catch((e) => { console.error(e); process.exit(1); });
