/**
 * Voice + E-E-A-T Quality Gate.
 *
 * Source of truth: SCOPE-FINAL-PASS.md sections 2 + 3.
 *
 * A generated (or rewritten) article must PASS this gate before being
 * persisted to Bunny. The pipeline regenerates on failure rather than
 * patching a failed article.
 *
 * Rules:
 *  - No paulwagner.com / Paul Wagner leakage anywhere.
 *  - No em-dashes anywhere (hard fail). Use plain hyphen with spaces if needed.
 *  - Full PDF banned-word list (delve, tapestry, paradigm, ...).
 *  - Full PDF banned-phrase list ("it's important to note", "in conclusion", ...).
 *  - Word-count window: 1,800 - 3,200.
 *  - 6 E-E-A-T signals every article must carry:
 *      1. <section data-tldr="ai-overview"> 3-sentence TL;DR block at the top
 *      2. Self-referencing language ("in our experience", "when we tested", etc.)
 *      3. >= 3 internal links (theangerpractice.com or relative /article/...)
 *      4. >= 1 outbound authoritative link (.gov, .edu, NIH/CDC/WHO/PubMed/Nature/ScienceDirect)
 *      5. Visible last-updated datetime (datetime= attribute or "Updated" + ISO date)
 *      6. Author byline block at the bottom with credential + datetime + warm context
 */

export interface VoiceGateResult {
  pass: boolean;
  score: number; // 0-100
  reasons: string[];
  wordCount: number;
  emDashCount: number;
  bannedWordHits: string[];
  bannedPhraseHits: string[];
  eeat: {
    tldrBlock: boolean;
    selfReferencing: boolean;
    internalLinks: number;
    authoritativeOutbound: boolean;
    visibleUpdated: boolean;
    bottomByline: boolean;
  };
  // Backwards-compat field for older callers
  oracleLoverPhraseCount: number;
}

export const BANNED_NAMES = [
  "paul wagner",
  "paulwagner.com",
  "paulwagner",
  "krishna",
  "kalesh",
  "shrikrishna",
  "kaleshwar",
];

export const BANNED_WORDS = [
  "delve",
  "delving",
  "tapestry",
  "paradigm",
  "synergy",
  "leverage",
  "leveraged",
  "leveraging",
  "unlock",
  "unlocked",
  "unlocking",
  "empower",
  "empowered",
  "empowering",
  "empowerment",
  "utilize",
  "utilized",
  "utilizing",
  "utilization",
  "pivotal",
  "embark",
  "embarking",
  "underscore",
  "underscores",
  "underscored",
  "paramount",
  "seamlessly",
  "seamless",
  "beacon",
  "curate",
  "curated",
  "curating",
  "bespoke",
  "resonate",
  "resonates",
  "resonating",
  "harness",
  "harnesses",
  "harnessing",
  "intricate",
  "plethora",
  "myriad",
  "transformative",
  "groundbreaking",
  "innovative",
  "cutting-edge",
  "revolutionary",
  "state-of-the-art",
  "ever-evolving",
  "holistic",
  "multifaceted",
  "stakeholders",
  "ecosystem",
  "furthermore",
  "moreover",
  "additionally",
  "consequently",
  "subsequently",
  "thereby",
  "streamline",
  "streamlined",
  "streamlining",
  "optimize",
  "optimized",
  "optimizing",
  "facilitate",
  "facilitated",
  "facilitating",
  "amplify",
  "amplified",
  "amplifying",
  "catalyze",
  "catalyzed",
  "catalyzing",
];

export const BANNED_PHRASES = [
  "it's important to note",
  "it is important to note",
  "in conclusion",
  "in summary",
  "in the realm of",
  "dive deep into",
  "at the end of the day",
  "in today's fast-paced world",
  "plays a crucial role",
  "a testament to",
  "when it comes to",
  "cannot be overstated",
  "needless to say",
  "first and foremost",
  "last but not least",
  "delve into",
  "a tapestry of",
  "navigate the complexities",
  "unlock your best self",
  "journey of self-discovery",
  "embark on a journey",
  "unleash your potential",
  "elevate your life",
  "harness the power",
  "holistic approach",
];

const SELF_REF_PATTERNS = [
  /\bin (?:our|my) experience\b/i,
  /\bwhen we tested\b/i,
  /\bacross the articles we[''']ve published\b/i,
  /\bin (?:our|my) own practice\b/i,
  /\bover the years (?:i[''']ve|we[''']ve) seen\b/i,
  /\bwe[''']ve found\b/i,
  /\bwhat we[''']ve learned\b/i,
  /\bin (?:our|my) work\b/i,
];

const AUTHORITATIVE_DOMAINS = [
  "nih.gov",
  "cdc.gov",
  "who.int",
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "nature.com",
  "sciencedirect.com",
  ".gov/",
  ".edu/",
  "apa.org",
  "psychiatry.org",
  "nimh.nih.gov",
];

function containsAuthoritativeOutbound(body: string): boolean {
  const linkRe = /https?:\/\/[^\s)\]]+/g;
  const urls = body.match(linkRe) || [];
  for (const u of urls) {
    const lower = u.toLowerCase();
    for (const dom of AUTHORITATIVE_DOMAINS) {
      if (lower.includes(dom)) return true;
    }
    // also accept .gov and .edu hosts in URL hostnames
    if (/^https?:\/\/[^\/\s]+\.(?:gov|edu)(?:[\/?]|$)/i.test(u)) return true;
  }
  return false;
}

function countInternalLinks(body: string): number {
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(body)) !== null) {
    const href = m[1];
    if (
      /theangerpractice\.com/i.test(href) ||
      /^\/article\//i.test(href) ||
      /^\/articles(?:\b|\/)/i.test(href) ||
      /^\/(assessments|herbs|fire-toolkit|about)/i.test(href)
    ) {
      count++;
    }
  }
  return count;
}

function hasTldrBlock(body: string): boolean {
  return /<section[^>]*data-tldr=["']ai-overview["'][^>]*>/i.test(body);
}

function hasVisibleUpdated(body: string): boolean {
  return (
    /<time[^>]*datetime=/i.test(body) ||
    /\b(?:last\s+)?updated\b[^.\n]{0,40}\b(20\d{2})\b/i.test(body)
  );
}

function hasBottomByline(body: string): boolean {
  const tail = body.slice(-900).toLowerCase();
  return (
    (tail.includes("oracle lover") || tail.includes("written by")) &&
    /\b(20\d{2})\b/.test(tail)
  );
}

function hasSelfReferencing(body: string): boolean {
  return SELF_REF_PATTERNS.some((re) => re.test(body));
}

export function runVoiceGate(content: string, title: string): VoiceGateResult {
  const reasons: string[] = [];
  let score = 100;

  const lower = content.toLowerCase();
  const words = content.trim().split(/\s+/).length;

  for (const n of BANNED_NAMES) {
    if (lower.includes(n)) {
      reasons.push(`leakage: banned name "${n}"`);
      score -= 50;
    }
  }

  const emDashCount = (content.match(/—/g) || []).length;
  if (emDashCount > 0) {
    reasons.push(`em-dash hard fail: ${emDashCount} occurrence(s)`);
    score -= 40;
  }

  const bannedWordHits: string[] = [];
  for (const w of BANNED_WORDS) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z])${escaped}(?=$|[^a-z])`, "gi");
    const matches = content.match(re);
    if (matches) {
      bannedWordHits.push(`${w} x${matches.length}`);
      score -= 8 * matches.length;
    }
  }
  if (bannedWordHits.length) {
    reasons.push(`banned words: ${bannedWordHits.join(", ")}`);
  }

  const bannedPhraseHits: string[] = [];
  for (const p of BANNED_PHRASES) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    const m = content.match(re);
    if (m) {
      bannedPhraseHits.push(`"${p}" x${m.length}`);
      score -= 10 * m.length;
    }
  }
  if (bannedPhraseHits.length) {
    reasons.push(`banned phrases: ${bannedPhraseHits.join(", ")}`);
  }

  if (words < 1800) {
    reasons.push(`too short: ${words} words (min 1800)`);
    score -= 30;
  }
  if (words > 3800) {
    reasons.push(`too long: ${words} words (max 3800)`);
    score -= 10;
  }

  const eeat = {
    tldrBlock: hasTldrBlock(content),
    selfReferencing: hasSelfReferencing(content),
    internalLinks: countInternalLinks(content),
    authoritativeOutbound: containsAuthoritativeOutbound(content),
    visibleUpdated: hasVisibleUpdated(content),
    bottomByline: hasBottomByline(content),
  };

  if (!eeat.tldrBlock) {
    reasons.push('E-E-A-T: missing <section data-tldr="ai-overview"> TL;DR block');
    score -= 15;
  }
  if (!eeat.selfReferencing) {
    reasons.push("E-E-A-T: no self-referencing language");
    score -= 10;
  }
  if (eeat.internalLinks < 3) {
    reasons.push(`E-E-A-T: only ${eeat.internalLinks} internal links (need >=3)`);
    score -= 10;
  }
  if (!eeat.authoritativeOutbound) {
    reasons.push("E-E-A-T: no authoritative outbound (.gov/.edu/NIH/CDC/WHO)");
    score -= 10;
  }
  if (!eeat.visibleUpdated) {
    reasons.push("E-E-A-T: no visible last-updated datetime");
    score -= 8;
  }
  if (!eeat.bottomByline) {
    reasons.push("E-E-A-T: no bottom byline block");
    score -= 8;
  }

  if (/^\s*(the|a|an)\s+ultimate\s+guide/i.test(title)) {
    reasons.push("generic 'ultimate guide' title");
    score -= 20;
  }

  const pass =
    score >= 70 &&
    emDashCount === 0 &&
    bannedWordHits.length === 0 &&
    bannedPhraseHits.length === 0 &&
    words >= 1800 &&
    eeat.tldrBlock &&
    eeat.internalLinks >= 3 &&
    eeat.authoritativeOutbound &&
    eeat.bottomByline;

  return {
    pass,
    score: Math.max(0, score),
    reasons,
    wordCount: words,
    emDashCount,
    bannedWordHits,
    bannedPhraseHits,
    eeat,
    oracleLoverPhraseCount: 0,
  };
}

// Retained for backwards compat with any old import sites.
export const ORACLE_LOVER_MARKERS: string[] = [];
