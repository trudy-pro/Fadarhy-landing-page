import { Globe, Layers, MapPin, FlaskConical } from "lucide-react";
import { FadeUp } from "@/components/Reveal";

const parts = [
  { word: "Fadä", note: "Basel dialect for thread." },
  { word: "Rhy", note: "Basel dialect for the Rhine." },
];

const tags = [
  { label: "Basel-Stadt", Icon: MapPin },
  { label: "Life sciences cluster", Icon: FlaskConical },
  { label: "Multi-canton data", Icon: Layers },
  { label: "International vision", Icon: Globe },
];

export function NameStory() {
  return (
    <section id="name" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[960px] px-4 lg:px-10">
        <FadeUp className="text-center">
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">The name</p>
          <h2 className="mt-3 text-[48px] font-semibold leading-none tracking-[-0.03em] text-ink lg:text-[80px]">FadäRhy</h2>
          <p className="mt-4 font-mono text-[12px] uppercase tracking-wider text-ink-muted">Pronounced fa-dä-ry · 47.5596° N, 7.5886° E</p>
        </FadeUp>

        <FadeUp className="mt-12 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-2 md:divide-x md:divide-line">
          {parts.map((p) => (
            <div key={p.word} className="border-b border-line p-8 last:border-b-0 md:border-b-0 md:p-10">
              <p className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink lg:text-[56px]">{p.word}</p>
              <p className="mt-4 font-mono text-[14px] text-ink-muted">{p.note}</p>
            </div>
          ))}
        </FadeUp>

        <FadeUp className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center md:p-10">
          <p className="mx-auto max-w-3xl text-[20px] leading-relaxed text-ink lg:text-[24px]">
            The thread through an innovation ecosystem. We started in Basel's life-sciences ecosystem and already include data from several Swiss cantons. Our origin is local; our vision is international.
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {tags.map(({ label, Icon }) => (
              <li key={label} className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-2 font-mono text-[12px] text-ink">
                <Icon className="size-3.5 text-link" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
