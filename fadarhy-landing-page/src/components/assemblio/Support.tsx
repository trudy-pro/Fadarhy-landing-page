import { MeshCard, StatsCard } from "./Mesh";
import { FadeUp } from "@/components/Reveal";

const cards = [
  {
    title: "Weeks lost working out who to ask",
    body: "Which programme fits our stage? Who rents lab space to a team of four? Which grant is open right now? The answers exist, but finding them takes time founders don’t have.",
  },
  {
    title: "The same routing questions, every week",
    body: "Teams answer “who should I talk to about…?” by email and spreadsheet, and rarely see what happened after the introduction.",
  },
];

export function Support() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-20 pt-8 lg:px-10">
      <FadeUp className="max-w-3xl px-1">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">The problem</p>
        <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink lg:text-[34px]">
          The help exists. <span className="text-link">The path to it</span> is unclear.
        </h2>
        <p className="mt-3 text-[16px] text-ink-muted">
          Innovation ecosystems are full of programmes, labs, experts and funding. They are spread across websites, PDFs, spreadsheets and people’s inboxes.
        </p>
      </FadeUp>

      <div className="mt-8 grid gap-4 md:grid-cols-12">
        {cards.map((c, i) => (
          <article key={c.title} className={`rounded-xl bg-surface p-8 md:min-h-[250px] ${i === 0 ? "md:col-span-7" : "md:col-span-5"}`}>
            <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{c.title}</h3>
            <p className="mt-3 text-[17px] leading-[1.5] text-ink-muted md:max-w-[560px]">{c.body}</p>
          </article>
        ))}
        <div className="flex items-center rounded-xl bg-surface px-6 py-10 md:col-span-6">
          <MeshCard />
        </div>
        <div className="flex items-center rounded-xl bg-surface px-6 py-10 md:col-span-6">
          <div className="w-full"><StatsCard /></div>
        </div>
      </div>
    </section>
  );
}
