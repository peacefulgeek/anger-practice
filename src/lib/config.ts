// The Anger Practice - central config
// Hardcoded Bunny CDN creds per user spec (stored in code intentionally)

export const SITE = {
  name: "The Anger Practice",
  domain: "theangerpractice.com",
  tagline: "Anger isn't the enemy. It's the messenger you've been ignoring.",
  author: "The Oracle Lover",
  authorLink: "https://theoraclelover.com",
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

export const DEEPSEEK = {
  apiKey: process.env.OPENAI_API_KEY || "sk-82bdad0a1fd34987b73030504ae67080",
  baseUrl: process.env.OPENAI_BASE_URL || "https://api.deepseek.com",
  model: process.env.OPENAI_MODEL || "deepseek-v4-pro",
};

export const AMAZON = {
  tag: process.env.AMAZON_TAG || "spankyspinola-20",
};

export function amazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON.tag}`;
}

export const AUTO_GEN_ENABLED =
  (process.env.AUTO_GEN_ENABLED ?? "true").toLowerCase() === "true";
