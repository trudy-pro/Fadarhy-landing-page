import { FadeUp } from "@/components/Reveal";

const facts = [
  { v: "Hack am Rhein '26", c: "text-ink" },
  { v: "Overall winner", c: "text-link" },
  { v: "Ariadne prototype", c: "text-ink" },
  { v: "Live public beta", c: "text-link" },
];

export function Journey() {
  return (
    <section id="journey" className="bg-surface py-20 lg:py-28">
      <FadeUp className="mx-auto max-w-[1240px] px-4 text-center lg:px-10">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-link">Our journey</p>
        <h2 className="mx-auto mt-3 max-w-[760px] md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">
          A winning weekend. <span className="text-link">See the longer thread.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[680px] md-body-large text-ink-muted">
          Overall winner · Hack am Rhein 2026. Ariadne was the prototype; FadäRhy is the next chapter, now a live beta, free for founders.
        </p>
        <a href="#team" className="mt-8 inline-flex min-h-12 items-center rounded-btn border border-line-strong px-6 text-[16px] font-medium text-ink hover:bg-background">
          Explore our journey
        </a>

        <div className="mx-auto mt-14 grid max-w-[900px] grid-cols-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface md:grid-cols-4 md:divide-x md:divide-y-0">
          {facts.map((f) => (
            <div key={f.v} className="p-5">
              <span className={`text-[13px] font-semibold ${f.c}`}>{f.v}</span>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}
