import { Link } from "wouter";

function libImg(n: number) {
  const idx = ((n - 1) % 40) + 1;
  return `https://anger-practice.b-cdn.net/library/lib-${String(idx).padStart(2, "0")}.webp`;
}

interface Practice {
  title: string;
  minutes: string;
  body: string;
  img: number;
}

const PRACTICES: Practice[] = [
  {
    title: "The Pillow Press",
    minutes: "3 minutes",
    body: "Lie on your back. Take a firm pillow and press it hard against your chest with straight arms. Push until your arms shake. Drop the pillow. Notice what rushes through. Repeat up to three times. This gives the body a yes-motor equivalent to the no you've been swallowing.",
    img: 4,
  },
  {
    title: "The Forest Howl",
    minutes: "5 minutes",
    body: "Find a place where no one can hear you. Start with a sound at the back of your throat that sounds like a low growl. Let it rise in pitch and volume over ninety seconds. Don't pretty it up. Then stop and breathe into your low belly for two minutes. If tears come, let them. The sound is the lock-pick.",
    img: 37,
  },
  {
    title: "Chopping What Deserves It",
    minutes: "10 minutes",
    body: "Go outside with kindling and a small axe (or indoors with a wooden mallet and a bag of ice you break against a rock). The target is concrete, the motion is whole-body, and the completion is audible. This is not metaphor — the body needs motor discharge to finish an anger cycle it never got to finish.",
    img: 37,
  },
  {
    title: "The Resentment Letter",
    minutes: "15 minutes",
    body: "Open a blank page. Address it to the person you're angriest at — living, dead, or yourself. Write without stopping for fifteen minutes. No craft, no editing, no fear. Name every grievance you've been pretending to be above. Then burn the page or tear it into pieces. You are not sending it. You are getting it out of your tissue.",
    img: 40,
  },
  {
    title: "Cold Water on the Vagus",
    minutes: "60 seconds",
    body: "Fill a bowl with cold water and ice. Splash your face — eyes, cheeks, forehead — for thirty to sixty seconds, exhaling as you do. The mammalian dive reflex resets heart rate and parasympathetic tone. Use this when anger is spiking and you are about to say something you will regret.",
    img: 38,
  },
  {
    title: "The Counting Breath",
    minutes: "2 minutes",
    body: "Inhale for four counts. Exhale for eight. Focus only on the exhale being twice as long as the inhale. Do this for two minutes. The extended exhale activates parasympathetic tone without pretending the anger isn't there. Useful as a runway, not an extinguisher.",
    img: 31,
  },
  {
    title: "The Specific Sentence Rehearsal",
    minutes: "10 minutes",
    body: "Choose one person, one recurring situation. Write down the exact sentence you wish you had said. Read it aloud to a mirror. Adjust until it is clean, short, and true. The next time the situation arises, deliver it — without the apology or the softener. You're not trying to be cruel. You are trying to be specific.",
    img: 17,
  },
  {
    title: "The Body Map",
    minutes: "5 minutes",
    body: "Sit with your eyes closed. Scan your body from crown to feet. Find the three places anger is living right now. Breathe into each one for thirty seconds without trying to change it. Naming locations is most of the work. The rest the body does on its own.",
    img: 3,
  },
  {
    title: "The Morning Move",
    minutes: "7 minutes",
    body: "Before coffee: seven minutes of something your body hasn't done yet today. Shake, dance, throw punches at the air, run up stairs, kick a pillow. The goal is not fitness. It is finishing the energy an eight-hour sleep couldn't move. Liver qi hates stillness more than anything else.",
    img: 21,
  },
];

export default function FireToolkit() {
  return (
    <div className="fade-rise">
      <section className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="dateline mb-4">Nine Practices</div>
            <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[4rem]">
              The Fire Toolkit.
            </h1>
            <p className="dek mt-5 max-w-xl">
              Body-first practices that finish the anger cycle your day kept you from finishing.
              Most run under ten minutes. None ask you to be over your anger. They ask you to
              let it move.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img src={libImg(37)} alt="" className="w-full aspect-[4/5] object-cover" />
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid md:grid-cols-2 gap-8">
          {PRACTICES.map((p, i) => (
            <article key={i} className="journal-card p-7">
              <div className="flex items-start justify-between">
                <div className="dateline">Practice {String(i + 1).padStart(2, "0")}</div>
                <div className="dateline text-[var(--ember)]">{p.minutes}</div>
              </div>
              <h3
                className="mt-3 text-2xl leading-tight text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                {p.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[var(--ink)]/90">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-20 text-center">
        <p className="text-sm text-[var(--muted-foreground)] max-w-2xl mx-auto">
          If you have a trauma history or a diagnosed mental health condition, do these with a
          somatic practitioner rather than alone. Anger is a safe signal; unsupervised flooding
          isn't always. See{" "}
          <Link href="/herbs">the herb cabinet</Link> for physiological support.
        </p>
      </section>
    </div>
  );
}
