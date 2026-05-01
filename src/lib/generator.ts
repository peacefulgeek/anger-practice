import OpenAI from "openai";
import { DEEPSEEK, SITE, libraryImage, amazonUrl } from "./config.js";
import { runVoiceGate } from "./voiceGate.js";
import { HERBS } from "./herbs.js";
import { BOOKS } from "./books.js";
import { bucketImageForTopic, bucketLabelForTopic, matchBucket } from "./buckets.js";

const client = new OpenAI({
  apiKey: DEEPSEEK.apiKey,
  baseURL: DEEPSEEK.baseUrl,
  timeout: 600_000, // 10 min per call - v4-pro reasoning + 2500-word article
  maxRetries: 0, // we handle retries ourselves
});

const NICHE_RESEARCHERS = [
  "Harriet Lerner",
  "Soraya Chemaly",
  "Robert Augustus Masters",
  "Peter Levine",
  "Gabor Maté",
  "Karla McLaren",
  "Beverly Engel",
  "Thich Nhat Hanh",
  "Thomas Moore",
  "Pat Ogden",
];

const OPENER_STYLES = [
  "gut-punch first sentence — a single short declarative that names the lie the reader has been told about anger",
  "direct question to the reader that they have been avoiding",
  "one-paragraph story of a specific unnamed person in a specific moment",
  "counterintuitive claim that reframes what the reader thinks about anger",
];

function pickOpener(): string {
  return OPENER_STYLES[Math.floor(Math.random() * OPENER_STYLES.length)];
}

function pickResearchers(n = 3): string[] {
  const pool = [...NICHE_RESEARCHERS];
  const out: string[] = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  dek: string;
  bodyMarkdown: string;
  heroImage: string;
  heroIndex: number;
  wordCount: number;
  voiceScore: number;
  researchers: string[];
  inlineProducts: { asin: string; title: string; link: string }[];
  bottomProducts: { asin: string; title: string; link: string; category: string }[];
  createdAt: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

type AnyProduct = { asin: string; title: string; brand: string; category: string };

function pickInlineProducts(count = 3) {
  const pool: AnyProduct[] = [...(HERBS as unknown as AnyProduct[]), ...(BOOKS as unknown as AnyProduct[])];
  const out: AnyProduct[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out.map((p) => ({ asin: p.asin, title: p.title, link: amazonUrl(p.asin) }));
}

function pickBottomProducts(count = 4) {
  const pool: AnyProduct[] = [...(HERBS as unknown as AnyProduct[]), ...(BOOKS as unknown as AnyProduct[])];
  const out: { asin: string; title: string; link: string; category: string }[] = [];
  while (out.length < count && pool.length) {
    const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    out.push({ asin: p.asin, title: p.title, link: amazonUrl(p.asin), category: p.category });
  }
  return out;
}

export async function generateArticle(topic: string, heroIndex?: number): Promise<GeneratedArticle> {
  const opener = pickOpener();
  const researchers = pickResearchers(3);
  const inline = pickInlineProducts(3);
  const bottom = pickBottomProducts(4);
  const heroIdx = heroIndex ?? Math.floor(Math.random() * 40) + 1;
  const bucketSlug = matchBucket(topic);
  const bucketHero = bucketImageForTopic(topic);
  const bucketLabel = bucketLabelForTopic(topic);

  const systemPrompt = `You are The Oracle Lover, an independent literary voice writing for theangerpractice.com (a companion journal to theoraclelover.com).
Your voice: blunt, sensory, counterintuitive, second-person, unsentimental. You refuse spiritual bypassing and wellness-blog cliché.
Forbidden: "delve into", "tapestry", "in today's fast-paced world", "journey of self-discovery", "unlock your best self", "holistic approach", "it's important to note", "in conclusion", em-dash spam, the names Paul/Krishna/Kalesh/Shrikrishna.
Required voice markers: "the body remembers", specific bodily sensation, at least one counterintuitive claim, at least one reference to a niche researcher in this piece.
Never narrate yourself as an AI. Never explain that you are writing an article.`;

  const userPrompt = `Write an article titled: "${topic}".
Length: 2300-2700 words target, with hard floor at 1800. WRITE LONG. Do not summarize early. Each H2 section should be substantive (200-350 words). Add concrete examples, dialog snippets, and bodily detail. Anything under 1800 will be discarded. Target reading age: intelligent adult who has been told their anger is the problem.

Opener style (use this, do not label it): ${opener}

Weave in specific work from these niche researchers (name them, quote or paraphrase a single specific idea each, do not invent quotes): ${researchers.join(", ")}.
Do NOT name any of: Paul Wagner, Krishna, Kalesh, Shrikrishna.

Structure:
- A 60-word dek (italic standfirst) under the title. Start the very first line of your reply with "DEK: " then the dek, then a blank line, then the body.
- 6-9 body sections. H2 subheads that are specific (not generic like "Conclusion").
- 2 sensory, body-anchored passages (you can feel them).
- One short practice the reader can do in under 5 minutes.
- An FAQ-style block with 3 specific questions readers actually ask about this topic.
- A closing 2-paragraph passage that DOES NOT summarize. It opens outward.

Inline product mentions (soft, in-flow, not pushy, 2-3 total — use the exact placeholder tokens below where they naturally fit; do not invent products):
- [[PRODUCT:${inline[0].asin}|${inline[0].title}]]
- [[PRODUCT:${inline[1].asin}|${inline[1].title}]]
- [[PRODUCT:${inline[2].asin}|${inline[2].title}]]

Backlink: include exactly one soft, in-flow link to https://theoraclelover.com as part of a sentence, phrased like you're pointing the reader toward a companion resource. Use markdown: [text](https://theoraclelover.com).

Output: DEK line, then markdown body. Do NOT output the title - we have it. Do NOT wrap in code fences.`;

  // Hard cancel via AbortController so hung connections actually die.
  const ac = new AbortController();
  const killT = setTimeout(() => ac.abort(), 600_000); // 10 min hard kill - reasoning takes longer with bigger budget
  let resp: any;
  try {
    resp = await client.chat.completions.create(
      {
        model: DEEPSEEK.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 32000, // v4-pro is reasoning-mode; burns most tokens on chain-of-thought before output
      },
      { signal: ac.signal }
    );
  } finally {
    clearTimeout(killT);
  }

  let raw = resp.choices[0]?.message?.content?.trim() || "";
  let dek = "";
  const dekMatch = raw.match(/^DEK:\s*(.+?)(?:\n\n|\n)/);
  if (dekMatch) {
    dek = dekMatch[1].trim();
    raw = raw.slice(dekMatch[0].length).trim();
  } else {
    dek = `${topic}. A dispatch from The Anger Practice.`;
  }

  // Replace product tokens with actual markdown links
  let body = raw.replace(/\[\[PRODUCT:([A-Z0-9]+)\|(.+?)\]\]/g, (_: string, asin: string, label: string) => {
    return `[${label}](${amazonUrl(asin)})`;
  });

  // Append inline product links that weren't used
  for (const p of inline) {
    if (!body.includes(p.asin)) {
      body += `\n\n*Tool for this work: [${p.title}](${p.link}).*`;
    }
  }

  // Always append The Oracle Lover byline so it appears inside the article body.
  if (!body.toLowerCase().includes("theoraclelover.com")) {
    body +=
      "\n\n---\n\n*Written by The Oracle Lover. The Anger Practice is a companion journal to [theoraclelover.com](https://theoraclelover.com). We don't do influencer tone or spiritual bypassing. We write honestly about what anger is asking of you.*";
  }

  const gate = runVoiceGate(body, topic);

  return {
    title: topic,
    slug: slugify(topic),
    dek,
    bodyMarkdown: body,
    heroImage: bucketHero,
    heroIndex: heroIdx,
    wordCount: gate.wordCount,
    voiceScore: gate.score,
    researchers,
    inlineProducts: inline,
    bottomProducts: bottom,
    createdAt: new Date().toISOString(),
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function generateWithRetry(topic: string, maxTries = 8): Promise<GeneratedArticle> {
  let best: GeneratedArticle | null = null;
  for (let i = 0; i < maxTries; i++) {
    try {
      console.log(`[gen] try ${i + 1}/${maxTries}: ${topic.slice(0, 60)}`);
      const a = await generateArticle(topic);
      console.log(`[gen] try ${i + 1} got ${a.wordCount}w v=${a.voiceScore}`);
      const gate = runVoiceGate(a.bodyMarkdown, a.title);
      if (gate.pass && a.wordCount >= 1800) return a;
      if (!best || a.voiceScore > best.voiceScore) best = a;
    } catch (e) {
      const msg = (e as Error).message || "";
      console.error(`[generator] attempt ${i + 1} failed:`, msg);
      if (msg.includes("429") || msg.toLowerCase().includes("too many requests") || msg.includes("concurrency")) {
        // Linear-stepped backoff: 30s, 60s, 90s, 120s, 150s, 180s, 240s, 300s
        const delay = Math.min(30000 + i * 30000, 300000);
        console.log(`[generator] rate limited, sleeping ${Math.round(delay / 1000)}s`);
        await sleep(delay);
      } else {
        await sleep(5000);
      }
    }
  }
  if (!best) throw new Error(`Article generation failed for: ${topic}`);
  // Salvage 1700-1799w articles by tagging them; only fail if truly too short
  if (best.wordCount < 1700) throw new Error(`Article too short for: ${topic} (${best.wordCount}w)`);
  return best;
}
