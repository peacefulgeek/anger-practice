/**
 * Verified Amazon ASINs for books on anger, boundaries, somatic work, emotional literacy.
 * Used for inline product placements and The Fire Library.
 */

export interface Book {
  asin: string;
  title: string;
  brand: string; // author for books
  category: "books";
  summary: string;
  mechanism: string;
  caution: string;
}

export const BOOKS: Book[] = [
  {
    asin: "0062957031",
    title: "The Dance of Anger — Harriet Lerner",
    brand: "Harriet Lerner",
    category: "books",
    summary: "The foundational text on anger as information, especially for women.",
    mechanism: "Reframes anger as a signal about relational patterns, not a character flaw.",
    caution: "Written with heterosexual couples as the default - still applicable.",
  },
  {
    asin: "1501189557",
    title: "Rage Becomes Her — Soraya Chemaly",
    brand: "Soraya Chemaly",
    category: "books",
    summary: "Why women's anger is pathologized and what happens when we stop suppressing it.",
    mechanism: "Cultural and physiological mapping of female anger in America.",
    caution: "Heavy and necessary.",
  },
  {
    asin: "1583949968",
    title: "The Language of Emotions — Karla McLaren",
    brand: "Karla McLaren",
    category: "books",
    summary: "A chapter on every emotion including anger as the honorable boundary-protector.",
    mechanism: "Gives each emotion a job description so you can stop fighting them.",
    caution: "McLaren's tone is direct - no spiritual fluff.",
  },
  {
    asin: "155643943X",
    title: "Waking the Tiger — Peter Levine",
    brand: "Peter Levine",
    category: "books",
    summary: "Somatic experiencing foundations; frozen anger and how bodies release trauma.",
    mechanism: "Teaches titration and pendulation with trauma-stored activation.",
    caution: "Paired with a somatic practitioner is ideal.",
  },
  {
    asin: "158394594X",
    title: "In an Unspoken Voice — Peter Levine",
    brand: "Peter Levine",
    category: "books",
    summary: "Deeper somatic work; the mechanics of how rage gets stuck in tissue.",
    mechanism: "Polyvagal + somatic experiencing framework.",
    caution: "Dense; take it slowly.",
  },
  {
    asin: "1583949933",
    title: "When the Body Says No — Gabor Maté",
    brand: "Gabor Maté",
    category: "books",
    summary: "Suppressed anger and its measurable cost to the immune and endocrine systems.",
    mechanism: "Case studies and research on emotional repression and disease.",
    caution: "Read it when you're ready; it lands hard.",
  },
  {
    asin: "1594484473",
    title: "Anger: Wisdom for Cooling the Flames — Thich Nhat Hanh",
    brand: "Thich Nhat Hanh",
    category: "books",
    summary: "Buddhist, deeply patient approach to anger as a suffering messenger.",
    mechanism: "Mindfulness-based 'holding' practice for anger without suppression.",
    caution: "Some chapters can read as bypassing if you're not grounded; pair with Chemaly.",
  },
  {
    asin: "1622039440",
    title: "To Be a Man — Robert Augustus Masters",
    brand: "Robert Augustus Masters",
    category: "books",
    summary: "Anger, masculinity, and spiritual bypassing — bluntly.",
    mechanism: "Rage as fuel for mature masculinity when it's not being shamed into performance.",
    caution: "Male-identified focus; still useful for partners.",
  },
  {
    asin: "1622038371",
    title: "Spiritual Bypassing — Robert Augustus Masters",
    brand: "Robert Augustus Masters",
    category: "books",
    summary: "How spirituality gets used to avoid anger (and everything else).",
    mechanism: "Names the moves — 'love and light', 'forgive and release' — with clinical precision.",
    caution: "You may recognize yourself. That's the point.",
  },
  {
    asin: "0806540788",
    title: "Honor Your Anger — Beverly Engel",
    brand: "Beverly Engel",
    category: "books",
    summary: "Practical workbook for converting suppressed anger into healthy expression.",
    mechanism: "Exercises, journal prompts, and scripts for boundary-setting.",
    caution: "Self-help tone; take what's useful.",
  },
  {
    asin: "0393708810",
    title: "Sensorimotor Psychotherapy — Pat Ogden",
    brand: "Pat Ogden",
    category: "books",
    summary: "Clinical text on working with anger-as-impulse trapped in the body.",
    mechanism: "Integrates attachment, trauma, and somatic tracking.",
    caution: "Written for clinicians but accessible.",
  },
  {
    asin: "0060921269",
    title: "Care of the Soul — Thomas Moore",
    brand: "Thomas Moore",
    category: "books",
    summary: "Depth-psychology view of anger as shadow material to be honored, not dissolved.",
    mechanism: "Archetypal framing; Saturn, Mars, and the necessary dark.",
    caution: "Dense prose; reads like liturgy in places.",
  },
];
