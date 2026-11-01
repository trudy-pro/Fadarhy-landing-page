import { useEffect, useRef, useState } from "react";
import { Coins, FlaskConical, Lightbulb, MapPin, TrendingUp, Check, Mail, Search, Loader, CalendarCheck } from "lucide-react";

type Need = {
  label: string;
  icon: typeof Coins;
  desc: string;
  lang: string;
  story: string;
  profile: string[][];
  match: string;
  type: string;
  why: string;
  source: string;
  plan: string[][];
};

const needs: Need[] = [
  { label: "Lab space", icon: FlaskConical, desc: "Describe your team and the equipment you need. FadäRhy finds benches and facilities that fit, says why, and plans your move-in.", lang: "English",
    story: "We're a four-person medtech team with a working prototype. We need lab space in Basel.",
    profile: [["Team", "4 people"], ["Stage", "Prototype"], ["Need", "Lab bench"]], match: "SuperLab Suisse", type: "Lab space",
    why: "Rents benches to early teams, so you can start without building a lab.", source: "directory entry",
    plan: [["Visit bench options", "Month 1"], ["Sign and move in", "Month 2"]] },
  { label: "Funding", icon: Coins, desc: "Tell FadäRhy where you are and what you need money for. It matches you to grants and programmes and turns them into a plan with intros drafted.", lang: "English",
    story: "We're a four-person medtech team in Basel with a working prototype. We need our first non-dilutive funding.",
    profile: [["Team", "4 people"], ["Stage", "Prototype"], ["Need", "Non-dilutive funding"]], match: "Innosuisse Innovation Project", type: "Funding programme",
    why: "Non-dilutive federal funding for projects run with a research partner.", source: "innosuisse.admin.ch",
    plan: [["Find a research partner", "Month 1–2"], ["Draft the application", "Month 3–5"]] },
  { label: "Spin-off", icon: Lightbulb, desc: "Researchers turning results into a company get matched to tech transfer, coaching and first funding, in the order they need them.", lang: "Français",
    story: "Je suis chercheuse à l'Université de Bâle et je veux créer une spin-off autour de nos résultats.",
    profile: [["Team", "Researcher"], ["Stage", "Pre-company"], ["Need", "IP and licensing"]], match: "Unitectra", type: "Tech transfer",
    why: "Handles IP and licensing for University of Basel research.", source: "directory entry",
    plan: [["Disclose the invention", "Month 1"], ["Agree licence terms", "Month 2–4"]] },
  { label: "Moving to Basel", icon: MapPin, desc: "Relocating from abroad? FadäRhy connects you to the people who help companies settle in, plus lab sites and local partners.", lang: "Deutsch",
    story: "Wir sind ein Biotech-Startup aus München und ziehen nach Basel. Wir suchen Laborflächen.",
    profile: [["Coming from", "Munich"], ["Field", "Biotech"], ["Need", "Setup and lab space"]], match: "Basel Area Business & Innovation", type: "Settling in",
    why: "Helps companies relocating to the region with setup and contacts.", source: "directory entry",
    plan: [["Register the company", "Month 1"], ["Tour lab sites", "Month 1–3"]] },
  { label: "Investors", icon: TrendingUp, desc: "Preparing to raise? Get matched to investors who know your field and stage, each with a reason and a source, and intros ready to review.", lang: "English",
    story: "We're a growing biotech preparing for Series A and need investors who know our field.",
    profile: [["Team", "12 people"], ["Stage", "Before Series A"], ["Need", "Investors"]], match: "Life-sciences venture fund", type: "Investor",
    why: "Invests in biotech teams at the stage before a Series A.", source: "directory entry",
    plan: [["Prepare the data room", "Month 1"], ["Investor introductions", "Month 2–4"]] },
];

const card = "absolute rounded-[28px] border-2 border-line bg-surface";
const pill = "absolute flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-ink-muted shadow-sm";
const tile = "grid size-10 shrink-0 place-items-center rounded-lg bg-background text-ink";

function Flow({ n }: { n: Need }) {
  return (
    <div className="relative h-[760px] w-[960px]">
      <svg aria-hidden className="absolute inset-0" width="960" height="760" fill="none">
        <path d="M350 120H265Q250 120 250 135V290" className="stroke-line" strokeWidth="2" />
        <path d="M380 400H580" className="stroke-line" strokeWidth="2" />
        <path d="M920 390H940Q955 390 955 405V595Q955 610 940 610H720" className="stroke-rhine-blue" strokeWidth="2" />
      </svg>

      <div className={`${card} left-[350px] top-[20px] w-[320px] p-6`}>
        <div className="flex items-center gap-3">
          <span className={tile}><Mail className="size-4" aria-hidden /></span>
          <div>
            <p className="text-[17px] font-semibold leading-tight">Your story</p>
            <p className="text-[13px] text-ink-muted">Written in {n.lang}</p>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-background p-3 text-[14px] leading-snug">“{n.story}”</p>
      </div>
      <div className={`${pill} left-[180px] top-[170px]`}><Search className="size-3.5" aria-hidden />Understanding…</div>

      <div className={`${card} left-[40px] top-[290px] w-[340px] p-6`}>
        <div className="mb-3 flex items-center gap-3">
          <span className={tile}><Check className="size-4" aria-hidden /></span>
          <p className="text-[17px] font-semibold">Your profile</p>
        </div>
        {n.profile.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-t border-line py-2 text-[13px]">
            <span className="text-ink-muted">{k}</span><span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className={`${pill} left-[425px] top-[378px]`}><Loader className="size-3.5" aria-hidden />Matching…</div>

      <div className={`${card} left-[580px] top-[300px] w-[340px] p-6`}>
        <div className="flex items-center gap-3">
          <span className={`${tile} font-mono text-[12px] font-medium`}>#1</span>
          <div>
            <p className="text-[16px] font-semibold leading-tight">{n.match}</p>
            <p className="text-[12px] text-ink-muted">{n.type}</p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-snug text-ink-muted"><b className="font-medium text-ink">Why:</b> {n.why}</p>
        <p className="mt-2 text-[12px] text-link">Source: {n.source}</p>
      </div>
      <div className={`${pill} left-[775px] top-[590px]`}><CalendarCheck className="size-3.5" aria-hidden />Planning…</div>

      <div className={`${card} left-[360px] top-[500px] w-[360px] p-6`}>
        <div className="mb-2 flex items-center gap-3">
          <span className={tile}><CalendarCheck className="size-4" aria-hidden /></span>
          <p className="text-[17px] font-semibold">12-month plan</p>
        </div>
        {n.plan.map(([t, m]) => (
          <div key={t} className="flex justify-between border-t border-line py-2 text-[13px]">
            <span>{t}</span><span className="font-mono text-[11px] text-ink-muted">{m}</span>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-rhine-blue py-3 text-[13px] text-on-rhine-blue">
          <span className="grid size-5 place-items-center rounded-full bg-on-rhine-blue/20 text-on-rhine-blue"><Check className="size-3" aria-hidden /></span>
          3 intro emails drafted · Waiting for you
        </div>
      </div>
    </div>
  );
}

function FitFlow({ n }: { n: Need }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const maxH = Math.max(460, window.innerHeight - 260);
      setScale(Math.min(1, el.clientWidth / 960, maxH / 760));
      setReady(true);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div ref={ref} className="flex w-full justify-center" style={{ height: 760 * scale, opacity: ready ? 1 : 0 }}>
      <div style={{ width: 960 * scale, height: 760 * scale }}>
        <div style={{ width: 960, height: 760, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <Flow n={n} />
        </div>
      </div>
    </div>
  );
}

export function Finds() {
  const [active, setActive] = useState(1);
  const n = needs[active];
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % needs.length), 6000);
    return () => window.clearTimeout(t);
  }, [active]);
  return (
    <section id="finds" className="bg-background px-3 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 max-w-3xl px-1">
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-link">What it finds for you</p>
          <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink lg:text-[34px]">One continuous thread, whatever you need.</h2>
          <p className="mt-3 text-[16px] text-ink-muted">Pick a situation and follow it from your words to a plan.</p>
        </div>

        <div className="flex flex-wrap items-stretch gap-6 rounded-[28px] bg-surface p-4 sm:p-5 lg:flex-nowrap lg:gap-10 lg:p-5">
          <div className="flex w-full flex-col justify-center lg:w-[31%] lg:shrink-0 lg:py-4 lg:pl-5">
            <ul>
              {needs.map((x, i) => {
                const Icon = x.icon;
                const isActive = i === active;
                return (
                  <li key={x.label} className={isActive ? "" : "border-b border-line"}>
                    {isActive ? (
                      <div className="py-5">
                        <div className="flex items-center gap-4">
                          <span className="grid size-14 place-items-center rounded-2xl bg-rhine-blue text-on-rhine-blue"><Icon className="size-6" aria-hidden /></span>
                          <span className="text-[22px] font-medium">{x.label}</span>
                        </div>
                        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{x.desc}</p>
                        <div className="mt-6 h-[3px] rounded bg-line"><div key={active} className="need-progress h-full rounded bg-rhine-blue" /></div>
                      </div>
                    ) : (
                      <button type="button" aria-expanded={false} onClick={() => setActive(i)} className="flex w-full items-center gap-4 py-4 text-left">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background text-ink"><Icon className="size-5" aria-hidden /></span>
                        <span className="text-[18px] text-ink-muted">{x.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-[24px] bg-background p-3 sm:p-5">
            <FitFlow n={n} />
          </div>
        </div>
      </div>
    </section>
  );
}
