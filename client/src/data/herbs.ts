// Canonical Herb Cabinet — re-exported from src/lib/herbs.ts
// One source of truth across server, generator, and frontend.

export type { Herb } from "../../../src/lib/herbs";
export { HERBS, CATEGORY_LABEL } from "../../../src/lib/herbs";

export const AMAZON_TAG = "spankyspinola-20";
export const amazonUrl = (asin: string) =>
  `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
