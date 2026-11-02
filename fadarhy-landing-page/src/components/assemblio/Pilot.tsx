import { ArrowUpRight } from "lucide-react";
import { FadeUp } from "@/components/Reveal";

const facts = [
  { label: "Length", value: "6 weeks", note: "Active testing sprint" },
  { label: "Cohort intake", value: "Up to 25", note: "Guaranteed high-touch support" },
  { label: "For founders", value: "Free", note: "Zero platform fees" },
];

const pipeline = [
  ["01", "need", "Founder intent"],
  ["02", "route", "Swiss node match"],
  ["03", "referral", "Contextual intro"],
  ["04", "meeting", "Ecosystem partner"],
  ["05", "milestone", "Verified proof"],
  ["06", "outcome", "Ecosystem KPI"],
];

const gets = [
  "Fewer repeat questions for your team",
  "Referrals with context, so introductions start further along",
  "A weekly summary of routes, referrals and milestones",
];

const mono = "text-[11px] uppercase tracking-tight text-ink-muted";

export function Pilot() {
  return (
    <section id="pilot" className="mx-auto max-w-[1240px] px-4 py-20 lg:px-10 lg:py-28">
      <FadeUp className="max-w-3xl px-1">
        <p className="text-[12px] font-medium uppercase tracking-tight text-link">For programmes · In pilot</p>
        <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">
          Route founders faster. See what happened next.
        </h2>
        <p className="mt-3 md-body-large text-ink-muted">
          We are opening a small number of pilots with ecosystem organisations. Your founders use FadäRhy for free. Your team sees, with founder consent, which routes led to real meetings and milestones.
        </p>
      </FadeUp>

      <FadeUp className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(({ label, value, note }) => (
          <div key={label} className="surface-card flex flex-col p-6">
            <div className="flex h-6 items-center"><p className="rounded-chip bg-section px-2.5 py-1 card-label tracking-[-0.04em]! text-ink-muted">{label}</p></div>
            <p className="mt-2 card-stat tracking-[-0.045em]! text-ink">{value}</p>
            <p className="mt-3 card-desc tracking-[-0.02em]! text-ink-muted">{note}</p>
          </div>
        ))}
        <div className="surface-card flex flex-col p-6">
          <div className="flex h-6 items-center justify-between gap-2">
            <p className="rounded-chip bg-section px-2.5 py-1 card-label tracking-[-0.04em]! text-ink-muted">You get</p>
            <span className="text-[10px] font-semibold uppercase tracking-tight text-link">Pilot exclusive</span>
          </div>
          <p className="mt-2 card-title tracking-[-0.035em]! text-ink">Founder Progress view</p>
          <p className="mt-3 card-desc tracking-[-0.02em]! text-ink-muted">· In pilot telemetry</p>
        </div>
      </FadeUp>

      <FadeUp className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <span className="mr-2 text-[12px] uppercase tracking-tight text-ink-muted">In pilot:</span>
          {pipeline.map(([, t], i) => (
            <span key={t} className="flex items-center gap-3">
              <span className={`rounded-chip px-3.5 py-2 text-[15px] font-medium ${i === pipeline.length - 1 ? "ring-1 ring-inset ring-rhine-blue text-link" : "bg-section text-ink"}`}>{t}</span>
              {i < pipeline.length - 1 && <span aria-hidden className="text-ink-muted">→</span>}
            </span>
          ))}
        </div>
        <p className="max-w-[280px] text-right md-body-large text-ink-muted">A consent-based Founder Progress view, not a sales CRM.</p>
      </FadeUp>

      <FadeUp className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className={mono}>What your team gets</p>
          <ul className="mt-4 space-y-3">
            {gets.map((text) => (
              <li key={text} className="surface-card flex items-center gap-4 p-4 card-desc tracking-[-0.02em]! text-ink">
                <span className="icon-tile"><ArrowUpRight aria-hidden /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pb-2">
          <div className="flex flex-wrap items-center gap-3">
            <a href="mailto:hallo@fadarhy.ch?subject=Pilot%20enquiry%20for%20Fad%C3%A4Rhy" className="inline-flex min-h-12 items-center btn-primary rounded-btn px-6 text-[16px] font-medium">Ask about a pilot</a>
            <a href="mailto:hallo@fadarhy.ch?subject=Question%20about%20Fad%C3%A4Rhy" className="inline-flex min-h-12 items-center gap-2 rounded-btn px-3 text-[16px] font-medium text-link hover:bg-rhine-blue-soft">Read the FAQ</a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-[12px] text-ink-muted">
            <span className="size-2 rounded-full bg-rhine-blue" aria-hidden /> Spring 2025 Cohort · 3 organization spots remaining
          </p>
        </div>
      </FadeUp>
    </section>
  );
}
