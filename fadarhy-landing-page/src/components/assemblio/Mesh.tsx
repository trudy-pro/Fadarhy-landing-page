import { useEffect, useRef, useState } from "react";
import { Zap, Users, FlaskConical, Building2, GraduationCap, BarChart3, FileText, Rocket, MessageSquare } from "lucide-react";

// Virtual canvas; scaled down to fit narrow containers.
const W = 560;
const H = 420;
const NODE_W = 140;
const NODE_H = 44;
const HUB = { x: 214, y: 164, w: 132, h: 92 };
const REQ = { x: 0, y: 182, w: 150, h: 56 };

// Scattered on purpose: the ecosystem should read as fragmented.
const nodes = [
  { x: 40, y: 30, title: "Universities", sub: "Uni Basel · ETH D-BSSE", Icon: GraduationCap },
  { x: 220, y: 8, title: "Regulatory experts", sub: "Swissmedic · CE / MDR", Icon: Users },
  { x: 400, y: 40, title: "Pharma partners", sub: "Novartis · Roche", Icon: Building2 },
  { x: 410, y: 190, title: "Labs", sub: "BSL-1 / BSL-2 benches", Icon: FlaskConical, target: true },
  { x: 420, y: 330, title: "Investors", sub: "Seed · Series A", Icon: BarChart3 },
  { x: 230, y: 360, title: "Funding programmes", sub: "Innosuisse · grants", Icon: FileText },
  { x: 40, y: 340, title: "Accelerators", sub: "BaseLaunch · cohorts", Icon: Rocket },
];

// Loose ties between some nodes, never a full picture.
const ties = [[0, 1], [2, 4], [5, 6]];

const mid = (n: { x: number; y: number }) => [n.x + NODE_W / 2, n.y + NODE_H / 2];
const hubC = [HUB.x + HUB.w / 2, HUB.y + HUB.h / 2];

const stats = [
  { n: "800+", t: "life-sciences companies" },
  { n: "33,000", t: "skilled professionals" },
  { n: "3 countries", t: "connected in one regional ecosystem" },
];

function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const target = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/^[\d,]+/, "");
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
  return <div ref={ref} aria-label={value} className={`card-stat text-link ${className}`}>{n.toLocaleString("en-US")}{suffix}</div>;
}

export function MeshCard() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1.15, e.contentRect.width / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const target = nodes.find((n) => n.target)!;
  return (
        <div ref={box} className="w-full overflow-hidden" style={{ height: H * scale }}>
          <div className="relative shrink-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})`, marginLeft: `calc((100% - ${W * scale}px) / 2)` }} role="img" aria-label="Seven scattered parts of the Basel ecosystem. A founder request goes through FadäRhy, which routes it to the right next step: a lab.">
            <svg aria-hidden className="absolute inset-0" width={W} height={H} fill="none">
              <defs>
                <marker id="mesh-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0 0 8 4 0 8z" className="fill-rhine-blue" />
                </marker>
              </defs>
              {ties.map(([a, b]) => {
                const [x1, y1] = mid(nodes[a]);
                const [x2, y2] = mid(nodes[b]);
                return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-line-strong/25" strokeWidth="1" strokeDasharray="2 4" />;
              })}
              {nodes.filter((n) => !n.target).map((n) => {
                const [x, y] = mid(n);
                return <line key={n.title} x1={hubC[0]} y1={hubC[1]} x2={x} y2={y} className="stroke-line-strong/30" strokeWidth="1" strokeDasharray="3 4" />;
              })}
              <line x1={REQ.x + REQ.w} y1={hubC[1]} x2={HUB.x - 4} y2={hubC[1]} className="stroke-rhine-blue" strokeWidth="2" markerEnd="url(#mesh-arrow)" />
              <line x1={HUB.x + HUB.w} y1={hubC[1]} x2={target.x - 4} y2={target.y + NODE_H / 2} className="stroke-rhine-blue" strokeWidth="2" markerEnd="url(#mesh-arrow)" />
            </svg>

            <div style={{ left: REQ.x, top: REQ.y, width: REQ.w, height: REQ.h }} className="absolute z-10 flex flex-col justify-center rounded-[10px] border border-dashed border-rhine-blue/60 bg-card px-3">
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase leading-[14px] tracking-tight text-link"><MessageSquare className="size-3" aria-hidden /> Request</span>
              <span className="mt-1 whitespace-nowrap text-[12px] font-semibold leading-[16px] text-ink">“We need a lab bench”</span>
            </div>

            <div style={{ left: HUB.x, top: HUB.y, width: HUB.w, height: HUB.h }} className="absolute z-10 flex flex-col items-center justify-center rounded-[12px] border border-rhine-blue! bg-secondary text-link shadow-lg">
              <Zap className="size-5" aria-hidden />
              <span className="mt-1.5 text-[15px] font-semibold">FadäRhy</span>
              <span className="text-[9px] uppercase tracking-tight opacity-80">Routing layer</span>
            </div>

            {nodes.map(({ x, y, title, sub, Icon, target: isTarget }) => (
              <div key={title} style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
                className={`absolute z-10 flex items-center gap-2 rounded-[10px] border bg-card px-2.5 ${isTarget ? "border-rhine-blue shadow-md ring-4 ring-rhine-blue-soft" : "border-line"}`}>
                <Icon className={`size-4 shrink-0 ${isTarget ? "text-link" : "text-ink-muted"}`} aria-hidden />
                <div className="min-w-0">
                  <p className={`truncate text-[12px] font-semibold leading-tight ${isTarget ? "text-ink" : "text-ink-muted"}`}>{title}</p>
                  <p className="truncate text-[9.5px] leading-tight text-ink-muted">{sub}</p>
                </div>
              </div>
            ))}
            <span style={{ left: target.x, top: target.y + NODE_H + 8 }} className="absolute text-[10px] font-medium uppercase tracking-tight text-link">Right next step</span>
          </div>
        </div>
  );
}

export function StatsCard() {
  return (
        <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.n} className="py-4 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
              <CountUp value={s.n} />
              <p className="mt-3 card-desc text-ink-muted">{s.t}</p>
            </div>
          ))}
        </div>
  );
}
