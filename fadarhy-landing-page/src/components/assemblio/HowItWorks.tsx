import { useState } from "react";
import { Check, ChevronDown, Pencil } from "lucide-react";

const steps = [
  { n: "01", title: "Describe your situation", tag: "Describe", body: "Type or speak a few sentences about your team, your stage and what you need, in English, Deutsch, Français or Baseldütsch." },
  { n: "02", title: "Check what we understood", tag: "Check", body: "FadäRhy turns your words into a short profile. Fix anything it got wrong before it starts matching." },
  { n: "03", title: "Get matched, with reasons", tag: "Match", body: "See ranked labs, funders, partners and experts across Basel and the Upper Rhine. Each one says why it fits and where that comes from." },
  { n: "04", title: "Act on a 12-month plan", tag: "Act", body: "Your matches become a step-by-step plan, with intro emails drafted for you to review and send." },
];

const langs = ["Auto", "English", "Deutsch", "Français"];

const btnPrimary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-rhine-blue text-[14px] font-medium text-on-rhine-blue hover:brightness-[0.93]";
const itemCard = "flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-3";

function PhoneBody({ step }: { step: number }) {
  const [lang, setLang] = useState("English");
  if (step === 1) {
    const rows = [["Team", "4 people"], ["Stage", "Working prototype"], ["Field", "Medical devices"], ["Based in", "Basel"], ["Needs", "Lab bench · funding"]];
    return (
      <div className="flex flex-1 flex-col">
        <p className="mb-3 text-[14px] font-semibold text-ink">Here's what we understood</p>
        <div className="space-y-2 pb-5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
              <div>
                <p className="font-mono text-[10px] uppercase text-ink-muted">{k}</p>
                <p className="text-[14px] font-semibold text-ink">{v}</p>
              </div>
              <button type="button" aria-label={`Edit ${k}`} className="grid size-11 place-items-center rounded-full text-ink-muted hover:bg-background">
                <Pencil className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnPrimary} mt-auto w-full`}>Looks right, find matches</button>
      </div>
    );
  }
  if (step === 2) {
    const m = [
      ["SuperLab Suisse", "Rents benches to early teams, so you can move in without building a lab.", "directory entry"],
      ["Innosuisse Innovation Project", "Non-dilutive federal funding for projects with a research partner.", "innosuisse.admin.ch"],
      ["BaseLaunch", "Supports early life-sciences ventures in the Basel region.", "directory entry"],
    ];
    return (
      <div>
        <p className="mb-3 text-[14px] font-semibold text-ink">Your top matches</p>
        <div className="space-y-2.5">
          {m.map(([n, w, s], i) => (
            <div key={n} className={itemCard}>
              <p className="text-[14px] font-semibold text-ink"><span className="mr-2 font-mono text-[11px] font-medium text-ink-muted">#{i + 1}</span>{n}</p>
              <p className="text-[12px] text-ink-muted"><b className="font-semibold">Why:</b> {w}</p>
              <p className="text-[11px] text-link underline">Source: {s}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="text-left">
        <p className="mb-3 text-[14px] font-semibold text-ink">Your next 12 months</p>

        <div className="space-y-2.5">
          {[
            ["Month 1", "Visit bench options and choose a lab", "In progress", "Schedule visits"],
            ["Month 2–3", "Find a research partner", "Upcoming", "Matched (3)"],
            ["Month 3–5", "Draft the Innosuisse application", "Grant phase", "Templates ready"],
            ["Month 6+", "Apply to the accelerator cohort", "Cohort application", "Winter cycle"],
          ].map(([m, t, st, note]) => (
            <div key={m} className={itemCard}>
              <p className="text-[12.5px] font-semibold text-ink"><span className="mr-2 font-mono text-[9px] font-medium text-ink-muted">{m}</span>{t}</p>
              <p className="text-[10px] text-ink-muted"><b className="font-semibold">Status:</b> {st}</p>
              <p className="text-[9px] text-link underline">{note}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[14px] bg-surface">
      <div className="flex min-h-[180px] flex-1 flex-col gap-3 px-[18px] pb-7 pt-[18px]">
        <p className="text-[13px] font-medium text-ink-muted">Your situation and needs</p>
        <p className="text-[18px] leading-[1.5] text-ink">“We're a four-person medtech team in Basel with a working prototype. We need access to a lab and our first non-dilutive funding.”</p>
      </div>
      <div className="flex flex-col gap-3 border-t border-line bg-surface p-3">
        <div role="group" aria-label="Answer language" className="flex w-fit flex-wrap gap-0.5 rounded-xl bg-background p-1">
          {langs.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
              className={`inline-flex min-h-9 items-center gap-1 rounded-[9px] px-3 text-[13px] ${lang === l ? "bg-rhine-blue-soft font-semibold text-link" : "font-medium text-ink-muted"}`}>
              {lang === l && <Check className="size-3.5" aria-hidden />}
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-[18px] text-[14px] font-medium text-ink">
            Speak
          </button>
          <button type="button" className={`${btnPrimary} h-12 px-[22px]`}>Find my path</button>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [open, setOpen] = useState(0);
  const cur = open === -1 ? 0 : open;
  return (
    <section id="how-it-works" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-4 lg:px-10">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">How it works</p>
        <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink lg:text-[34px]">How FadäRhy works</h2>
        <p className="mt-3 max-w-3xl text-[16px] text-ink-muted">From a few sentences about your team to the right labs, funders and people in Basel.</p>

        <div className="mt-10 flex flex-wrap items-start gap-10 lg:flex-nowrap lg:gap-14">
          <div className="w-full lg:w-[46%]">
            <div className="flex min-h-[520px] w-full flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-surface p-8">
              <div className="flex items-center justify-between border-b border-line pb-5">
                <span className="text-[18px] font-semibold text-ink">FadäRhy</span>
                <span className="rounded-full bg-background px-2.5 py-1 font-mono text-[11px] font-medium text-link">{steps[cur].tag}</span>
              </div>
              <div aria-live="polite" className={`flex flex-1 flex-col ${cur === 0 ? "" : "rounded-[14px] bg-surface p-4"}`}>
                <PhoneBody step={cur} />
              </div>
            </div>
          </div>

          <div className="w-full flex-1">
            <div className="border-t border-line">
              {steps.map((s, i) => {
                const isOpen = open === i;
                return (
                  <div key={s.n} className="border-b border-line">
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex min-h-[44px] w-full items-center gap-4 py-6 text-left">
                      <span className={`grid h-8 w-10 place-items-center rounded-md font-mono text-[12px] font-medium ${isOpen ? "bg-background text-link" : "text-ink-muted"}`}>{s.n}</span>
                      <span className="flex-1 text-ink text-[22px] font-semibold tracking-[-0.01em] sm:text-[26px]">{s.title}</span>
                      <ChevronDown className={`size-5 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <p className="pb-6 pl-14 text-[17px] leading-relaxed text-ink-muted">{s.body}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href="mailto:hallo@fadarhy.ch?subject=Early%20access%20to%20Fad%C3%A4Rhy" className="inline-flex min-h-12 items-center rounded-[10px] border border-line-strong px-6 text-[15px] font-medium text-ink hover:border-ink">
                Get early access
              </a>
              <span className="flex items-center gap-2.5 text-[14px] text-ink-muted"><span className="size-2 rounded-full bg-rhine-blue" aria-hidden /> Real routing logic configured in &lt;180ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
