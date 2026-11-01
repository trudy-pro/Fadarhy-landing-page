import { FadeUp } from "@/components/Reveal";

const rules = [
  { title: "Every recommendation shows its source", tag: "Verified provenance", body: "With a link and the date it was last checked." },
  { title: "Paying never buys ranking", tag: "Uncompromised neutrality", body: "Partners can't pay to appear higher in a founder's route." },
  { title: "Founders control what they share", tag: "Opt-in privacy", body: "A programme only sees what a founder approves for a specific referral." },
  { title: "No promised outcomes", tag: "Human agency", body: "We show the best next step. The meeting and the decision stay with people." },
];

export function Principles() {
  return (
    <section className="bg-surface">
    <div className="mx-auto max-w-[1240px] px-4 py-12 lg:px-10 lg:py-16">
      <FadeUp className="mb-6 max-w-3xl px-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-link">Principles</p>
        <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">Rules we don't bend</h2>
        <p className="mt-3 md-body-large text-ink-muted">Core operational principles guiding our recommendations, independence, and ecosystem trust.</p>
      </FadeUp>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rules.map((r, i) => (
          <FadeUp key={r.title} delay={i * 60} className="flex">
            <article className="flex w-full flex-col gap-4 rounded-card border border-line bg-surface px-6 py-6">
              <span className="grid h-8 w-10 place-items-center rounded-chip bg-background text-[14px] text-link">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="md-title-large">{r.title}</h3>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{r.tag}</p>
              </div>
              <p className="mt-auto md-body-large text-ink-muted">{r.body}</p>
            </article>
          </FadeUp>
        ))}
      </div>
    </div>
    </section>
  );
}
