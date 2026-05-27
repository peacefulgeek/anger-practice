import { useParams, Link } from "wouter";
import { useArticles, useArticle } from "@/data/types";
import { Streamdown } from "streamdown";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const articles = useArticles();
  const article = useArticle(slug);

  if (!article) {
    return (
      <div className="container py-24 text-center">
        <h1 className="masthead text-4xl">Not in the articles yet.</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">
          This piece may still be in the press.
        </p>
        <Link href="/" className="btn-ember mt-8 inline-block no-underline">
          Return to the articles
        </Link>
      </div>
    );
  }

  const idx = articles.findIndex((a) => a.slug === slug);
  const prev = articles[idx + 1];
  const next = articles[idx - 1];

  // Add a dropcap span to the first paragraph of the body
  const body = article.bodyMarkdown.replace(
    /^([^\n#].{0,2})/,
    (m) => `<span class="dropcap">${m.charAt(0)}</span>${m.slice(1)}`,
  );

  return (
      <article className="fade-rise">
      {/* Headline block */}
      <header className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container pt-10 pb-14">
          <div className="dateline mb-6 flex items-center flex-wrap gap-x-3 gap-y-1">
            <Link href="/" className="no-underline">The Anger Practice</Link>
            {formatDate(article.publishedAt) && (
              <>
                <span className="ember-bullet" />
                <span>{formatDate(article.publishedAt)}</span>
              </>
            )}
            <span className="ember-bullet" />
            <span>{article.wordCount.toLocaleString()} words</span>
          </div>
          <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[4rem] lg:text-[5rem] max-w-5xl">
            {article.title}
          </h1>
          <p className="dek mt-6 max-w-3xl">{article.dek}</p>
          <div className="mt-8 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span>
              By <span className="text-[var(--ink)] font-medium">The Oracle Lover</span>
            </span>
            <span>·</span>
            <span>
              A companion journal to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>
            </span>
          </div>
        </div>
      </header>

      {/* Hero image full bleed */}
      <div className="w-full bg-[var(--ink)]/5 border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <img
          src={article.heroImage}
          alt=""
          className="w-full max-h-[640px] object-cover"
        />
      </div>

      {/* Body */}
      <div className="container py-14 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 lg:sticky lg:top-28 self-start text-sm">
          <div className="dateline mb-3">Referenced</div>
          <ul className="space-y-1.5 text-[var(--muted-foreground)]">
            {article.researchers.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
          <div className="dateline mt-10 mb-3">Byline</div>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            The Oracle Lover. Companion journal to{" "}
            <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
              theoraclelover.com
            </a>
            .
          </p>

          {article.inlineProducts?.[0] && (
            <div className="mt-10 journal-card p-4">
              <div className="dateline mb-2">On the shelf</div>
              <a
                href={article.inlineProducts[0].link}
                className="block font-medium text-[var(--ink)] no-underline hover:text-[var(--ember-deep)]"
                target="_blank"
                rel="noopener"
              >
                {article.inlineProducts[0].title}
              </a>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Amazon · affiliate link
              </p>
            </div>
          )}
        </aside>

        <div className="lg:col-span-9">
          <div className="prose-anger">
            <Streamdown>{body}</Streamdown>
          </div>

          {/* Bottom products */}
          {article.bottomProducts?.length > 0 && (
            <section className="mt-16 pt-10 border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
              <div className="dateline mb-6">
                The Shelf <span className="ember-bullet" /> Tools for this work
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {article.bottomProducts.map((p) => (
                  <a
                    key={p.asin}
                    href={p.link}
                    target="_blank"
                    rel="noopener"
                    className="journal-card p-5 no-underline block hover:shadow-md transition-shadow"
                  >
                    <div className="dateline mb-2 text-[var(--ember)]">{p.category}</div>
                    <div className="font-display text-lg text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                      {p.title}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-2">
                      ASIN {p.asin} · opens Amazon
                    </div>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                As an Amazon Associate we earn from qualifying purchases. Nothing here is medical advice.
              </p>
            </section>
          )}

          {/* Oracle Lover byline box */}
          <section className="mt-14 journal-card p-7">
            <div className="dateline mb-3">The Byline</div>
            <p className="text-[var(--ink)] leading-relaxed">
              Written by <span className="font-medium">The Oracle Lover</span>. The Anger Practice is a
              companion journal to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>
              . We don't do influencer tone, spiritual bypassing, or "just let it go." We do body-first,
              research-informed, unsentimental writing about what anger is actually asking of you.
            </p>
          </section>

          {/* Prev/Next */}
          <nav className="mt-14 pt-10 border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))] grid sm:grid-cols-2 gap-6">
            {prev && (
              <Link href={`/article/${prev.slug}`} className="no-underline">
                <div className="dateline mb-2">← Previous</div>
                <div className="text-lg font-display text-[var(--ink)] hover:text-[var(--ember-deep)]" style={{ fontFamily: "var(--font-display)" }}>
                  {prev.title}
                </div>
              </Link>
            )}
            {next && (
              <Link href={`/article/${next.slug}`} className="no-underline sm:text-right">
                <div className="dateline mb-2">Next →</div>
                <div className="text-lg font-display text-[var(--ink)] hover:text-[var(--ember-deep)]" style={{ fontFamily: "var(--font-display)" }}>
                  {next.title}
                </div>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </article>
  );
}
