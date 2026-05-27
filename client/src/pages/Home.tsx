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
  const lead = articles[0];
  const featured = articles.slice(1, 4);
  const rest = articles.slice(4);
  const libraryHero = "https://anger-practice.b-cdn.net/library/lib-01.webp";

  return (
    <div className="fade-rise">
      {/* Hero masthead */}
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container pt-10 pb-16 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <div className="dateline mb-4">
              Volume I <span className="ember-bullet" /> Body-First Writing on Anger
            </div>
            <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[4rem] lg:text-[5.5rem]">
              Anger isn't <span className="italic font-normal text-[var(--ember-deep)]">the enemy.</span>
              <br />
              It's the messenger<br />
              you've been <span className="italic">ignoring.</span>
            </h1>
            <p className="dek mt-6 max-w-xl">
              A companion journal to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>
              . Essays on healthy anger, suppressed rage, somatic release, and the body that keeps
              the score whether you listen or not.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <img
                src={lead?.heroImage || libraryHero}
                alt=""
                className="w-full aspect-[4/5] object-cover shadow-[0_20px_60px_-20px_rgba(42,36,32,0.5)]"
              />
              <div className="absolute -bottom-4 -left-4 bg-[var(--ember)] text-[var(--paper)] px-5 py-2 dateline">
                Issue {String(articles.length || 0).padStart(3, "0")} <span className="ember-bullet" style={{ background: "var(--paper)" }} /> {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead article */}
      {lead && (
        <section className="container py-16 border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3">
              <div className="dateline mb-2">The Lead</div>
              <div className="rule-off-bleed mb-4" />
              <div className="text-xs text-[var(--muted-foreground)]">
                Published {formatDate(lead.publishedAt)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {lead.wordCount.toLocaleString()} words
              </div>
            </div>
            <div className="lg:col-span-9">
              <Link href={`/article/${lead.slug}`} className="no-underline">
                <h2 className="masthead text-[2rem] sm:text-[2.75rem] text-[var(--ink)] hover:text-[var(--ember-deep)] transition-colors">
                  {lead.title}
                </h2>
              </Link>
              <p className="dek mt-5 max-w-3xl">{lead.dek}</p>
              <Link href={`/article/${lead.slug}`} className="btn-ember mt-8 no-underline">
                Read the piece →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured row */}
      {featured.length > 0 && (
        <section className="container py-16 border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
          <div className="dateline mb-8">In This Issue <span className="ember-bullet" /> Three Pieces</div>
          <div className="grid md:grid-cols-3 gap-10">
            {featured.map((a) => (
              <article key={a.slug} className="group">
                <Link href={`/article/${a.slug}`} className="no-underline">
                  <div className="overflow-hidden mb-5">
                    <img
                      src={a.heroImage}
                      alt=""
                      className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="dateline mb-2">{formatDate(a.publishedAt)}</div>
                  <h3 className="font-display text-2xl leading-tight text-[var(--ink)] group-hover:text-[var(--ember-deep)] transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                    {a.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
                    {a.dek}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Rest of the stream */}
      {rest.length > 0 && (
        <section className="container py-16">
          <div className="dateline mb-8">Fire Library <span className="ember-bullet" /> Every Dispatch</div>
          <ol className="divide-y divide-[color-mix(in_oklch,var(--ink)_12%,var(--paper))]">
            {rest.map((a, i) => (
              <li key={a.slug} className="py-6 grid md:grid-cols-12 gap-5 items-baseline">
                <div className="md:col-span-1 dateline">{String(i + featured.length + 2).padStart(3, "0")}</div>
                <div className="md:col-span-2 dateline">{formatDate(a.publishedAt)}</div>
                <div className="md:col-span-9">
                  <Link href={`/article/${a.slug}`} className="no-underline">
                    <h3
                      className="text-xl sm:text-2xl leading-tight text-[var(--ink)] hover:text-[var(--ember-deep)] transition-colors"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                    >
                      {a.title}
                    </h3>
                  </Link>
                  <p className="text-[0.95rem] text-[var(--muted-foreground)] mt-1 line-clamp-2">
                    {a.dek}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Invitation */}
      <section className="container my-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src="https://anger-practice.b-cdn.net/library/lib-17.webp"
          alt=""
          className="w-full aspect-[4/3] object-cover"
        />
        <div>
          <div className="dateline mb-3">An Invitation</div>
          <h2 className="masthead text-[var(--ink)] text-3xl sm:text-4xl leading-tight">
            If you were taught your anger was ugly, you were taught wrong.
          </h2>
          <p className="mt-5 text-[var(--muted-foreground)] leading-relaxed">
            Start with the assessments to see where your anger is held. Then visit{" "}
            <Link href="/herbs">the herb cabinet</Link> and the{" "}
            <Link href="/fire-toolkit">Fire Toolkit</Link>. Or read the journal end to end. No correct order.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/assessments" className="btn-ember no-underline">
              Take an Assessment
            </Link>
            <Link href="/herbs" className="btn-ember no-underline" style={{ background: "var(--ink)" }}>
              Herbs & Supplements
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
