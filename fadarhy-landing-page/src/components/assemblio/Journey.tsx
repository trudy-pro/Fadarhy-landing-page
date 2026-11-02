import { FadeUp } from "@/components/Reveal";

const facts = [
  { v: "Hack am Rhein '26" },
  { v: "Overall winner", accent: true },
  { v: "Ariadne prototype" },
  { v: "Live public beta", accent: true },
];

export function Journey() {
  return (
    <section id="journey" className="bg-surface py-20 lg:py-28">
      <FadeUp className="mx-auto max-w-[1240px] px-4 text-center lg:px-10">
        <p className="text-[12px] font-medium uppercase tracking-tight text-link">Our journey</p>
        <h2 className="mx-auto mt-3 max-w-[760px] md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">
          A winning weekend. <span className="text-link">See the longer thread.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[680px] md-body-large text-ink-muted">
          Overall winner · Hack am Rhein 2026. Ariadne was the prototype; FadäRhy is the next chapter, now a live beta, free for founders.
        </p>
        <a href="#team" className="mt-8 inline-flex min-h-12 items-center rounded-btn border border-line-strong px-6 text-[16px] font-medium text-ink hover:bg-section">
          Explore our journey
        </a>

        <div className="mx-auto mt-14 grid max-w-[900px] grid-cols-2 divide-y divide-line overflow-hidden surface-card md:grid-cols-4 md:divide-x md:divide-y-0">
          {facts.map(({ v, accent }) => (
            <div key={v} className="p-6">
              <span className={`card-desc font-medium ${accent ? "text-link" : "text-ink"}`}>{v}</span>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}
