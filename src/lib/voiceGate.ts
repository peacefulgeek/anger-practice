/**
 * Paul Voice Gate - content quality + voice enforcement.
 * Any generated article must PASS this before publishing.
 *
 * Rules (distilled from WRITINGQUALITYGATEADDENDUM + PWAIVoiceV2):
 * 1. No banned names (Paul, Krishna, Kalesh, etc.)
 * 2. No AI-slop phrases ("delve into", "tapestry of", "in today's fast-paced world"...)
 * 3. No generic wellness-blog fluff ("unlock your best self", "journey of self-discovery")
 * 4. No em-dash spam (>4 em-dashes per 1000 words = flag)
 * 5. Word count 1200-2500 (target 1600-2000)
 * 6. At least one Oracle Lover signature phrase
 * 7. Voice markers: second-person address, specific sensory detail, at least one counterintuitive claim
 */

export interface VoiceGateResult {
  pass: boolean;
  score: number; // 0-100
  reasons: string[];
  wordCount: number;
  oracleLoverPhraseCount: number;
}

export const BANNED_NAMES = [
  "paul wagner",
  "paul ",
  "krishna",
  "kalesh",
  "shrikrishna",
  "kaleshwar",
];

export const BANNED_PHRASES = [
  // AI slop
  "delve into",
  "delving into",
  "in today's fast-paced",
  "in the modern world",
  "in this digital age",
  "a tapestry of",
  "a symphony of",
  "a myriad of",
  "navigate the complexities",
  "unlock your best self",
  "journey of self-discovery",
  "embark on a journey",
  "unleash your potential",
  "elevate your life",
  "transform your life today",
  "at the end of the day",
  "it's important to note",
  "it is important to note",
  "studies have shown",
  "research suggests",
  "game-changer",
  "game changer",
  "harness the power",
  "holistic approach",
  "in conclusion,",
  "to sum up,",
  "in summary,",
  "let's dive in",
  "buckle up",
  "the good news is",
  // Wellness-blog cringe
  "manifest your best",
  "vibrate higher",
  "raise your vibration",
  "high-vibe",
  "good vibes only",
  "toxic people",
  "trauma response",
  "healing journey",
  "self-care routine",
  "mindset shift",
];

// Phrases that indicate the Oracle Lover voice showed up
export const ORACLE_LOVER_MARKERS = [
  "the body remembers",
  "the body knows",
  "you already know",
  "listen",
  "notice",
  "stay with",
  "what if",
  "the truth is",
  "here is what",
  "the thing is",
  "nobody told you",
  "they never taught",
  "permission",
  "allowed to",
  "underneath",
  "the real",
];

export function runVoiceGate(content: string, title: string): VoiceGateResult {
  const reasons: string[] = [];
  let score = 100;

  const lower = content.toLowerCase();
  const words = content.trim().split(/\s+/).length;

  // 1. banned names
  for (const n of BANNED_NAMES) {
    if (lower.includes(n)) {
      reasons.push(`banned name: "${n}"`);
      score -= 40;
    }
  }

  // 2. banned phrases
  let slopHits = 0;
  for (const p of BANNED_PHRASES) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const m = lower.match(re);
    if (m) {
      slopHits += m.length;
      reasons.push(`banned phrase: "${p}" x${m.length}`);
      score -= 8 * m.length;
    }
  }

  // 3. word count
  if (words < 1200) {
    reasons.push(`too short: ${words} words (min 1200)`);
    score -= 30;
  }
  if (words > 2500) {
    reasons.push(`too long: ${words} words (max 2500)`);
    score -= 10;
  }

  // 4. em-dash spam
  const emDashes = (content.match(/—/g) || []).length;
  if (emDashes > Math.max(4, Math.floor(words / 250))) {
    reasons.push(`em-dash spam: ${emDashes} in ${words} words`);
    score -= 10;
  }

  // 5. Oracle Lover markers
  let olHits = 0;
  for (const m of ORACLE_LOVER_MARKERS) {
    if (lower.includes(m)) olHits++;
  }
  if (olHits < 2) {
    reasons.push(`few Oracle Lover markers: ${olHits}`);
    score -= 15;
  }

  // 6. Second-person check
  const youCount = (lower.match(/\byou(r|rself)?\b/g) || []).length;
  if (youCount < 10) {
    reasons.push(`insufficient second-person: ${youCount} "you" instances`);
    score -= 10;
  }

  // 7. Title must not be generic
  if (/^\s*(the|a|an)\s+ultimate\s+guide/i.test(title)) {
    reasons.push("generic 'ultimate guide' title");
    score -= 20;
  }

  const pass = score >= 65 && slopHits === 0 && words >= 1200;

  return {
    pass,
    score: Math.max(0, score),
    reasons,
    wordCount: words,
    oracleLoverPhraseCount: olHits,
  };
}
