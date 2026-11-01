import { useState } from "react";
import { FadeUp } from "@/components/Reveal";

const EMAIL = "hallo@fadarhy.ch";

export function JoinPilot() {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard?.writeText(EMAIL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="join" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1240px] items-start gap-12 px-4 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <FadeUp className="lg:col-span-7">
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">Early access</p>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink lg:text-[56px]">Join the pilot</h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-muted">
            Founders: tell us your stage and what you need. Programmes: tell us about your cohort.
          </p>

          <div className="mt-10 flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3">
            <div className="flex items-center gap-3 pl-1">
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-background font-mono text-[14px] font-medium text-ink">@</span>
              <a href={`mailto:${EMAIL}`} className="text-[16px] font-medium text-ink underline underline-offset-4 hover:text-link">{EMAIL}</a>
            </div>
            <button type="button" onClick={copy} aria-live="polite" className="min-h-9 rounded-lg bg-background px-3.5 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted hover:text-ink">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent("Pilot application — FadäRhy")}`}
            className="mt-6 inline-flex min-h-12 items-center rounded-[10px] bg-rhine-blue px-6 text-[15px] font-medium text-on-rhine-blue hover:brightness-[0.93]"
          >
            Write to us
          </a>
        </FadeUp>

        <FadeUp className="lg:col-span-5">
          <aside className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
            <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">Kurz auf Deutsch</p>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-ink-muted">
              <p>
                FadäRhy ist der Ökosystem-Navigator für Gründerinnen und Gründer. Sie beschreiben Ihre Situation in eigenen Worten und erhalten Wege mit Quellenangabe zu passenden Personen, Programmen, Fachwissen, Laboren und Finanzierung, mit einem klaren nächsten Schritt.
              </p>
              <p>
                Gestartet in Basel als Gesamtsieger des ersten Hack am Rhein 2026, mit Daten aus mehreren Schweizer Kantonen. Für Gründende während der Pilotphase kostenlos.
              </p>
            </div>
          </aside>
        </FadeUp>
      </div>
    </section>
  );
}
