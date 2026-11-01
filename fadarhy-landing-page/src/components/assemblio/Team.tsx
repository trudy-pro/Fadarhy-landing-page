import { ArrowRight } from "lucide-react";
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
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">Team</p>
          <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink lg:text-[34px]">The people behind the thread</h2>
          <a href="#name" className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-link underline underline-offset-4">
            Meet the Team
          </a>
        </FadeUp>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {team.map((m, i) => (
            <FadeUp key={m.name} delay={i * 60} className="flex">
              <article className="flex w-full flex-col justify-between rounded-2xl bg-surface p-6">
                <div>
                  <div className="grid size-12 place-items-center rounded-xl bg-background text-[18px] font-semibold text-ink">{m.name[0]}</div>
                  <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.02em] text-ink">{m.name}</h3>
                  <p className="mt-2 min-h-[40px] font-mono text-[12px] leading-relaxed text-ink-muted">{m.role}</p>
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
