import { Link } from "wouter";
import { ASSESSMENTS } from "@/data/assessments";

function libImg(n: number) {
  const idx = ((n - 1) % 40) + 1;
  return `https://anger-practice.b-cdn.net/library/lib-${String(idx).padStart(2, "0")}.webp`;
}

export default function Assessments() {
  return (
    <div className="fade-rise">
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="dateline mb-4">Nine Self-Assessments</div>
            <h1 className="masthead text-[var(--ink)] text-[2.25rem] sm:text-[3.5rem]">
              Where does your anger live?
            </h1>
            <p className="dek mt-5 max-w-xl">
              Nine short inventories — somatic, relational, TCM, Ayurvedic, and developmental —
              to map how your anger is held, hidden, or ready to move. No score is judgmental.
              Nothing is stored.
            </p>
            <p className="mt-5 text-sm text-[var(--muted-foreground)]">
              None of these are diagnostic. For clinical support, see a qualified practitioner.
            </p>
          </div>
          <div>
            <img
              src={libImg(7)}
              alt=""
              className="w-full aspect-[4/3] object-cover shadow-[0_20px_60px_-20px_rgba(42,36,32,0.5)]"
            />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ASSESSMENTS.map((a) => (
            <Link
              key={a.slug}
              href={`/assessments/${a.slug}`}
              className="no-underline group"
            >
              <div className="journal-card p-7 h-full transition-shadow hover:shadow-[0_10px_30px_-10px_rgba(42,36,32,0.4)]">
                <div className="dateline mb-3">
                  Assessment {String(a.number).padStart(2, "0")}
                </div>
                <h3
                  className="text-2xl leading-tight text-[var(--ink)] group-hover:text-[var(--ember-deep)] transition-colors"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                >
                  {a.title}
                </h3>
                <p className="mt-2 italic text-[var(--muted-foreground)]">{a.subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
                  {a.intro}
                </p>
                <div className="mt-5 dateline text-[var(--ember)]">Take it →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
