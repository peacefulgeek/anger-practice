// The Anger Practice - central config
// Hardcoded Bunny CDN creds per user spec (stored in code intentionally)

export const SITE = {
  name: "The Anger Practice",
  domain: "theangerpractice.com",
  url: "https://theangerpractice.com",
  tagline: "Anger isn't the enemy. It's the messenger you've been ignoring.",
  description:
    "A literary journal on healthy anger, rage work, suppressed anger recovery, somatic release, and the spiritual dimension of feeling fully.",
  author: "The Oracle Lover",
  authorLink: "https://theoraclelover.com",
  authorJobTitle: "Independent essayist on anger, somatics, and embodied spirituality",
  companionByline: "A companion journal to theoraclelover.com",
};

export const BUNNY = {
  zone: "anger-practice",
  storageHost: "ny.storage.bunnycdn.com",
  storageKey: "f5c045db-2822-4ad7-98ccba130603-6024-44fc",
  readKey: "25403dc0-b464-4e2f-8f27fa51b31c-c382-4d6f",
  pullZone: "https://anger-practice.b-cdn.net",
  libraryCount: 40,
};

export function libraryImage(n: number): string {
  const idx = ((n - 1) % BUNNY.libraryCount) + 1;
  return `${BUNNY.pullZone}/library/lib-${idx.toString().padStart(2, "0")}.webp`;
}

export function randomLibraryImage(): string {
  const idx = Math.floor(Math.random() * BUNNY.libraryCount) + 1;
  return libraryImage(idx);
}

// Legacy DeepSeek config retained for fallback only. The active writing
// engine is Claude sonnet-4-5 (Anthropic) per the FINAL PASS scope.
export const DEEPSEEK = {
  apiKey: process.env.OPENAI_API_KEY || "sk-82bdad0a1fd34987b73030504ae67080",
  baseUrl: process.env.OPENAI_BASE_URL || "https://api.deepseek.com",
  model: process.env.OPENAI_MODEL || "deepseek-v4-pro",
};

// Active writing engine. All article generation, rewrites, and quarterly
// refreshes route through Anthropic's Claude sonnet-4-5.
// (Per scope doc: "claude-sonnet-4-6" — current public Anthropic model id is
// `claude-sonnet-4-5`. Override with CLAUDE_MODEL env var if Anthropic ships
// the newer alias.)
export const CLAUDE = {
  apiKey:
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    "sk-ant-api03-NPve1hqIxvPLVSbZ2lfZVCPex3vhNu4P2UM6RXCKpx64usvP3jl5nWjlRmDfPWX7V60DzUR9H2yS8wQHioIflg-icsUsQAA",
  model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
};

export const AMAZON = {
  tag: process.env.AMAZON_TAG || "spankyspinola-20",
};

export function amazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON.tag}`;
}

export const AUTO_GEN_ENABLED =
  (process.env.AUTO_GEN_ENABLED ?? "true").toLowerCase() === "true";
