// Image-bucket taxonomy for The Anger Practice.
// Each bucket has 10 themed images on Bunny at /buckets/{slug}/img-01..10.webp
// (compressed WebP, editorial style aligned with site design).
// Articles are assigned to a bucket by keyword scoring of their title.

import { BUNNY } from "./config.js";

export interface Bucket {
  slug: string;
  label: string;
  promptCore: string; // base prompt fragment used to generate the 10 images
  keywords: string[]; // matched against lowercased topic
}

export const BUCKETS: Bucket[] = [
  {
    slug: "trauma",
    label: "Trauma & Survival Anger",
    promptCore:
      "editorial photograph, low light, single figure silhouette by a window at dusk, charcoal and burnt-orange tones, film grain, mood of held breath, shallow depth of field, no text",
    keywords: [
      "trauma",
      "ptsd",
      "survival",
      "freeze",
      "fight",
      "abuse",
      "violation",
      "betrayal",
      "shock",
      "dissociation",
    ],
  },
  {
    slug: "couples",
    label: "Couples & Romantic Rage",
    promptCore:
      "editorial photograph, two empty chairs facing each other across a kitchen table at dawn, one mug overturned, warm tungsten light, charcoal and burnt-orange tones, film grain, mood of unspoken argument, no people, no text",
    keywords: [
      "partner",
      "marriage",
      "relationship",
      "couple",
      "love",
      "betray",
      "spouse",
      "lover",
      "dating",
      "intimacy",
    ],
  },
  {
    slug: "womens-rage",
    label: "Women's Anger",
    promptCore:
      "editorial photograph, single woman's hands gripping the edge of a marble counter, knuckles tight, soft window light, jewel tones, charcoal and burnt-orange palette, film grain, mood of contained fury, no faces, no text",
    keywords: [
      "women",
      "woman",
      "female",
      "feminine",
      "mother",
      "daughter",
      "sister",
      "patriarchy",
      "girls",
      "wife",
    ],
  },
  {
    slug: "parental",
    label: "Parents, Children, Lineage",
    promptCore:
      "editorial photograph, weathered family hands holding a single old photograph, generational, soft amber daylight, charcoal and burnt-orange tones, film grain, mood of inherited grief, no faces visible, no text",
    keywords: [
      "parent",
      "mother",
      "father",
      "child",
      "children",
      "family",
      "lineage",
      "inherited",
      "ancestor",
      "raising",
      "kids",
      "son",
      "daughter",
    ],
  },
  {
    slug: "somatic",
    label: "Somatic Practice",
    promptCore:
      "editorial photograph, close-up of a torso in motion, breath and movement, dark linen, single shaft of golden light, charcoal and burnt-orange palette, film grain, sensory and embodied mood, no face, no text",
    keywords: [
      "body",
      "somatic",
      "release",
      "practice",
      "breath",
      "physical",
      "movement",
      "shake",
      "tremor",
      "tension",
      "muscle",
      "nervous",
    ],
  },
  {
    slug: "tcm",
    label: "Liver Fire & TCM",
    promptCore:
      "editorial still life, glass jar of dried chrysanthemum and bupleurum on dark walnut, single tea cup steaming, warm low light, deep red and amber tones, film grain, traditional Chinese medicine apothecary mood, no text",
    keywords: [
      "liver",
      "fire",
      "tcm",
      "chinese medicine",
      "qi",
      "meridian",
      "acupuncture",
      "yin",
      "yang",
      "five element",
    ],
  },
  {
    slug: "ayurveda",
    label: "Pitta & Ayurveda",
    promptCore:
      "editorial overhead, brass thali with rose, sandalwood, ghee, and cooling herbs, dark stone surface, golden hour light, ochre and burnt-orange tones, film grain, ayurvedic apothecary mood, no text",
    keywords: [
      "pitta",
      "ayurveda",
      "ayurvedic",
      "dosha",
      "ghee",
      "cooling",
      "constitution",
      "vata",
      "kapha",
    ],
  },
  {
    slug: "grief",
    label: "Anger & Grief",
    promptCore:
      "editorial photograph, single white candle burning low in a dim room, dried roses to the side, warm shadow, charcoal and burnt-orange palette, film grain, mood of mourning meeting fury, no people, no text",
    keywords: [
      "grief",
      "loss",
      "death",
      "mourning",
      "bereave",
      "widow",
      "missing",
      "absent",
      "funeral",
    ],
  },
  {
    slug: "workplace",
    label: "Work & Public Anger",
    promptCore:
      "editorial photograph, abandoned office desk at dusk, single coffee ring on a yellow legal pad, blinds casting amber stripes, charcoal and burnt-orange tones, film grain, mood of suppressed professional rage, no text",
    keywords: [
      "work",
      "workplace",
      "job",
      "boss",
      "career",
      "office",
      "colleague",
      "professional",
      "money",
      "boundaries at work",
    ],
  },
  {
    slug: "spiritual-bypass",
    label: "Spiritual Bypassing",
    promptCore:
      "editorial photograph, a single cracked porcelain Buddha statue on a dusty shelf next to a wilted flower, low warm light, charcoal and burnt-orange tones, film grain, mood of false serenity exposed, no text",
    keywords: [
      "spiritual",
      "bypass",
      "meditation",
      "mindfulness",
      "forgive",
      "guru",
      "yoga",
      "enlighten",
      "ego",
      "shadow",
    ],
  },
  {
    slug: "boundaries",
    label: "Boundaries & No",
    promptCore:
      "editorial photograph, a single weathered wooden door slightly ajar in a stone wall, golden afternoon light spilling through, charcoal and burnt-orange palette, film grain, mood of declared limit, no text",
    keywords: [
      "boundary",
      "boundaries",
      "no",
      "limit",
      "say no",
      "consent",
      "yes",
      "people pleas",
      "assert",
    ],
  },
  {
    slug: "rituals",
    label: "Rage Rituals & Ceremony",
    promptCore:
      "editorial photograph, dried herbs burning in a clay bowl on dark stone, sparks and smoke catching golden light, charcoal and burnt-orange tones, film grain, ceremonial mood, no people, no text",
    keywords: [
      "ritual",
      "ceremony",
      "altar",
      "cleanse",
      "burn",
      "offering",
      "sacred",
      "rage ritual",
      "energy work",
    ],
  },
];

export const FALLBACK_BUCKET = "rituals";

/** Score-based bucket matcher. Returns bucket slug. */
export function matchBucket(topic: string): string {
  const t = topic.toLowerCase();
  let bestSlug = FALLBACK_BUCKET;
  let bestScore = 0;
  for (const b of BUCKETS) {
    let score = 0;
    for (const kw of b.keywords) {
      if (t.includes(kw)) score += kw.length; // longer keywords weigh more
    }
    if (score > bestScore) {
      bestScore = score;
      bestSlug = b.slug;
    }
  }
  return bestSlug;
}

/**
 * Bucket -> Bunny image pool (all live on https://anger-practice.b-cdn.net).
 * Mix of:
 *  - /library/lib-XX.webp (the original 40 themed lib images, curated per bucket)
 *  - /buckets/{topic}-XX.webp (additional topic-specific images, e.g. trauma-01..10, couples-01..05)
 * Every URL here is a real, accessible WebP file on Bunny CDN.
 */
const BUCKET_IMAGE_POOL: Record<string, string[]> = {
  trauma: [
    "/buckets/trauma-01.webp", "/buckets/trauma-02.webp", "/buckets/trauma-03.webp",
    "/buckets/trauma-04.webp", "/buckets/trauma-05.webp", "/buckets/trauma-06.webp",
    "/buckets/trauma-07.webp", "/buckets/trauma-08.webp", "/buckets/trauma-09.webp",
    "/buckets/trauma-10.webp",
    "/library/lib-01.webp", "/library/lib-26.webp", "/library/lib-31.webp",
  ],
  couples: [
    "/buckets/couples-01.webp", "/buckets/couples-02.webp", "/buckets/couples-03.webp",
    "/buckets/couples-04.webp", "/buckets/couples-05.webp",
    "/library/lib-32.webp", "/library/lib-04.webp", "/library/lib-19.webp",
  ],
  "womens-rage": [
    "/library/lib-02.webp", "/library/lib-06.webp", "/library/lib-08.webp",
    "/library/lib-21.webp", "/buckets/trauma-08.webp",
  ],
  parental: [
    "/library/lib-03.webp", "/library/lib-22.webp", "/library/lib-33.webp",
    "/buckets/trauma-03.webp", "/buckets/trauma-07.webp",
  ],
  somatic: [
    "/library/lib-09.webp", "/library/lib-12.webp", "/library/lib-23.webp",
    "/library/lib-34.webp", "/library/lib-31.webp",
  ],
  tcm: [
    "/library/lib-11.webp", "/library/lib-13.webp", "/library/lib-15.webp",
    "/library/lib-36.webp", "/library/lib-37.webp", "/library/lib-38.webp",
  ],
  ayurveda: [
    "/library/lib-16.webp", "/library/lib-17.webp", "/library/lib-18.webp",
    "/library/lib-39.webp", "/library/lib-40.webp",
  ],
  grief: [
    "/library/lib-05.webp", "/library/lib-24.webp", "/library/lib-25.webp",
    "/buckets/trauma-04.webp", "/buckets/trauma-09.webp",
  ],
  workplace: [
    "/library/lib-27.webp", "/library/lib-28.webp", "/library/lib-29.webp",
    "/library/lib-30.webp",
  ],
  "spiritual-bypass": [
    "/library/lib-07.webp", "/library/lib-14.webp", "/library/lib-20.webp",
    "/library/lib-35.webp",
  ],
  boundaries: [
    "/library/lib-09.webp", "/library/lib-26.webp", "/buckets/couples-04.webp",
    "/library/lib-04.webp",
  ],
  rituals: [
    "/library/lib-10.webp", "/library/lib-11.webp", "/library/lib-15.webp",
    "/library/lib-25.webp", "/library/lib-36.webp", "/library/lib-38.webp",
  ],
};

/** Deterministic hero image URL for a topic — stable across regenerations. */
export function bucketImageForTopic(topic: string): string {
  const slug = matchBucket(topic);
  const pool = BUCKET_IMAGE_POOL[slug] || BUCKET_IMAGE_POOL[FALLBACK_BUCKET];
  let h = 0;
  for (let i = 0; i < topic.length; i++) {
    h = (h * 31 + topic.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % pool.length;
  return `${BUNNY.pullZone}${pool[idx]}`;
}

export function bucketLabelForTopic(topic: string): string {
  const slug = matchBucket(topic);
  return BUCKETS.find((b) => b.slug === slug)?.label || "The Anger Practice";
}
