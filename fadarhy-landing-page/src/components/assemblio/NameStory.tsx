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
          <p className="text-[12px] font-medium uppercase tracking-tight text-link">The name</p>
          <h2 className="mt-3 md-display-small font-semibold! tracking-[-0.02em]! text-ink lg:md-display-medium lg:text-[50px]! lg:leading-[3.625rem]!">FadäRhy</h2>
          <p className="mt-4 text-[12px] uppercase tracking-tight text-ink-muted">Pronounced fa-dä-ry</p>
        </FadeUp>

        <FadeUp className="mt-12 grid overflow-hidden surface-card md:grid-cols-2 md:divide-x md:divide-line">
          {parts.map((p) => (
            <div key={p.word} className="border-b border-line p-6 last:border-b-0 md:border-b-0">
              <p className="card-stat text-ink">{p.word}</p>
              <p className="mt-3 card-desc text-ink-muted">{p.note}</p>
            </div>
          ))}
        </FadeUp>

        <FadeUp className="mt-6 surface-card p-6 text-center">
          <p className="mx-auto max-w-3xl md-body-large text-ink-muted">
            The thread through an innovation ecosystem. We started in Basel's life-sciences ecosystem and already include data from several Swiss cantons. Our origin is local; our vision is international.
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {tags.map(({ label, Icon }) => (
              <li key={label} className="inline-flex h-8 items-center gap-2 rounded-chip bg-section px-3.5 text-[12px] leading-none text-ink">
                <Icon className="size-3.5 text-link" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
