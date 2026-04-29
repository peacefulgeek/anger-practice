export default function Privacy() {
  return (
    <div className="fade-rise container py-16 max-w-3xl">
      <div className="dateline mb-4">Privacy & Disclosures</div>
      <h1 className="masthead text-[var(--ink)] text-[2.5rem] sm:text-[3.5rem]">
        How this journal works.
      </h1>

      <div className="mt-10 prose-anger">
        <h2>No accounts. No tracking pixels beyond site analytics.</h2>
        <p>
          The Anger Practice does not require an account. Assessments run locally in your browser
          — your answers are never sent anywhere and never stored server-side. Close the tab and
          the data is gone.
        </p>

        <h2>Amazon Associates disclosure.</h2>
        <p>
          We are participants in the Amazon Services LLC Associates Program, an affiliate
          advertising program designed to provide a means for sites to earn advertising fees by
          advertising and linking to Amazon.com. Every product link on this site includes our
          Associates tag. If you purchase through one of our links, we may receive a small
          commission at no extra cost to you.
        </p>

        <h2>Not medical advice.</h2>
        <p>
          Nothing on this site is medical, psychological, or clinical advice. If your anger is
          harming you or someone you love, please work with a qualified practitioner — a licensed
          therapist, physician, somatic practitioner, TCM practitioner, or Ayurvedic doctor.
          Herbs and supplements interact with medications. Consult a pharmacist or physician.
        </p>

        <h2>Editorial independence.</h2>
        <p>
          Products appear on this site because we believe they are useful, not because we are paid
          to feature them. No brand listed here has paid for placement. If that ever changes, we
          will disclose it prominently and in-line.
        </p>

        <h2>Contact.</h2>
        <p>
          Correspondence may be directed to our companion site{" "}
          <a href="https://theoraclelover.com">theoraclelover.com</a>.
        </p>
      </div>
    </div>
  );
}
