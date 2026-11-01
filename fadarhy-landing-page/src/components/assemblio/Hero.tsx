import networkGraph from "@/assets/network-graph-blue.webp";
import networkGraphDark from "@/assets/network-graph-dark.webp";
import { CloudUpload, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";

const steps = ["Describe where you are", "Match programmes", "Meet the right people", "Find labs", "Check funding", "Source-linked route", "Clear next step"];
const logos = [
  { n: "BASEL-FIRST", c: "text-[22px] font-bold tracking-tight" },
  { n: "SWISS-WIDE", c: "text-[22px] font-bold tracking-tight" },
  { n: "LIVE BETA", c: "text-[22px] font-bold tracking-tight" },
  { n: "FREE FOR FOUNDERS", c: "text-[18px] font-bold tracking-tight" },
];

function Machine() {
  return (
    <div className="h-full w-full overflow-hidden">
      <img src={networkGraph} alt="" aria-hidden className="h-full w-full -translate-x-[4%] -translate-y-[14%] object-contain mix-blend-multiply dark:hidden" />
      <img src={networkGraphDark} alt="" aria-hidden className="hidden h-full w-full object-contain mix-blend-lighten dark:block" />
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-surface pb-16">
      <div className="mx-auto max-w-[1240px] px-4 pt-16 text-center sm:pt-20 lg:px-10">
        <p className="mb-6 font-mono text-[12px] uppercase tracking-wider text-muted-foreground">The ecosystem navigator · Basel-first, Swiss-wide</p>
        <h1 className="mx-auto max-w-[760px] text-[clamp(34px,5.5vw,60px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          Find your next right connection.
        </h1>
        <p className="mx-auto mt-8 max-w-[680px] text-[17px] leading-relaxed text-ink-muted">
          FadäRhy helps life-sciences founders navigate a fragmented ecosystem and find their next right connection. We turn founder needs into source-linked routes to the right people, programmes, labs, funding and resources with a clear next step. At the same time, we help programmes connect founders to relevant opportunities, track what happens next and measure the outcomes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="https://app.fadarhy.ch/" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground">Try FadäRhy</a>
          <a href="mailto:hallo@fadarhy.ch?subject=Run%20a%20pilot%20with%20Fad%C3%A4Rhy" className="rounded-lg border border-line-strong px-5 py-3 text-[14px] font-medium text-ink">Run a pilot with us</a>
          <a href="mailto:hallo@fadarhy.ch?subject=Joining%20Fad%C3%A4Rhy%20as%20a%20founder" className="px-2 text-[14px] font-medium text-link underline underline-offset-4">Join as a founder</a>
        </div>

        {/* product mockup */}
        <div className="relative mx-auto mt-12 grid max-w-[1100px] items-center gap-6 lg:grid-cols-[230px_1fr_150px]">
          <div className="hidden lg:flex flex-col items-center">
            <div className="relative h-[170px] w-full rounded-2xl border border-dashed border-border bg-secondary/60 shadow-sm">
              <CloudUpload className="absolute left-1/2 top-8 size-7 -translate-x-1/2 text-ink-muted" />
              <div className="absolute bottom-[-18px] left-1/2 grid size-[70px] -translate-x-1/3 rotate-[-25deg] place-items-center rounded-xl border-2 border-line-strong bg-surface px-1 text-center text-[11px] font-bold leading-tight shadow-md">Needs profile</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-t-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[10px] text-muted-foreground">app.fadarhy.ch · Your route</span>
              <span className="rounded bg-primary px-2 py-0.5 text-[9px] text-primary-foreground">Founders</span>
            </div>
            <div className="grid h-[250px] grid-cols-[34%_1fr] sm:h-[270px] sm:grid-cols-[22%_1fr_28%]">
              <div className="hidden space-y-1.5 border-r border-border p-2.5 text-left sm:block">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-muted" style={{ width: `${90 - (i % 4) * 14}%`, marginLeft: (i % 3) * 6 }} />
                ))}
              </div>
              <div className="p-2"><Machine /></div>
              <div className="space-y-2 border-l border-border p-2.5 text-left">
                <div className="text-[9px] font-medium">Steps</div>
                {steps.map((s) => (
                  <div key={s} className="truncate rounded bg-secondary px-1.5 py-1 text-[8px] text-ink-muted">{s}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center gap-3 text-primary">
            <ArrowUpRight className="size-6" />
            <div className="relative h-[110px] w-[90px] rounded-md border border-line bg-surface p-2 shadow-md">
              <div className="h-12 rounded-sm border border-border bg-secondary"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden className="mx-auto mt-3 size-6 text-ink-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg></div>
              <div className="mt-2 space-y-1">{[0, 1, 2].map((i) => <div key={i} className="h-1 rounded bg-muted" />)}</div>
              <FileText className="absolute -right-2 -top-2 size-4 text-ink-muted" />
            </div>
            <ArrowDownRight className="size-6" />
            <div className="h-[70px] w-[110px] rounded-md border-[3px] border-line-strong bg-surface p-1.5 shadow-md">
              <div className="h-full rounded-sm bg-secondary" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-[1100px] grid-cols-2 items-center gap-y-8 text-ink-muted sm:grid-cols-4">
          {logos.map((l) => (
            <span key={l.n} className={l.c}>{l.n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
