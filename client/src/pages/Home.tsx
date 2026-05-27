/**
 * Home — editorial landing.
 * No library list (that's /articles). Designed to feel like opening a beautifully
 * printed magazine: hero, mission, three pillars (Assessments / Herbs / Articles),
 * three featured pieces, then a soft invitation.
 */
import { Link } from "wouter";
import { useArticles } from "@/data/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function Home() {
  const articles = useArticles();
  const featured = articles.slice(0, 3);
  const heroImg = articles[0]?.heroImage || "https://anger-practice.b-cdn.net/library/lib-01.webp";

  return (
    <div className="fade-rise">
      {/* ─── HERO MASTHEAD ─────────────────────────────── */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container pt-16 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="dateline mb-5">
              The Anger Practice <span className="ember-bullet" /> Volume I
            </div>
            <h1 className="masthead text-[var(--ink)] text-[2.75rem] sm:text-[4.5rem] lg:text-[6rem] leading-[0.95]">
              Anger isn't{" "}
              <span className="italic font-normal text-[var(--ember-deep)]">the enemy.</span>
              <br />
              It's the messenger
              <br />
              you've been{" "}
              <span className="italic">ignoring.</span>
            </h1>
            <p className="dek mt-8 max-w-xl text-lg leading-relaxed">
              A body-first sanctuary for women who were taught their fury was ugly. Long-form
              writing, somatic assessments, herbs that hold the nervous system, and a fire
              toolkit for when the rage comes home.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/articles" className="btn-ember no-underline">
                Read the articles →
              </Link>
              <Link
                href="/assessments"
                className="btn-ember no-underline"
                style={{ background: "var(--ink)" }}
              >
                Take an assessment
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <img
                src={heroImg}
                alt=""
                className="w-full aspect-[4/5] object-cover shadow-[0_30px_80px_-30px_rgba(42,36,32,0.55)]"
              />
              <div className="absolute -bottom-5 -left-5 bg-[var(--ember)] text-[var(--paper)] px-5 py-2 dateline">
                Issue {String(articles.length || 0).padStart(3, "0")}
                <span
                  className="ember-bullet"
                  style={{ background: "var(--paper)" }}
                />
                {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISSION / WHY THIS EXISTS ─────────────────── */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <div className="dateline mb-3">A Note from the Editor</div>
            <div className="rule-off-bleed mb-6" />
          </div>
          <div className="lg:col-span-8 max-w-3xl">
            <p
              className="text-2xl sm:text-3xl leading-[1.4] text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              You were not put on this earth to be palatable. Your anger is not a flaw in your
              wiring — it is the part of you that knows when something has gone wrong, and
              refuses to pretend.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--muted-foreground)]">
              This is not a self-help site. There are no twelve-step listicles, no Karen jokes,
              no "actually, it's just sadness" gaslighting. The work here is somatic and slow
              and assumes you are already an adult capable of metabolizing hard truths. We
              write about anger in the body — where it lives, how it gets stuck, what it costs,
              and how to let it move through you without burning the people you love.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
              You are welcome here at any temperature. Cold-rage, slow-simmer, full-blown
              wildfire. Read end-to-end or follow your body. There is no correct order.
            </p>
          </div>
        </div>
      </section>

      {/* ─── THREE PILLARS ─────────────────────────────── */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-20">
          <div className="dateline mb-10">
            What's Here <span className="ember-bullet" /> Three Doorways
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <PillarCard
              dateline="01 — The Library"
              title="Long-form writing, body-first."
              body="Over a hundred essays on suppressed rage, somatic release, anger after grief, anger inside relationships, and the nervous system that's been keeping the score. New pieces unlock at intervals."
              cta="Enter the library"
              href="/articles"
              image="https://anger-practice.b-cdn.net/library/lib-22.webp"
            />
            <PillarCard
              dateline="02 — The Assessments"
              title="Find where your anger is held."
              body="Nine nurturing self-assessments — somatic, relational, ancestral, grief-anger, suppression, expression, the inner critic, the inner protector, and a check-in for after a flare. No grades, just clarity."
              cta="Take an assessment"
              href="/assessments"
              image="https://anger-practice.b-cdn.net/library/lib-12.webp"
            />
            <PillarCard
              dateline="03 — The Cabinet"
              title="Herbs, tea, mineral support."
              body="A curated cabinet of nervines, adaptogens, TCM teapills, ayurvedic formulas, magnesium, amino acids, mushrooms, and flower essences — every entry verified live on Amazon, with three honest sentences each."
              cta="Open the cabinet"
              href="/herbs"
              image="https://anger-practice.b-cdn.net/library/lib-17.webp"
            />
          </div>
        </div>
      </section>

      {/* ─── THREE FEATURED PIECES ─────────────────────── */}
      {featured.length > 0 && (
        <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
          <div className="container py-20">
            <div className="dateline mb-10">
              From the Library <span className="ember-bullet" /> Begin Here
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {featured.map((a) => (
                <article key={a.slug} className="group">
                  <Link href={`/article/${a.slug}`} className="no-underline">
                    <div className="overflow-hidden mb-5">
                      <img
                        src={a.heroImage}
                        alt=""
                        className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="dateline mb-2 text-xs">
                      {formatDate(a.publishedAt) || "—"}
                      <span className="mx-3 ember-bullet" />
                      {a.wordCount.toLocaleString()} words
                    </div>
                    <h3
                      className="text-2xl leading-tight text-[var(--ink)] group-hover:text-[var(--ember-deep)] transition-colors"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                    >
                      {a.title}
                    </h3>
                    <p className="mt-3 text-[0.95rem] text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
                      {a.dek}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/articles" className="btn-ember no-underline">
                See all {articles.length} pieces →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── INVITATION ────────────────────────────────── */}
      <section className="container my-24 grid md:grid-cols-2 gap-14 items-center">
        <img
          src="https://anger-practice.b-cdn.net/library/lib-30.webp"
          alt=""
          className="w-full aspect-[4/3] object-cover shadow-[0_20px_60px_-20px_rgba(42,36,32,0.4)]"
        />
        <div>
          <div className="dateline mb-3">An Invitation</div>
          <h2 className="masthead text-[var(--ink)] text-3xl sm:text-5xl leading-tight">
            If you were taught your anger was ugly, you were taught wrong.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted-foreground)] max-w-xl">
            Stay a while. Read in any order. Bookmark the herbs you mean to try. Take an
            assessment when you have ten quiet minutes. There's no homework here — just an
            ongoing practice of meeting your fire honestly.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/articles" className="btn-ember no-underline">
              Read the library
            </Link>
            <Link
              href="/about"
              className="btn-ember no-underline"
              style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--ink)" }}
            >
              About this site
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PillarCard({
  dateline,
  title,
  body,
  cta,
  href,
  image,
}: {
  dateline: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  image: string;
}) {
  return (
    <article className="group flex flex-col">
      <Link href={href} className="no-underline flex flex-col h-full">
        <div className="overflow-hidden mb-5">
          <img
            src={image}
            alt=""
            className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="dateline mb-3 text-xs">{dateline}</div>
        <h3
          className="text-2xl leading-tight text-[var(--ink)] group-hover:text-[var(--ember-deep)] transition-colors"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {title}
        </h3>
        <p className="mt-3 text-[0.95rem] text-[var(--muted-foreground)] leading-relaxed flex-1">
          {body}
        </p>
        <span className="mt-5 dateline text-[var(--ember-deep)] group-hover:tracking-[0.2em] transition-all">
          {cta} →
        </span>
      </Link>
    </article>
  );
}
