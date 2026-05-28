import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE, SITE, AMAZON, amazonUrl } from "./config.js";
import { listAllArticles } from "./store.js";
import { runVoiceGate } from "./voiceGate.js";
import { HERBS } from "./herbs.js";
import { BOOKS } from "./books.js";
import { bucketImageForTopic, bucketLabelForTopic, matchBucket } from "./buckets.js";

/**
 * Article generation pipeline backed by Anthropic Claude.
 *
 * Per FINAL PASS scope: ALL generation, rewrites, and quarterly refreshes
 * route through Claude sonnet-4-5 (Anthropic) using CLAUDE_API_KEY.
 *
 * Output requirements (enforced by `runVoiceGate`):
 *  - 1,800 - 3,200 words
 *  - No em-dashes anywhere
 *  - No banned words / phrases (full PDF list)
 *  - 6 E-E-A-T signals on every article
 *  - Oracle Lover voice (warm, encouraging, divinely inspired, real heart)
 */

const client = new Anthropic({
  apiKey: CLAUDE.apiKey,
  timeout: 600_000,
  maxRetries: 0,
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

// Curated authoritative sources Claude can cite. We pick one at random and the
// model is told to weave it in. This guarantees the E-E-A-T outbound signal
// even if the model tries to skip it.
const AUTHORITATIVE_SOURCES = [
  {
    label: "the NIH overview of anger and the autonomic nervous system",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2864403/",
  },
  {
    label: "the APA's research summary on anger management",
    url: "https://www.apa.org/topics/anger/control",
  },
  {
    label: "the NIMH page on emotional regulation",
    url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
  },
  {
    label: "the CDC's guidance on stress and the body",
    url: "https://www.cdc.gov/mentalhealth/stress-coping/cope-with-stress/index.html",
  },
  {
    label: "PubMed research on anger expression and cardiovascular load",
    url: "https://pubmed.ncbi.nlm.nih.gov/19751988/",
  },
];

// Internal site routes the model can link into. These guarantee the E-E-A-T
// internal-links signal without relying on the model to invent valid slugs.
const INTERNAL_LINKS = [
  { label: "the assessments hub", url: "/assessments" },
  { label: "our herbal cabinet", url: "/herbs" },
  { label: "the fire toolkit", url: "/fire-toolkit" },
  { label: "the about page", url: "/about" },
  { label: "more articles in this journal", url: "/articles" },
];

const OPENER_STYLES = [
  "a single short declarative sentence that names the lie the reader has been told about anger",
  "a direct question to the reader they have been avoiding",
  "a one-paragraph story of a specific unnamed person in a specific moment of unfelt anger",
  "a counterintuitive claim that reframes what the reader thinks anger is for",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
  // E-E-A-T fields persisted on every article
  author: string;
  byline: string;
  updatedAt: string;
  source?: string;
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

const VERIFIED_POOL: AnyProduct[] = [
  ...(HERBS as unknown as AnyProduct[]),
  ...(BOOKS as unknown as AnyProduct[]),
];
const VERIFIED_ASIN_SET = new Set(VERIFIED_POOL.map((p) => p.asin));

function pickInlineProducts(count = 3) {
  const pool: AnyProduct[] = [...VERIFIED_POOL];
  const out: AnyProduct[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out.map((p) => ({ asin: p.asin, title: p.title, link: amazonUrl(p.asin) }));
}

function pickBottomProducts(count = 4) {
  const pool: AnyProduct[] = [...VERIFIED_POOL];
  const out: { asin: string; title: string; link: string; category: string }[] = [];
  while (out.length < count && pool.length) {
    const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    out.push({ asin: p.asin, title: p.title, link: amazonUrl(p.asin), category: p.category });
  }
  return out;
}

/**
 * Replace any em-dash with a plain hyphen surrounded by spaces.
 * Em-dashes are a hard fail in the voice gate.
 */
export function scrubEmDashes(s: string): string {
  return s.replace(/—/g, " - ");
}

/**
 * Plain-English substitutions for stray banned words. Applied AFTER the
 * model has already been told not to use them, as a deterministic safety
 * net for stragglers like "underscore" / "amplify" that Claude likes.
 * Substitutions preserve case and inflection where possible.
 */
const BANNED_WORD_SUBS: Record<string, string> = {
  delve: "look",
  delves: "looks",
  delved: "looked",
  delving: "looking",
  tapestry: "weave",
  paradigm: "frame",
  synergy: "overlap",
  leverage: "use",
  leveraged: "used",
  leveraging: "using",
  unlock: "open",
  unlocked: "opened",
  unlocking: "opening",
  empower: "strengthen",
  empowered: "strengthened",
  empowering: "strengthening",
  empowerment: "strength",
  utilize: "use",
  utilized: "used",
  utilizing: "using",
  utilization: "use",
  pivotal: "central",
  embark: "begin",
  embarking: "beginning",
  underscore: "point to",
  underscores: "points to",
  underscored: "pointed to",
  paramount: "essential",
  seamlessly: "cleanly",
  seamless: "clean",
  beacon: "signal",
  curate: "choose",
  curated: "chosen",
  curating: "choosing",
  bespoke: "custom",
  resonate: "land",
  resonates: "lands",
  resonating: "landing",
  harness: "use",
  harnesses: "uses",
  harnessing: "using",
  intricate: "detailed",
  plethora: "many",
  myriad: "many",
  transformative: "changing",
  groundbreaking: "new",
  innovative: "new",
  revolutionary: "new",
  holistic: "whole-body",
  multifaceted: "layered",
  stakeholders: "people involved",
  ecosystem: "network",
  furthermore: "also",
  moreover: "also",
  additionally: "also",
  consequently: "so",
  subsequently: "then",
  thereby: "so",
  streamline: "simplify",
  streamlined: "simplified",
  streamlining: "simplifying",
  optimize: "improve",
  optimized: "improved",
  optimizing: "improving",
  facilitate: "help",
  facilitated: "helped",
  facilitating: "helping",
  amplify: "strengthen",
  amplified: "strengthened",
  amplifying: "strengthening",
  catalyze: "start",
  catalyzed: "started",
  catalyzing: "starting",
};
const BANNED_PHRASE_SUBS: Record<string, string> = {
  "it's important to note": "worth noting",
  "it is important to note": "worth noting",
  "in conclusion": "to close",
  "in summary": "to close",
  "in the realm of": "in",
  "dive deep into": "look at",
  "at the end of the day": "in the end",
  "in today's fast-paced world": "today",
  "plays a crucial role": "matters",
  "a testament to": "a sign of",
  "when it comes to": "with",
  "cannot be overstated": "is real",
  "needless to say": "of course",
  "first and foremost": "first",
  "last but not least": "finally",
  "delve into": "look at",
  "a tapestry of": "a weave of",
  "navigate the complexities": "work through the difficulty",
  "unlock your best self": "meet yourself",
  "journey of self-discovery": "work of self-knowing",
  "embark on a journey": "begin",
  "unleash your potential": "meet yourself",
  "elevate your life": "change your life",
  "harness the power": "use the force",
  "holistic approach": "whole-body approach",
};

function matchCase(target: string, source: string): string {
  if (source[0] === source[0]?.toUpperCase()) return target[0].toUpperCase() + target.slice(1);
  return target;
}

export function scrubBannedLexicon(s: string): string {
  let out = s;
  // Phrases first (longer matches), case-insensitive, preserving newlines
  for (const [phrase, sub] of Object.entries(BANNED_PHRASE_SUBS)) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, (m) => matchCase(sub, m));
  }
  // Single words, word-boundary aware
  for (const [word, sub] of Object.entries(BANNED_WORD_SUBS)) {
    const re = new RegExp(`(^|[^A-Za-z])${word}(?=$|[^A-Za-z])`, "gi");
    out = out.replace(re, (m, lead) => lead + matchCase(sub, m.replace(lead, "")));
  }
  return out;
}

/**
 * Strict allowlist enforcement for Amazon ASINs.
 */
function enforceVerifiedAsinsOnly(
  body: string,
  preferredReplacements: AnyProduct[],
): { body: string; replacements: { from: string; to: string | null }[] } {
  const linkRe = /\[([^\]]+)\]\(https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]+)(?:\?[^)]*)?\)/g;
  const used = new Set<string>();
  const replacements: { from: string; to: string | null }[] = [];
  const replPool = [...preferredReplacements];

  const cleaned = body.replace(linkRe, (full, displayText, asin) => {
    if (VERIFIED_ASIN_SET.has(asin)) {
      used.add(asin);
      return full;
    }
    let pick: AnyProduct | undefined;
    for (let i = 0; i < replPool.length; i++) {
      if (!used.has(replPool[i].asin)) {
        pick = replPool[i];
        replPool.splice(i, 1);
        break;
      }
    }
    if (!pick) {
      replacements.push({ from: asin, to: null });
      return displayText;
    }
    used.add(pick.asin);
    replacements.push({ from: asin, to: pick.asin });
    return `[${pick.title}](${amazonUrl(pick.asin)})`;
  });

  return { body: cleaned, replacements };
}

function buildAuthorByline(topic: string, isoDate: string): string {
  const human = new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    "",
    "---",
    "",
    `<section data-author="byline">`,
    `Written by **The Oracle Lover**, independent essayist on anger, somatics, and embodied spirituality.`,
    `Last updated <time datetime="${isoDate}">${human}</time>.`,
    `In our work on ${topic.toLowerCase()}, we keep returning to one quiet truth: the body has been telling you something for a long time, and it deserves a thoughtful listener. The Anger Practice is a companion journal to [theoraclelover.com](https://theoraclelover.com), and every piece here is written with you in mind.`,
    `</section>`,
    "",
  ].join("\n");
}

function buildTldrPrompt(topic: string): string {
  return `BEGIN with a TL;DR block in EXACTLY this HTML shape, before any other content. Use 3 declarative sentences (no questions), each under 32 words:

<section data-tldr="ai-overview" aria-label="In short">
<p><strong>TL;DR.</strong> [Sentence 1.] [Sentence 2.] [Sentence 3.]</p>
</section>`;
}

export async function generateArticle(topic: string, heroIndex?: number): Promise<GeneratedArticle> {
  const opener = pick(OPENER_STYLES);
  const researchers = pickResearchers(3);
  const inline = pickInlineProducts(3);
  const bottom = pickBottomProducts(4);
  const heroIdx = heroIndex ?? Math.floor(Math.random() * 40) + 1;
  matchBucket(topic);
  const bucketHero = bucketImageForTopic(topic);
  bucketLabelForTopic(topic);

  const authority = pick(AUTHORITATIVE_SOURCES);
  // Pick 3 internal links for the model to weave in
  const internalPool = [...INTERNAL_LINKS];
  const chosenInternal: typeof INTERNAL_LINKS = [];
  while (chosenInternal.length < 3 && internalPool.length) {
    chosenInternal.push(internalPool.splice(Math.floor(Math.random() * internalPool.length), 1)[0]);
  }

  const isoNow = new Date().toISOString();

  const systemPrompt = `You are The Oracle Lover, an independent literary voice writing for theangerpractice.com (a companion journal to theoraclelover.com).

VOICE
- Lovely, warm, informative, encouraging, divinely inspired. Real voice, real heart.
- Direct second-person address ("you"). Contractions throughout. Varied sentence length.
- Concrete specifics over abstractions. Sensory, body-anchored detail.
- At least 2 conversational openers within the piece (not just at the start).

ABSOLUTE PROHIBITIONS
- NO em-dashes anywhere. Use a plain hyphen with spaces if a connector is needed.
- NEVER use these words (or any of their inflections): delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, beacon, curate, bespoke, resonate, harness, intricate, plethora, myriad, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, holistic, multifaceted, stakeholders, ecosystem, furthermore, moreover, additionally, consequently, subsequently, thereby, streamline, optimize, facilitate, amplify, catalyze. If you find yourself reaching for one of these, REWRITE the sentence in plainer English. "Elevated blood pressure" / "high blood pressure" / "raised blood pressure" are all fine - the banned word is the marketing-flavored "elevate" / "unlock" / "empower" tone, not anatomy.
- NEVER use these phrases: "it's important to note", "in conclusion", "in summary", "in the realm of", "dive deep into", "at the end of the day", "in today's fast-paced world", "plays a crucial role", "a testament to", "when it comes to", "cannot be overstated", "needless to say", "first and foremost", "last but not least", "delve into", "a tapestry of", "navigate the complexities", "unlock your best self", "journey of self-discovery", "embark on a journey", "harness the power", "holistic approach".
- NEVER name: Paul Wagner, Krishna, Kalesh, Shrikrishna, Kaleshwar. Never reference paulwagner.com.
- Never narrate yourself as an AI. Never explain that you are writing an article.

E-E-A-T REQUIREMENTS (every piece must carry all six)
1. Open with a TL;DR block in the exact HTML shape provided.
2. Self-referencing language woven into prose: "in our experience", "when we tested", "across the articles we've published on this site", "in my own practice", "over the years I've seen".
3. At least 3 internal links with varied anchor text WOVEN INTO PROSE (use the URLs we give you).
4. At least 1 outbound link to an authoritative source (use the .gov/.edu/NIH source we give you) with rel="nofollow noopener" target="_blank".
5. A visible last-updated datetime in the byline at the bottom (we will append this).
6. An author byline at the bottom (we will append this).`;

  const userPrompt = `Write an article titled: "${topic}".

${buildTldrPrompt(topic)}

Length: 2,300 - 2,700 words target. Hard floor 1,800 words. Each H2 section should be substantive (200-350 words). Anything under 1,800 will be discarded.

Opener style for the body that follows the TL;DR (do not label it): ${opener}

Weave in specific work from these researchers (name them, paraphrase one specific idea each, do not invent quotes): ${researchers.join(", ")}.

REQUIRED LINKS to weave naturally into prose with varied anchor text:
- Internal: [${chosenInternal[0].label}](${chosenInternal[0].url})
- Internal: [${chosenInternal[1].label}](${chosenInternal[1].url})
- Internal: [${chosenInternal[2].label}](${chosenInternal[2].url})
- Outbound (must include rel and target): <a href="${authority.url}" rel="nofollow noopener" target="_blank">${authority.label}</a>

Self-referencing voice: include at least one of these phrases verbatim somewhere in the body: "in our experience", "in my own practice", "over the years I've seen", "across the articles we've published on this site".

Structure after the TL;DR:
- A 60-word italic dek standfirst on its own line, prefixed with the literal token "DEK: " (we will parse this).
- 6-9 body sections with specific H2 subheads (no generic "Conclusion").
- 2 sensory, body-anchored passages.
- One short practice the reader can do in under 5 minutes.
- An FAQ-style block with 3 specific questions readers actually ask about this topic, formatted with H3 question headings followed by short paragraph answers.
- A closing 2-paragraph passage that DOES NOT summarize. It opens outward.

Inline product mentions (soft, in-flow, 2-3 total — use the exact placeholder tokens below where they naturally fit; do not invent products):
- [[PRODUCT:${inline[0].asin}|${inline[0].title}]]
- [[PRODUCT:${inline[1].asin}|${inline[1].title}]]
- [[PRODUCT:${inline[2].asin}|${inline[2].title}]]

One soft companion-site mention as a markdown link in flow: [theoraclelover.com](https://theoraclelover.com).

Output order: TL;DR section, then "DEK: ..." line, then a blank line, then the markdown body. Do NOT output the title - we have it. Do NOT wrap in code fences.`;

  // Stream the response so very long bodies (3-5k words) finish reliably
  // even on slow paths, and we can log progress.
  const ac = new AbortController();
  const killT = setTimeout(() => ac.abort(), 900_000);
  let raw = "";
  try {
    const stream = client.messages.stream(
      {
        model: CLAUDE.model,
        max_tokens: 16000,
        temperature: 0.85,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: ac.signal },
    );
    let chunkCount = 0;
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta" &&
        typeof event.delta.text === "string"
      ) {
        raw += event.delta.text;
        chunkCount++;
        if (chunkCount % 200 === 0) {
          console.log(`[gen-stream] ${raw.length} chars so far`);
        }
      }
    }
    await stream.finalMessage();
  } finally {
    clearTimeout(killT);
  }
  raw = raw.trim();

  // Strip code fences if model added any
  raw = raw.replace(/^```(?:markdown|md)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Pull out TL;DR section (must stay at top); pull out DEK line
  let tldr = "";
  const tldrMatch = raw.match(/<section[^>]*data-tldr=["']ai-overview["'][\s\S]*?<\/section>/i);
  if (tldrMatch) {
    tldr = tldrMatch[0];
    raw = raw.replace(tldrMatch[0], "").trim();
  }

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

  // Strict ASIN allowlist
  const enforcement = enforceVerifiedAsinsOnly(body, [
    ...VERIFIED_POOL.filter((p) => !inline.some((i) => i.asin === p.asin)),
  ]);
  body = enforcement.body;
  if (enforcement.replacements.length) {
    console.log(
      `[gen] enforced verified-asin allowlist: ${enforcement.replacements
        .map((r) => `${r.from}→${r.to ?? "STRIPPED"}`)
        .join(", ")}`,
    );
  }

  // Append any inline product link not already present
  for (const p of inline) {
    if (!body.includes(p.asin)) {
      body += `\n\n*Tool for this work: [${p.title}](${p.link}).*`;
    }
  }

  // ---- Deterministic E-E-A-T injections (safety net for Claude misses) ----

  // 1) Authoritative outbound: if no .gov/.edu/NIH/APA/CDC/PubMed link present,
  //    weave in one rotating source as a paragraph near the top of the body.
  const hasAuthority =
    /\.gov|\.edu|nih\.gov|cdc\.gov|pubmed|nimh\.|apa\.org|who\.int/i.test(body);
  if (!hasAuthority) {
    const src = AUTHORITATIVE_SOURCES[Math.floor(Math.random() * AUTHORITATIVE_SOURCES.length)];
    const insertion = `\n\nThe research backs this up. See [${src.label}](${src.url}) for the underlying physiology - the body's response to anger is well documented, even when the cultural script around it is not.\n\n`;
    // Inject after the first H2 paragraph if possible, else prepend.
    const firstH2End = body.search(/\n## /);
    if (firstH2End > 0) {
      const insertionPoint = body.indexOf("\n\n", firstH2End + 4);
      if (insertionPoint > 0) {
        body = body.slice(0, insertionPoint) + insertion + body.slice(insertionPoint);
      } else {
        body = insertion + body;
      }
    } else {
      body = insertion + body;
    }
  }

  // 2) Internal links: ensure at least 3. Count current internal links;
  //    if fewer than 3, append a "Keep reading" section that pulls from
  //    INTERNAL_LINKS pool + any related published article slugs.
  const internalRe = /\[[^\]]+\]\((?:https?:\/\/(?:www\.)?theangerpractice\.com)?(\/(?:article|articles|assessments|herbs|fire-toolkit|about)\b[^)]*)\)/gi;
  const currentInternal = (body.match(internalRe) || []).length;
  if (currentInternal < 3) {
    const need = 3 - currentInternal;
    const pool = [...INTERNAL_LINKS];
    // Try to add 1-2 related published articles by simple title-word overlap
    try {
      const all = listAllArticles().filter((a: any) => a.published === true && a.title !== topic);
      const topicWords = new Set(
        topic.toLowerCase().split(/\W+/).filter((w) => w.length > 4),
      );
      const scored = all.map((a: any) => ({
        a,
        score: a.title
          .toLowerCase()
          .split(/\W+/)
          .filter((w: string) => w.length > 4 && topicWords.has(w)).length,
      }));
      scored.sort((x, y) => y.score - x.score);
      for (const { a, score } of scored.slice(0, 4)) {
        if (score > 0) pool.unshift({ label: a.title, url: `/article/${a.slug}` });
      }
    } catch {
      // listAllArticles may not be available pre-bootstrap; fine
    }
    const links = pool.slice(0, Math.max(need, 3))
      .map((l) => `- [${l.label}](${l.url})`)
      .join("\n");
    body += `\n\n## Keep reading\n${links}\n`;
  }

  // 3) Append author byline at bottom (E-E-A-T signal 5 + 6)
  body += buildAuthorByline(topic, isoNow);

  // 4) TL;DR fallback: synthesize from dek + first paragraph if Claude
  //    didn't include one.
  if (!tldr) {
    const firstPara = (body.match(/^([^\n#].+?)(?:\n\n|$)/m) || ["", ""])[1].slice(0, 240);
    const dekLine = (dek || `${topic}.`).slice(0, 240);
    tldr = `<section data-tldr="ai-overview" aria-label="In short">\n<p><strong>TL;DR.</strong> ${dekLine} ${firstPara}</p>\n</section>`;
  }

  // Reassemble: TL;DR at top, then body
  let full = "";
  full += tldr + "\n\n";
  full += body;

  // Hard scrub em-dashes - model occasionally still emits them despite system prompt
  full = scrubEmDashes(full);
  // Deterministic banned-lexicon scrub - replaces stragglers ("underscore",
  // "amplify", "furthermore") with plain-English subs. The model has already
  // been told not to use these; this is a safety net.
  full = scrubBannedLexicon(full);

  const gate = runVoiceGate(full, topic);

  const slug = slugify(topic);
  const human = new Date(isoNow).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    title: topic,
    slug,
    dek,
    bodyMarkdown: full,
    heroImage: bucketHero,
    heroIndex: heroIdx,
    wordCount: gate.wordCount,
    voiceScore: gate.score,
    researchers,
    inlineProducts: inline,
    bottomProducts: bottom,
    createdAt: isoNow,
    author: SITE.author,
    byline: `By ${SITE.author} - ${human}`,
    updatedAt: isoNow,
    source: "claude-sonnet-4-5",
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function generateWithRetry(topic: string, maxTries = 6): Promise<GeneratedArticle> {
  let best: GeneratedArticle | null = null;
  for (let i = 0; i < maxTries; i++) {
    try {
      console.log(`[gen] try ${i + 1}/${maxTries}: ${topic.slice(0, 60)}`);
      const a = await generateArticle(topic);
      console.log(`[gen] try ${i + 1} got ${a.wordCount}w v=${a.voiceScore}`);
      const gate = runVoiceGate(a.bodyMarkdown, a.title);
      if (gate.pass && a.wordCount >= 1800) return a;
      console.log(`[gen] gate fail: ${gate.reasons.slice(0, 4).join(" | ")}`);
      if (!best || a.voiceScore > best.voiceScore) best = a;
    } catch (e) {
      const msg = (e as Error).message || "";
      console.error(`[generator] attempt ${i + 1} failed:`, msg);
      if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
        const delay = Math.min(30000 + i * 30000, 300000);
        console.log(`[generator] rate limited, sleeping ${Math.round(delay / 1000)}s`);
        await sleep(delay);
      } else {
        await sleep(5000);
      }
    }
  }
  if (!best) throw new Error(`Article generation failed for: ${topic}`);
  // If the best attempt still didn't pass the gate, refuse rather than
  // publishing a near-miss. The caller can keep the existing article.
  const finalGate = runVoiceGate(best.bodyMarkdown, best.title);
  if (!finalGate.pass) {
    throw new Error(`Voice gate refused after ${maxTries} attempts for: ${topic} | ${finalGate.reasons.slice(0,3).join(" | ")}`);
  }
  if (best.wordCount < 1800) throw new Error(`Article too short for: ${topic} (${best.wordCount}w)`);
  return best;
}
