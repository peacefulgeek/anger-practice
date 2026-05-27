/**
 * Articles — the full library. Title-first editorial layout.
 * Hero with library photo + intro, then a stacked list of every published piece.
 * No three-column meta strip; titles dominate, dates and word counts are small meta.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useArticles } from "@/data/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function Articles() {
  const articles = useArticles();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.dek.toLowerCase().includes(q) ||
        ((a as { tags?: string[] }).tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [query, articles]);

  return (
    <div className="fade-rise">
      {/* Hero */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-16 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <div className="dateline mb-4">
              The Library <span className="ember-bullet" /> {articles.length} Pieces
            </div>
            <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[4rem] leading-[1.05]">
              Every dispatch from the <span className="italic font-normal text-[var(--ember-deep)]">fire</span>.
            </h1>
            <p className="dek mt-6 max-w-xl">
              Long-form, body-first writing on anger, suppressed rage, somatic release, and the
              relationship between fury and grief. New pieces unlock at intervals — the cron picks
              from a queue of over three hundred topics. Use the search to find what your body
              is asking for today.
            </p>
            <div className="mt-8">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, themes, tags…"
                className="w-full max-w-md bg-transparent border-b border-[color-mix(in_oklch,var(--ink)_30%,var(--paper))] py-3 text-lg text-[var(--ink)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ember-deep)] transition-colors"
                aria-label="Search articles"
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <img
              src="https://anger-practice.b-cdn.net/library/lib-22.webp"
              alt=""
              className="w-full aspect-[4/5] object-cover shadow-[0_20px_60px_-20px_rgba(42,36,32,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* The list */}
      <section className="container py-16">
        {filtered.length === 0 ? (
          <p className="text-[var(--muted-foreground)] text-center py-20">
            No pieces match "{query}". Try a different word.
          </p>
        ) : (
          <ol className="divide-y divide-[color-mix(in_oklch,var(--ink)_12%,var(--paper))]">
            {filtered.map((a, i) => (
              <li key={a.slug} className="py-10 group">
                <Link href={`/article/${a.slug}`} className="no-underline block">
                  <div className="grid md:grid-cols-12 gap-6">
                    {/* Hero image strip */}
                    <div className="md:col-span-4">
                      <div className="overflow-hidden">
                        <img
                          src={a.heroImage}
                          alt=""
                          className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {/* Title + dek + meta */}
                    <div className="md:col-span-8">
                      <div className="dateline mb-3 text-xs">
                        {String(i + 1).padStart(3, "0")}
                        <span className="mx-3 ember-bullet" />
                        {formatDate(a.publishedAt) || "—"}
                        <span className="mx-3 ember-bullet" />
                        {a.wordCount.toLocaleString()} words
                      </div>
                      <h2
                        className="text-2xl sm:text-3xl leading-tight text-[var(--ink)] group-hover:text-[var(--ember-deep)] transition-colors"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                      >
                        {a.title}
                      </h2>
                      <p className="mt-3 text-[1rem] text-[var(--muted-foreground)] leading-relaxed line-clamp-3 max-w-2xl">
                        {a.dek}
                      </p>
                      {(() => {
                        const tags = (a as { tags?: string[] }).tags || [];
                        return tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {tags.slice(0, 4).map((t: string) => (
                            <span
                              key={t}
                              className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--muted-foreground)] border border-[color-mix(in_oklch,var(--ink)_18%,var(--paper))] px-2 py-1"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
