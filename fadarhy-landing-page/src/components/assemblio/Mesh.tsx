import { useEffect, useRef, useState } from "react";
import { Zap, Users, FlaskConical, Building2, GraduationCap, BarChart3, FileText } from "lucide-react";

const nodes = [
  { left: 165, top: 4, title: "Regulatory experts", sub: "Swissmedic / CE …", Icon: Users },
  { left: 10, top: 59, title: "Lab spaces", sub: "BSL-1 / BSL-2 sh…", Icon: FlaskConical },
  { left: 320, top: 59, title: "Pharma partners", sub: "Novartis / Roche…", Icon: Building2 },
  { left: 0, top: 224, title: "Universities", sub: "Uni Basel • ETH …", Icon: GraduationCap },
  { left: 330, top: 224, title: "Investors", sub: "Seed • Series A …", Icon: BarChart3 },
  { left: 45, top: 349, title: "Accelerators", sub: "BaseLaunch • …", Icon: Zap },
  { left: 285, top: 349, title: "Funding programmes", sub: "Innosuisse & gra…", Icon: FileText },
];

const stats = [
  { n: "800+", t: "life-sciences companies in the Basel Area" },
  { n: "33,000", t: "skilled people in its life-sciences talent pool" },
  { n: "3", t: "countries meeting at one river" },
];

function CountUp({ value }: { value: string }) {
  const target = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[\d,]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);
  return <div ref={ref} aria-label={value} className="text-[32px] font-semibold leading-none tracking-[-0.02em] text-link [font-variant-numeric:tabular-nums] sm:text-[38px]">{n.toLocaleString("en-US")}{suffix}</div>;
}

export function MeshCard() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / 480)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
        <div ref={box} className="w-full overflow-hidden" style={{ height: 400 * scale }}>
          <div className="relative h-[400px] w-[480px] shrink-0 origin-top-left" style={{ transform: `scale(${scale})`, marginLeft: `calc((100% - ${480 * scale}px) / 2)` }} role="img" aria-label="FadäRhy core router connected to seven clusters">
            <svg aria-hidden className="absolute inset-0" width="480" height="400" fill="none">
              <circle cx="240" cy="230" r="60" className="stroke-line" strokeDasharray="2 3" />
              <circle cx="240" cy="230" r="145" className="stroke-line" strokeDasharray="2 3" />
              <circle cx="240" cy="230" r="195" className="stroke-line" strokeDasharray="2 3" />
              {[[240, 28], [85, 83], [395, 83], [75, 248], [405, 248], [120, 372], [360, 372]].map(([x, y]) => (
                <line key={`${x}-${y}`} x1="240" y1="230" x2={x} y2={y} className="stroke-line-strong/40" strokeWidth="1.5" strokeDasharray="4 3" />
              ))}
            </svg>

            <div className="absolute left-[180px] top-[150px] z-10 flex h-[110px] w-[120px] flex-col items-center justify-center rounded-xl border-[1.5px] border-rhine-blue bg-surface shadow-lg">
              <Zap className="size-5 text-link" aria-hidden />
              <span className="mt-1.5 text-[15px] font-semibold text-ink">FadäRhy</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">Core router</span>
              <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] font-medium text-link">
                <span className="size-1.5 rounded-full bg-rhine-blue" /> Active
              </span>
            </div>

            {nodes.map(({ left, top, title, sub, Icon }) => (
              <div key={title} style={{ left, top }} className="absolute z-10 flex h-[46px] w-[150px] items-center gap-2 rounded-xl border border-line bg-surface px-2.5 shadow-sm">
                <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold leading-tight text-ink">{title}</p>
                  <p className="truncate font-mono text-[9.5px] leading-tight text-ink-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
}

export function StatsCard() {
  return (
        <div>
          <div className="border-t border-line">
            {stats.map((s) => (
              <div key={s.n} className="border-b border-line py-4">
                <CountUp value={s.n} />
                <p className="mt-2 text-[16px] text-ink-muted">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
  );
}
