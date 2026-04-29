import { HERBS, CATEGORY_LABEL, amazonUrl, Herb } from "@/data/herbs";

function libImg(n: number) {
  const idx = ((n - 1) % 40) + 1;
  return `https://anger-practice.b-cdn.net/library/lib-${String(idx).padStart(2, "0")}.webp`;
}

const CATEGORY_ORDER: Herb["category"][] = [
  "nervous-system",
  "liver-tcm",
  "pitta-ayurveda",
  "adaptogen",
  "magnesium",
  "amino-acid",
  "aromatherapy",
];

export default function Herbs() {
  const byCategory: Record<Herb["category"], Herb[]> = {
    "nervous-system": [],
    "liver-tcm": [],
    "pitta-ayurveda": [],
    adaptogen: [],
    magnesium: [],
    "amino-acid": [],
    aromatherapy: [],
  };
  HERBS.forEach((h) => byCategory[h.category].push(h));

  return (
    <div className="fade-rise">
      {/* Hero */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="dateline mb-4">Forty · Verified · Tagged</div>
            <h1 className="masthead text-[var(--ink)] text-[2.25rem] sm:text-[4rem]">
              The Herb Cabinet.
            </h1>
            <p className="dek mt-5 max-w-xl">
              Forty herbs, supplements, and formulas that help the body work with anger —
              not around it. Every product is verified by ASIN and linked with our Amazon
              Associates tag. Nothing here is medical advice.
            </p>
            <p className="mt-5 text-sm text-[var(--muted-foreground)] max-w-xl">
              Grouped by modality: nervines (Western herbalism), liver-channel formulas (TCM),
              pitta-pacifiers (Ayurveda), adaptogens, magnesium forms, targeted amino acids,
              and a few essential oils that hold up under research.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img
              src={libImg(36)}
              alt=""
              className="w-full aspect-[4/5] object-cover shadow-[0_20px_60px_-20px_rgba(42,36,32,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* Category nav */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))] py-5 bg-[color-mix(in_oklch,var(--paper)_95%,var(--ember))]">
        <div className="container flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="dateline">Jump to:</span>
          {CATEGORY_ORDER.map((c) => (
            <a
              key={c}
              href={`#${c}`}
              className="dateline text-[var(--ink)] hover:text-[var(--ember)] no-underline"
            >
              {CATEGORY_LABEL[c]}
            </a>
          ))}
        </div>
      </section>

      {/* Groups */}
      {CATEGORY_ORDER.map((c, ci) => {
        const items = byCategory[c];
        if (!items.length) return null;
        return (
          <section
            key={c}
            id={c}
            className={`py-16 ${ci % 2 === 1 ? "bg-[color-mix(in_oklch,var(--paper)_96%,var(--ember))]" : ""}`}
          >
            <div className="container">
              <div className="grid lg:grid-cols-12 gap-6 mb-8 items-baseline">
                <div className="lg:col-span-4">
                  <div className="dateline">Category {String(ci + 1).padStart(2, "0")}</div>
                  <h2 className="masthead text-[var(--ink)] text-3xl sm:text-4xl leading-tight">
                    {CATEGORY_LABEL[c]}
                  </h2>
                </div>
                <div className="lg:col-span-8 text-[var(--muted-foreground)] leading-relaxed">
                  {categoryBlurb(c)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {items.map((h, hi) => (
                  <a
                    key={h.asin}
                    href={amazonUrl(h.asin)}
                    target="_blank"
                    rel="noopener"
                    className="journal-card p-6 no-underline block hover:shadow-[0_10px_30px_-10px_rgba(42,36,32,0.35)] transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="dateline text-[var(--ember)]">
                        {String(hi + 1).padStart(2, "0")}
                      </div>
                      <div className="dateline text-[var(--muted-foreground)]">{h.brand}</div>
                    </div>
                    <h3
                      className="mt-3 text-xl leading-tight text-[var(--ink)]"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                    >
                      {h.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ink)] leading-relaxed">
                      {h.summary}
                    </p>
                    <div className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                      <span className="dateline text-[var(--ember-deep)] mr-2">How</span>
                      {h.mechanism}
                    </div>
                    <div className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                      <span className="dateline text-[var(--ember-deep)] mr-2">Caution</span>
                      {h.caution}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[var(--muted-foreground)]">ASIN {h.asin}</span>
                      <span className="dateline text-[var(--ember)]">Open on Amazon →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="container py-14 text-center">
        <p className="text-sm text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          As an Amazon Associate The Anger Practice earns from qualifying purchases. No product on
          this page is medical advice. Always consult a qualified practitioner before starting a
          supplement — especially if you are pregnant, nursing, or taking prescription medication.
        </p>
      </section>
    </div>
  );
}

function categoryBlurb(c: Herb["category"]): string {
  switch (c) {
    case "nervous-system":
      return "Nervines are herbs that act directly on the nervous system. Use these when anger keeps you awake, keeps your jaw clenched, or won't let a conversation go. Gentle to heavy-hitting, in that order.";
    case "liver-tcm":
      return "In Traditional Chinese Medicine, anger lives in the Liver channel. When it stagnates, everything else in your life feels blocked. These classical formulas move what's stuck.";
    case "pitta-ayurveda":
      return "Ayurveda reads anger as aggravated pitta — the fire element overshooting. These cooling herbs and formulas take the edge off without dousing your creative drive.";
    case "adaptogen":
      return "Adaptogens don't sedate. They rebuild cortisol rhythm and stress tolerance over weeks. Pick one and stay with it for at least a month before judging.";
    case "magnesium":
      return "Most angry people are magnesium-deficient and don't know it. Supplementing is the single most bang-for-buck intervention on this page. Take it at night.";
    case "amino-acid":
      return "Specific amino acids — theanine, glycine, taurine, 5-HTP — can soften the acute edge of anger or help the nervous system settle. Use with respect and check for interactions.";
    case "aromatherapy":
      return "Smell bypasses cortex and goes straight to the amygdala. Lavender, vetiver, and Roman chamomile all have real research behind them for acute nervous-system regulation.";
  }
}
