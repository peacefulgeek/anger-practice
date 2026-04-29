import { Link } from "wouter";

function libImg(n: number) {
  const idx = ((n - 1) % 40) + 1;
  return `https://anger-practice.b-cdn.net/library/lib-${String(idx).padStart(2, "0")}.webp`;
}

export default function About() {
  return (
    <div className="fade-rise">
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="dateline mb-4">About the Journal</div>
            <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[4rem]">
              We write about anger like it's been waiting for us.
            </h1>
            <p className="dek mt-5 max-w-2xl">
              The Anger Practice is a companion journal to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>
              . It exists because most of what gets written about anger is either clinical and cold
              or pastel and bypassing. We wanted a third thing.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img
              src={libImg(39)}
              alt=""
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <div className="dateline">Editorial Stance</div>
        </div>
        <div className="lg:col-span-8 prose-anger">
          <p>
            Anger is information. It is the body's report that a boundary has been crossed, a need
            has been refused, or a truth has been asked to keep quiet. When we punish anger — our
            own or other people's — we don't remove the data. We just drive it underground, where
            it becomes illness, passive-aggression, depression, or a fight with the wrong person.
          </p>
          <p>
            This journal is written for adults who are done pretending. It takes from somatic
            experiencing, from Traditional Chinese Medicine, from Ayurveda, from the women who
            have written honestly about rage, and from years of listening to what the body wants
            when we finally stop asking it to be quieter.
          </p>
          <p>
            We don't publish "let it go" essays. We don't offer quick-fix catharsis. We don't
            promise that if you do your rage work correctly you'll stop being angry. You won't, and
            you shouldn't. The goal isn't to extinguish your fire. It's to stop setting your own
            life on it.
          </p>
        </div>
      </section>

      <section className="border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))] py-16">
        <div className="container grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="dateline">The Byline</div>
          </div>
          <div className="lg:col-span-8 prose-anger">
            <p>
              Written by <span className="font-medium">The Oracle Lover</span>. A companion journal
              to{" "}
              <a href="https://theoraclelover.com">theoraclelover.com</a>.
            </p>
            <p>
              The Oracle Lover is a literary voice, not an influencer or a guru. We don't sell
              courses. We write essays. When we mention a book or a supplement, it is linked through
              our Amazon Associates account, and that is the only commercial relationship behind
              this journal. You can read every piece without clicking a single link.
            </p>
            <p>
              Articles are generated daily from a long editorial queue, pass a voice-integrity gate,
              and are reviewed before publication. We cite working researchers and clinicians —
              Harriet Lerner, Soraya Chemaly, Peter Levine, Gabor Maté, Karla McLaren, Robert
              Augustus Masters, Thich Nhat Hanh, Thomas Moore, Pat Ogden, Beverly Engel — and we
              don't invent quotes.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))] py-16">
        <div className="container grid md:grid-cols-3 gap-8">
          <Link href="/assessments" className="journal-card p-6 no-underline">
            <div className="dateline mb-2">Start Here</div>
            <div className="masthead text-2xl text-[var(--ink)]">Nine Assessments</div>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              Map your anger — somatic, relational, doshic, inherited.
            </p>
          </Link>
          <Link href="/herbs" className="journal-card p-6 no-underline">
            <div className="dateline mb-2">The Cabinet</div>
            <div className="masthead text-2xl text-[var(--ink)]">Forty Herbs</div>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              Nervines, TCM formulas, pitta-pacifiers, and amino acids.
            </p>
          </Link>
          <Link href="/fire-toolkit" className="journal-card p-6 no-underline">
            <div className="dateline mb-2">The Toolkit</div>
            <div className="masthead text-2xl text-[var(--ink)]">Fire Toolkit</div>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              Body-based practices for when anger rises. Under-5-minute versions.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
