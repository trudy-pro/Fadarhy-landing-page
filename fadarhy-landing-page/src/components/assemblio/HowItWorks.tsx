import { useState } from "react";
import { FadeUp } from "@/components/Reveal";
import { ArrowRight, Briefcase, ChevronDown, CircleDollarSign, Coins, ExternalLink, FlaskConical, MapPin, Mic, Pencil, Snowflake, Zap } from "lucide-react";

const steps = [
  { n: "01", title: "Describe your situation", tag: "Describe", body: "Type or speak a few sentences about your team, your stage and what you need, in English, Deutsch, Français or Baseldütsch." },
  { n: "02", title: "Check what we understood", tag: "Check", body: "FadäRhy turns your words into a short profile. Fix anything it got wrong before it starts matching." },
  { n: "03", title: "Get matched, with reasons", tag: "Match", body: "See ranked labs, funders, partners and experts across Basel and the Upper Rhine. Each one says why it fits and where that comes from." },
  { n: "04", title: "Act on a 12-month plan", tag: "Act", body: "Your matches become a step-by-step plan, with intro emails drafted for you to review and send." },
];

const langs = ["English", "Deutsch", "Français"];

const itemCard = "flex flex-col gap-2 rounded-xl border border-line bg-card p-4";
const panelTitle = "mb-4 md-title-medium text-ink";
// Same pill as the NameStory tags: grey chip, blue icon, 12px ink text.
const chip = "inline-flex min-h-8 items-center gap-2 rounded-chip bg-section px-3.5 py-1.5 text-[12px] leading-tight text-ink";
const ctaChip = "btn-primary rounded-btn px-3 py-1.5 md-label-medium font-normal!";
const matchChip = "inline-flex items-center rounded-full bg-[#EDFBF3] px-3 py-1 md-label-small font-normal! text-[#2F7A56] dark:bg-success-soft dark:text-success";

function PhoneBody({ step }: { step: number }) {
  const [lang, setLang] = useState("English");
  if (step === 1) {
    const rows: [string, React.ReactNode][] = [
      ["Team", "4 people"],
      ["Stage", "Working prototype"],
      ["Field", "Medical devices / MedTech"],
      ["Based in", <>Basel-Stadt <span className="ml-1 text-ink-muted">(Switzerland)</span></>],
      ["Needs", (
        <span className="mt-1 flex flex-wrap gap-2">
          <span className={chip}><FlaskConical className="size-3.5 text-link" aria-hidden />Lab bench</span>
          <span className={chip}><CircleDollarSign className="size-3.5 text-link" aria-hidden />Non-dilutive funding</span>
        </span>
      )],
    ];
    return (
      <div className="flex flex-1 flex-col">
        <p className={panelTitle}>Check what we understood</p>
        <div className="space-y-2.5 pb-5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3">
              <div>
                <p className="card-label font-normal! text-ink-muted">{k}</p>
                <div className="mt-1 md-title-small font-normal! text-ink">{v}</div>
              </div>
              <button type="button" aria-label={`Edit ${k}`} className="grid size-8 place-items-center rounded-btn text-ink-muted hover:bg-section">
                <Pencil className="size-4 text-ink-muted" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-auto flex gap-3 border-t border-line pt-5">
          <button type="button" disabled className="inline-flex min-h-12 flex-1 items-center justify-center btn-primary rounded-btn md-label-large">Looks right, find matches</button>
          <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-btn border border-line bg-card px-5 md-label-large text-ink hover:border-line-strong">Edit in raw text</button>
        </div>
      </div>
    );
  }
  if (step === 2) {
    const m = [
      { name: "SuperLab Suisse", kind: "Private Wet Lab & Bench Space", score: 98, why: "Rents benches to early teams, so you can move in without building a lab.", facts: [[MapPin, "Rosental Mitte location"], [Zap, "Immediate availability Q2"]], source: "directory entry", cta: "Schedule lab visit" },
      { name: "Innosuisse Innovation Project", kind: "Federal Non-Dilutive Grant", score: 94, why: "Non-dilutive federal funding for projects with a research partner.", facts: [[Coins, "Covers up to 50% project costs"]], source: "innosuisse.admin.ch", cta: "View grant criteria & templates" },
      { name: "BaseLaunch", kind: "Biotech & Medtech Accelerator", score: 91, why: "Supports early life-sciences ventures in the Basel region.", facts: [[Briefcase, "Up to CHF 500k financing"], [Snowflake, "Winter cohort open"]], source: "directory entry", cta: "Explore cohort terms" },
    ] as const;
    return (
      <div>
        <p className={panelTitle}>Your top matches</p>
        <div className="space-y-2.5">
          {m.map((x, i) => (
            <div key={x.name} className={`${itemCard} gap-2.5!`}>
              <div className="flex items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 md-title-small text-ink">
                  <span className="md-label-small font-normal! text-ink-muted tabular-nums">#{i + 1}</span>{x.name}
                  <span className="text-[12px] leading-tight text-link">{x.kind}</span>
                </p>
                <span className={`${matchChip} shrink-0 tabular-nums`}>{x.score}% Match</span>
              </div>
              <p className="md-label-medium font-normal! text-ink-muted"><span className="text-ink">Why:</span> {x.why}</p>
              <div className="flex flex-wrap gap-1.5">
                {x.facts.map(([Icon, f]) => (
                  <span key={f} className={chip}><Icon className="size-3.5 text-link" aria-hidden />{f}</span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
                <span className="inline-flex items-center gap-1 md-label-small font-normal! text-ink-muted">Source: {x.source}<ExternalLink className="size-3" aria-hidden /></span>
                <button type="button" disabled className={ctaChip}>{x.cta} →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="text-left">
        <p className={panelTitle}>Your next 12 months</p>

        <div className="space-y-2.5">
          {[
            ["Month 1", "Visit bench options and choose a lab", "In progress", "2 site visits pending (Rosental & Allschwil)", "Schedule visits"],
            ["Month 2–3", "Find a research partner", "Upcoming", "3 scientific matches ready", "Matched (3)"],
            ["Month 3–5", "Draft the Innosuisse application", "Grant phase", "1 accredited coaching voucher unlocked", "Templates ready"],
            ["Month 6+", "Apply to the accelerator cohort", "Cohort application", "DayOne / Basel Area Innovation", "Winter cycle"],
          ].map(([m, t, st, detail, cta], i) => (
            <div key={m} className={`${itemCard} ${i === 0 ? "bg-section!" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="card-label font-normal! text-ink-muted tabular-nums">{m}</p>
                  <p className="mt-1 md-title-small text-ink">{t}</p>
                </div>
                <span className="shrink-0 md-label-medium font-normal! text-link">{cta} →</span>
              </div>
              <p className="md-label-medium font-normal! text-ink-muted">Status: <span className="text-ink">{st}</span><span aria-hidden className="mx-2">·</span>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <p className="card-label font-normal! text-ink-muted">Your situation and needs</p>
        <p className="md-label-medium font-normal! text-ink-muted">Spoken or typed</p>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-card px-5 py-4">
        <p className="md-body-medium italic text-ink">“We're a four-person medtech team in Basel with a working prototype. We need access to a lab and our first non-dilutive funding.”</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <div role="group" aria-label="Answer language" className="flex w-fit flex-wrap gap-0.5 rounded-btn bg-section p-1">
          {langs.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
              className={`inline-flex min-h-9 items-center gap-1 rounded-lg px-3 md-label-large transition-colors ${lang === l ? "bg-card text-ink shadow-sm" : "font-normal! text-ink-muted hover:text-ink"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" aria-label="Speak" className="grid size-11 place-items-center rounded-btn border border-line bg-card text-ink hover:border-line-strong">
            <Mic className="size-5 text-link" strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" disabled className="btn-primary inline-flex h-11 items-center justify-center rounded-btn px-5 md-label-large">Find my path</button>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [open, setOpen] = useState(0);
  const cur = open === -1 ? 0 : open;
  return (
    <section id="how-it-works" className="bg-section py-24 lg:py-36">
      <div className="mx-auto max-w-[1240px] px-4 lg:px-10">
        <FadeUp className="max-w-3xl px-1">
          <p className="text-[12px] font-medium uppercase tracking-tight text-link">How it works</p>
          <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">
            How FadäRhy works
          </h2>
          <p className="mt-3 md-body-large text-ink-muted">From a few sentences about your team to the right labs, funders and people in Basel.</p>
        </FadeUp>

        <div className="mt-14 flex flex-wrap items-start gap-12 lg:mt-20 lg:flex-nowrap lg:gap-20">
          <FadeUp delay={80} className="w-full lg:w-[48%]">
            <div className="flex min-h-[540px] w-full flex-col overflow-hidden surface-card">
              <div className="flex items-center justify-between border-b border-line px-6 py-4 sm:px-7">
                <span className="flex items-center gap-2.5 md-title-medium text-ink">
                  <span className="size-2 rounded-full bg-rhine-blue" aria-hidden />
                  FadäRhy
                </span>
                {cur !== 0 && (
                  <span className={chip}>
                    {steps[cur].tag}
                  </span>
                )}
              </div>
              <div aria-live="polite" className="flex flex-1 flex-col p-6 sm:p-7">
                <PhoneBody step={cur} />
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={160} className="w-full flex-1 lg:pt-2">
            <ol>
              {steps.map((s, i) => {
                const isOpen = open === i;
                return (
                  <li key={s.n} className={`rounded-2xl transition-[background-color,box-shadow] duration-300 ${isOpen ? "shadow-step bg-card" : "border-b border-line last:border-b-0"}`}>
                    <button type="button" aria-expanded={isOpen} aria-controls={`step-${s.n}`} onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex min-h-[44px] w-full items-center gap-4 px-5 py-5 text-left">
                      <span className={`icon-tile md-label-large text-link tabular-nums transition-colors ${isOpen ? "" : "bg-transparent!"}`}>{s.n}</span>
                      <span className={`flex-1 md-title-large text-ink ${isOpen ? "font-semibold!" : ""}`}>{s.title}</span>
                      <ChevronDown className={`size-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-link" : "text-ink-muted"}`} aria-hidden />
                    </button>
                    <div id={`step-${s.n}`} data-open={isOpen} inert={!isOpen} className="step-panel">
                      <div>
                        <p className="pb-6 pl-[80px] pr-6 card-desc text-ink-muted">{s.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 px-5">
              <a href="mailto:hallo@fadarhy.ch?subject=Early%20access%20to%20Fad%C3%A4Rhy" className="btn-primary group inline-flex min-h-14 items-center gap-2 rounded-btn px-7 md-title-medium">
                Get early access
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
              <span className="flex items-center gap-2 md-label-medium font-normal! text-ink-muted"><span className="size-1.5 rounded-full bg-rhine-blue" aria-hidden /> Real routing logic configured in &lt;180ms</span>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
