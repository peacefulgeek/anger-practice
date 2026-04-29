import { useParams, Link } from "wouter";
import { useMemo, useState } from "react";
import { ASSESSMENTS } from "@/data/assessments";

function libImg(n: number) {
  const idx = ((n - 1) % 40) + 1;
  return `https://anger-practice.b-cdn.net/library/lib-${String(idx).padStart(2, "0")}.webp`;
}

export default function Assessment() {
  const { slug } = useParams<{ slug: string }>();
  const a = useMemo(() => ASSESSMENTS.find((x) => x.slug === slug), [slug]);

  const [answers, setAnswers] = useState<number[]>(a ? new Array(a.questions.length).fill(0) : []);
  const [submitted, setSubmitted] = useState(false);

  if (!a) {
    return (
      <div className="container py-24 text-center">
        <h1 className="masthead text-4xl">Not found.</h1>
        <Link href="/assessments" className="btn-ember mt-6 inline-block no-underline">
          All assessments
        </Link>
      </div>
    );
  }

  const filled = answers.every((x) => x > 0);
  const total = answers.reduce((s, x) => s + x, 0);
  const band = a.bands.find((b) => total >= b.min && total <= b.max) || a.bands[0];

  return (
    <div className="fade-rise">
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-14">
          <div className="dateline mb-3">
            Assessment {String(a.number).padStart(2, "0")} of 09
          </div>
          <h1 className="masthead text-[var(--ink)] text-[2.25rem] sm:text-[3.5rem] max-w-4xl">
            {a.title}
          </h1>
          <p className="dek mt-4 max-w-3xl">{a.subtitle}</p>
          <p className="mt-6 max-w-3xl text-[var(--muted-foreground)] leading-relaxed">
            {a.intro}
          </p>
        </div>
      </section>

      <section className="container py-14 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <img
            src={libImg(a.heroIdx)}
            alt=""
            className="w-full aspect-[4/5] object-cover"
          />
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Scale: 1 ({a.scale.labels[0]}) to 5 ({a.scale.labels[1]}).
          </p>
        </aside>

        <div className="lg:col-span-9">
          {!submitted ? (
            <ol className="space-y-8">
              {a.questions.map((q, i) => (
                <li key={i}>
                  <div className="flex items-baseline gap-3">
                    <span className="dateline">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-lg text-[var(--ink)] leading-snug">{q.q}</p>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          const copy = [...answers];
                          copy[i] = n;
                          setAnswers(copy);
                        }}
                        className={`w-11 h-11 border text-sm transition-colors ${
                          answers[i] === n
                            ? "bg-[var(--ember)] border-[var(--ember)] text-[var(--paper)]"
                            : "bg-transparent border-[color-mix(in_oklch,var(--ink)_22%,var(--paper))] text-[var(--ink)] hover:bg-[color-mix(in_oklch,var(--ember)_15%,var(--paper))]"
                        }`}
                        aria-label={`${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
              <li className="pt-6">
                <button
                  disabled={!filled}
                  onClick={() => setSubmitted(true)}
                  className="btn-ember disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  See your reading →
                </button>
                {!filled && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    Answer every item to see your reading. Nothing is stored.
                  </p>
                )}
              </li>
            </ol>
          ) : (
            <div className="journal-card p-8">
              <div className="dateline mb-3">Your Reading</div>
              <h2 className="masthead text-3xl sm:text-4xl text-[var(--ink)]">
                {band.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Score: {total} / {a.questions.length * 5}
              </p>
              <p className="mt-5 text-lg leading-relaxed text-[var(--ink)]">{band.body}</p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers(new Array(a.questions.length).fill(0));
                  }}
                  className="btn-ember"
                  style={{ background: "var(--ink)" }}
                >
                  Take it again
                </button>
                <Link href="/assessments" className="btn-ember no-underline">
                  More assessments
                </Link>
                <Link href="/herbs" className="dateline text-[var(--ember-deep)] no-underline self-center ml-2">
                  → Herbs & supplements
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--muted-foreground)]">
                This is a self-reflection instrument, not a clinical diagnosis.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
