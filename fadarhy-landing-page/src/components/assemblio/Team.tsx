import { FadeUp } from "@/components/Reveal";

const team = [
  { name: "Alaa", role: "AI solutions architect" },
  { name: "Daria", role: "AI software engineer" },
  { name: "Gertrude", role: "Product designer and frontend developer" },
  { name: "Reazul", role: "Machine learning" },
  { name: "Leticia", role: "Data and analytics engineering" },
];

export function Team() {
  return (
    <section id="team" className="px-4 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-medium uppercase tracking-tight text-link">Team</p>
          <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">The people behind the thread</h2>
        </FadeUp>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {team.map((m, i) => (
            <FadeUp key={m.name} delay={i * 60} className="flex">
              <article className="surface-card flex w-full flex-col justify-between p-6">
                <div>
                  <div aria-hidden className="icon-tile text-[18px] font-semibold">{m.name[0]}</div>
                  <h3 className="mt-5 card-title text-ink">{m.name}</h3>
                  <p className="mt-2 card-desc text-ink-muted">{m.role}</p>
                </div>
                <div className="mt-8 border-t border-line pt-4">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className="text-[14px] font-medium text-link underline underline-offset-4">
                    LinkedIn
                  </a>
                </div>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
