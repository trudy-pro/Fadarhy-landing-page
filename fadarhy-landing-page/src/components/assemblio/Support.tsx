import { MeshCard, StatsCard } from "./Mesh";
import { FadeUp } from "@/components/Reveal";

const body = "card-desc text-ink-muted";

const cards = [
  {
    audience: "For founders",
    title: "Too much searching",
    questions: ["Which lab fits our stage?", "Which grant is open now?", "Who should we speak to about regulatory questions?"],
    close: "The answer usually exists. Finding it is the hard part.",
  },
  {
    audience: "For ecosystem teams",
    title: "Too much manual routing",
    body: "Support organisations repeatedly answer the same “Who should I talk to?” questions through email, spreadsheets and personal knowledge, with little visibility into what happens after the introduction.",
  },
];

export function Support() {
  return (
    <section className="bg-section">
      <div className="mx-auto max-w-[1240px] px-4 py-12 lg:px-10 lg:py-16">
      <FadeUp className="mb-6 max-w-3xl px-1">
        <p className="text-[12px] font-medium uppercase tracking-tight text-link">The problem</p>
        <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">
          The help exists. <span className="text-link">Finding the right path doesn’t.</span>
        </h2>
        <p className="mt-3 md-body-large text-ink-muted">
          Basel has the expertise, funding, labs and partners companies need. But access is fragmented across organisations, websites, PDFs and personal networks.
        </p>
      </FadeUp>

      <div className="grid gap-4 lg:grid-cols-12">
        {cards.map(({ audience, title, questions, close, body: text }, i) => (
          <FadeUp as="article" key={title} delay={i * 80} className="surface-card flex flex-col p-6 lg:col-span-5 lg:col-start-1">
            <p className="w-fit rounded-chip bg-section px-2.5 py-1 card-label text-ink-muted">{audience}</p>
            <h3 className="mt-2 card-title text-ink">{title}</h3>
            {questions ? (
              <>
                <ul className="mt-5 space-y-2.5">
                  {questions.map((q) => (
                    <li key={q} className="rounded-r-md border-l-2 border-rhine-blue! bg-secondary px-4 py-2.5 text-[16px] leading-[1.4] text-ink">{q}</li>
                  ))}
                </ul>
                <p className="mt-auto pt-6 card-desc font-medium text-ink">{close}</p>
              </>
            ) : (
              <p className={`mt-3 ${body}`}>{text}</p>
            )}
          </FadeUp>
        ))}
        <FadeUp delay={160} className="flex flex-col justify-center surface-card px-5 py-6 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <p className="text-center text-[12px] font-medium uppercase tracking-tight text-ink-muted">One ecosystem. Many disconnected entry points.</p>
          <div className="mt-4"><MeshCard /></div>
          <p className="mt-4 flex items-center justify-center gap-2 text-[15px] font-medium text-ink">
            <span className="size-1.5 rounded-full bg-rhine-blue" aria-hidden />
            One request <span className="text-link" aria-hidden>→</span><span className="sr-only">leads to</span> the right next step.
          </p>
        </FadeUp>
        <FadeUp delay={240} className="surface-card p-6 lg:col-span-12">
          <StatsCard />
        </FadeUp>
      </div>
      </div>
    </section>
  );
}
