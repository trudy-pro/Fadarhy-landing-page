// Themeable section library. Every component is variant-driven and reads
// the project's semantic tokens (background/foreground/primary/muted/...)
// so re-theming styles.css re-themes every section. Compose pages from
// these instead of hand-writing section markup; pass real content via
// props. Variant names match the design-direction vocabulary (l-band,
// v-glass, l-slim, ...) minus the prefixes.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, X, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/Reveal";

/* ── shared bits ─────────────────────────────────────────────────────── */

type Tone = "default" | "band" | "invert";
const toneCls: Record<Tone, string> = {
  default: "",
  band: "bg-secondary",
  invert: "bg-foreground text-background",
};

export function Section({
  tone = "default",
  className,
  children,
  id,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-16 md:py-[var(--section-pad)]", toneCls[tone], className)}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-10">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  center,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <FadeUp className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && (
        <div className="eyebrow mb-3 text-xs font-bold text-primary">{eyebrow}</div>
      )}
      <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-muted-foreground">{lead}</p>}
    </FadeUp>
  );
}

function useCountUp(target: number, durationMs = 1800) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / durationMs);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs]);
  return { ref, val };
}

/* ── Stats ───────────────────────────────────────────────────────────── */

export type Stat = { value: number; suffix?: string; label: string };

function StatNumber({ stat, className }: { stat: Stat; className?: string }) {
  const { ref, val } = useCountUp(stat.value);
  return (
    <span ref={ref} className={cn("font-serif text-4xl text-primary md:text-5xl", className)}>
      {val.toLocaleString()}
      {stat.suffix}
    </span>
  );
}

export function Stats({
  items,
  variant = "row",
}: {
  items: Stat[];
  variant?: "row" | "grid" | "band" | "cards" | "inline";
}) {
  // Null-guard (this and every array-driven section): a page that passes a
  // missing/misnamed prop renders WITHOUT the section instead of crashing
  // the whole route into the error boundary (incident 2026-06-12: generated
  // page passed stats= instead of items= -> blank "Something went wrong").
  if (!items?.length) return null;
  const cell = (s: Stat, i: number, extra?: string, numCls?: string) => (
    <FadeUp key={s.label} delay={i * 90} className={extra}>
      <StatNumber stat={s} className={numCls} />
      <p className={cn("mt-1.5 text-sm", variant === "band" ? "text-primary-foreground/75" : "text-muted-foreground")}>{s.label}</p>
    </FadeUp>
  );
  if (variant === "band")
    return (
      <div className="flex flex-wrap items-center justify-around gap-8 rounded-xl bg-primary px-10 py-9 text-primary-foreground">
        {items.map((s, i) => cell(s, i, undefined, "text-primary-foreground"))}
      </div>
    );
  if (variant === "grid")
    return (
      <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border md:grid-cols-4">
        {items.map((s, i) => cell(s, i, "border-[length:var(--frame-border-width)] border-border p-[var(--card-pad)]"))}
      </div>
    );
  if (variant === "cards")
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((s, i) => cell(s, i, "card-surface border-l-2 border-l-primary"))}
      </div>
    );
  if (variant === "inline")
    return (
      <div className="flex flex-wrap justify-center divide-x divide-border">
        {items.map((s, i) => cell(s, i, "px-9 text-center"))}
      </div>
    );
  return <div className="flex flex-wrap gap-x-14 gap-y-8">{items.map((s, i) => cell(s, i))}</div>;
}

/* ── Feature cards ───────────────────────────────────────────────────── */

export type Feature = { icon?: ReactNode; title: string; body: string };

export function Cards({
  items,
  variant = "default",
  columns = 3,
}: {
  items: Feature[];
  variant?: "default" | "bordered" | "flat" | "split" | "accent" | "glass" | "numbered" | "rows";
  columns?: 2 | 3 | 4;
}) {
  if (!items?.length) return null;
  const gridCls =
    variant === "rows"
      ? "grid max-w-3xl gap-4"
      : cn("grid gap-5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4");
  return (
    <div className={gridCls}>
      {items.map((f, i) => (
        <FadeUp
          key={f.title}
          delay={i * 80}
          className={cn(
            (variant === "default" || variant === "accent" || variant === "numbered" || variant === "split" || variant === "rows") && "card-surface",
            (variant === "bordered" || variant === "glass") && "rounded-[var(--radius)] border-border p-[var(--card-pad)]",
            variant === "glass" && "border-[length:var(--frame-border-width)] bg-primary/5",
            variant === "bordered" && "border-[length:calc(var(--frame-border-width)*1.5)]",
            variant === "accent" && "border-t-2 border-t-primary",
            variant === "flat" && "p-0",
            (variant === "split" || variant === "rows") && "grid grid-cols-[auto_1fr] gap-x-4",
          )}
        >
          {variant === "numbered" && (
            <div className="mb-3 font-serif text-sm text-primary">{String(i + 1).padStart(2, "0")}</div>
          )}
          {f.icon && (
            <div className={cn("text-primary [&>svg]:h-6 [&>svg]:w-6", variant === "split" || variant === "rows" ? "row-span-2 mt-0.5" : "mb-4")}>
              {f.icon}
            </div>
          )}
          <h3 className="font-serif text-lg">{f.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Steps ───────────────────────────────────────────────────────────── */

export function Steps({
  items,
  variant = "cards",
}: {
  items: { title: string; body: string }[];
  variant?: "cards" | "connected" | "vertical" | "chevrons" | "bignum";
}) {
  if (!items?.length) return null;
  if (variant === "vertical")
    return (
      <div className="max-w-xl">
        {items.map((s, i) => (
          <FadeUp key={s.title} delay={i * 90} className="relative border-l-2 border-border pb-9 pl-7 last:pb-0">
            <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
            <h3 className="font-serif text-lg">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </FadeUp>
        ))}
      </div>
    );
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", items.length >= 3 && "lg:grid-cols-3", variant === "connected" && "relative")}>
      {items.map((s, i) => (
        <FadeUp
          key={s.title}
          delay={i * 90}
          className={cn("relative", variant === "cards" && "card-surface", variant === "chevrons" && "pr-10")}
        >
          <div className={cn("mb-2 font-serif text-primary", variant === "bignum" ? "text-6xl opacity-20" : "text-2xl")}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <h3 className="font-serif text-lg">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          {variant === "chevrons" && i < items.length - 1 && (
            <ArrowRight className="absolute right-2 top-10 hidden h-5 w-5 text-primary lg:block" />
          )}
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Pricing ─────────────────────────────────────────────────────────── */

export type Plan = {
  name: string;
  price: string;
  period?: string;
  features?: string[];
  cta?: string;
  href?: string;
  featured?: boolean;
};

export function Pricing({
  plans,
  variant = "cards",
}: {
  plans: Plan[];
  variant?: "cards" | "rows" | "slim" | "duo" | "statement";
}) {
  if (!plans?.length) return null;
  if (variant === "statement") {
    const p = plans[0];
    return (
      <FadeUp className="mx-auto max-w-xl py-10 text-center">
        <div className="font-serif text-lg">{p.name}</div>
        <div className="my-6 font-serif text-7xl">
          {p.price}
          {p.period && <span className="text-2xl text-muted-foreground"> {p.period}</span>}
        </div>
        {p.features && (
          <ul className="mb-8 space-y-2 text-muted-foreground">
            {p.features.map((f) => (
              <li key={f} className="flex items-center justify-center gap-2.5 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        )}
        <a
          href={p.href ?? "#"}
          className={cn(
            "btn-shape inline-flex items-center justify-center gap-2 px-10 py-4 text-sm font-semibold transition hover:opacity-90",
            p.featured ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary",
          )}
        >
          {p.cta ?? "Get started"}
        </a>
      </FadeUp>
    );
  }
  if (variant === "slim")
    return (
      <div className="grid max-w-3xl grid-cols-[1fr_auto_clamp(140px,22%,200px)] items-center gap-x-7">
        {plans.map((p) => (
          <FadeUp key={p.name} className="col-span-3 grid grid-cols-subgrid items-center border-b border-border py-5">
            <div className="font-serif text-lg">{p.name}</div>
            <div className="font-serif text-2xl">{p.price}</div>
            <a href={p.href ?? "#"} className={cn("rounded-md px-5 py-2.5 text-center text-sm font-semibold transition", p.featured ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:border-primary")}>
              {p.cta ?? "Choose"}
            </a>
          </FadeUp>
        ))}
      </div>
    );
  const rowMode = variant === "rows";
  return (
    <div className={cn("grid gap-5", rowMode ? "max-w-4xl" : variant === "duo" ? "mx-auto max-w-3xl sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {plans.map((p, i) => (
        <FadeUp
          key={p.name}
          delay={i * 90}
          className={cn(
            "flex rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border p-[var(--card-pad)]",
            rowMode ? "grid grid-cols-[1fr_auto_auto] items-center gap-x-7 text-left" : "flex-col text-center",
            p.featured && "border-primary bg-primary/5",
          )}
        >
          <div>
            <div className="font-serif text-lg">{p.name}</div>
            {rowMode && p.features && (
              <p className="mt-1 text-sm text-muted-foreground">{p.features.join(" · ")}</p>
            )}
          </div>
          <div className={cn("font-serif", rowMode ? "text-3xl" : "my-4 text-4xl")}>
            {p.price}
            {p.period && <span className="text-sm text-muted-foreground"> {p.period}</span>}
          </div>
          {!rowMode && p.features && (
            <ul className="mb-6 space-y-2.5 text-left text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <a
            href={p.href ?? "#"}
            className={cn(
              "rounded-md px-6 py-3 text-center text-sm font-semibold transition",
              rowMode ? "" : "mt-auto w-full",
              p.featured ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:border-primary",
            )}
          >
            {p.cta ?? "Choose"}
          </a>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Imagery ─────────────────────────────────────────────────────────── */

export function Gallery({
  images,
  variant = "grid",
}: {
  images: { src: string; alt: string }[];
  variant?: "grid" | "rounded" | "framed" | "strip" | "feature" | "offset" | "asymmetric";
}) {
  if (variant === "asymmetric") {
    return (
      <div className="grid grid-cols-3 gap-3.5 auto-rows-[200px]">
        {images.map((im, i) => (
          <FadeUp
            key={im.src}
            delay={i * 60}
            className={cn(
              "overflow-hidden rounded-[var(--radius)]",
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            <img src={im.src} alt={im.alt} loading="lazy" className={cn("h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]", i === 0 && "aspect-auto h-full")} />
          </FadeUp>
        ))}
      </div>
    );
  }
  const imgCls = cn(
    "h-full w-full object-cover",
    variant === "rounded" && "rounded-2xl",
    variant === "framed" && "rounded-md border-[6px] border-card outline outline-1 outline-border",
    (variant === "grid" || variant === "strip" || variant === "feature" || variant === "offset") && "rounded-md",
  );
  return (
    <div
      className={cn(
        "grid gap-3.5",
        variant === "strip" ? "grid-cols-2 md:grid-cols-5" : variant === "feature" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4",
      )}
    >
      {images.map((im, i) => (
        <FadeUp
          key={im.src}
          delay={i * 60}
          className={cn(
            "overflow-hidden",
            variant === "feature" && i === 0 && "col-span-2 row-span-2",
            variant === "offset" && i % 2 === 1 && "translate-y-5",
          )}
        >
          <img src={im.src} alt={im.alt} loading="lazy" className={cn(imgCls, "aspect-[4/3] transition-transform duration-300 hover:scale-[1.03]", variant === "feature" && i === 0 && "aspect-auto h-full")} />
        </FadeUp>
      ))}
    </div>
  );
}

export function Masonry({ images, columns = 3 }: { images: { src: string; alt: string }[]; columns?: 2 | 3 | 4 }) {
  return (
    <div className={cn("gap-3.5 [&>*]:mb-3.5", columns === 2 ? "columns-2" : columns === 4 ? "columns-2 md:columns-4" : "columns-2 md:columns-3")}>
      {images.map((im) => (
        <img key={im.src} src={im.src} alt={im.alt} loading="lazy" className="w-full rounded-md transition-transform duration-300 hover:scale-[1.02]" />
      ))}
    </div>
  );
}

export function Zigzag({
  rows,
  variant = "default",
}: {
  rows: { title: string; body: string; img: { src: string; alt: string } }[];
  variant?: "default" | "boxed" | "line" | "numbered" | "tight";
}) {
  return (
    <div className={cn("grid", variant === "tight" ? "gap-8" : "gap-14")}>
      {rows.map((r, i) => (
        <FadeUp
          key={r.title}
          className={cn(
            "grid items-center gap-8 md:grid-cols-2 md:gap-12",
            variant === "boxed" && "rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-card p-8",
            variant === "line" && i < rows.length - 1 && "border-b border-border pb-12",
          )}
        >
          <div className={cn(i % 2 === 1 && "md:order-2")}>
            {variant === "numbered" && (
              <div className="mb-2 font-serif text-sm text-primary">{String(i + 1).padStart(2, "0")}</div>
            )}
            <h3 className="font-serif text-2xl">{r.title}</h3>
            <p className="mt-3 text-muted-foreground">{r.body}</p>
          </div>
          <img src={r.img.src} alt={r.img.alt} loading="lazy" className={cn("rounded-md object-cover", variant === "tight" ? "max-h-56 w-full" : "aspect-[4/3] w-full")} />
        </FadeUp>
      ))}
    </div>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */

export function FAQ({
  items,
  variant = "accordion",
}: {
  items: { q: string; a: string }[];
  variant?: "accordion" | "grid" | "bare" | "numbered" | "accent";
}) {
  if (!items?.length) return null;
  return (
    <div className={cn("grid gap-3", variant === "grid" ? "md:grid-cols-2 md:items-start" : "max-w-3xl")}>
      {items.map((f, i) => (
        <FadeUp key={f.q} delay={i * 60}>
          <details
            className={cn(
              "group rounded-[var(--radius)] px-5 py-4 transition",
              variant === "bare" ? "rounded-none border-b border-border px-1" : "border-[length:var(--frame-border-width)] border-border bg-card",
              variant === "accent" && "open:bg-primary/5 open:border-primary/40",
              "hover:border-primary/40",
            )}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif [&::-webkit-details-marker]:hidden">
              <span>
                {variant === "numbered" && <span className="mr-2 text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>}
                {f.q}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── People & social proof ───────────────────────────────────────────── */

export function Team({
  members,
  variant = "grid",
}: {
  members: { name: string; role: string; img?: { src: string; alt: string } }[];
  variant?: "grid" | "row" | "list" | "cards" | "square";
}) {
  if (variant === "list")
    return (
      <div className="max-w-xl">
        {members.map((m) => (
          <FadeUp key={m.name} className="flex items-center gap-4 border-b border-border py-4">
            {m.img && <img src={m.img.src} alt={m.img.alt} className="h-12 w-12 rounded-full object-cover" />}
            <span className="font-serif">{m.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">{m.role}</span>
          </FadeUp>
        ))}
      </div>
    );
  return (
    <div className={cn(variant === "row" ? "flex flex-wrap justify-center gap-10 text-center" : "grid gap-6 sm:grid-cols-2 md:grid-cols-3")}>
      {members.map((m, i) => (
        <FadeUp key={m.name} delay={i * 80} className={cn("transition-transform hover:-translate-y-1", variant === "cards" && "card-surface text-center")}>
          {m.img && (
            <img
              src={m.img.src}
              alt={m.img.alt}
              className={cn(
                "object-cover",
                variant === "row" || variant === "cards" ? "mx-auto mb-4 h-24 w-24 rounded-full" : variant === "square" ? "mb-4 aspect-square w-full" : "mb-4 aspect-[4/5] w-full rounded-md",
              )}
            />
          )}
          <h4 className="font-serif">{m.name}</h4>
          <p className="text-sm text-muted-foreground">{m.role}</p>
        </FadeUp>
      ))}
    </div>
  );
}

export function Logos({ names, variant = "strip" }: { names: string[]; variant?: "strip" | "boxed" | "grid" | "line" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center",
        variant === "grid" ? "grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-border md:grid-cols-4" : "gap-x-10 gap-y-4",
        variant === "line" && "divide-x divide-border gap-0",
      )}
    >
      {names.map((n) => (
        <span
          key={n}
          className={cn(
            "font-serif text-lg font-bold opacity-55 transition hover:opacity-100",
            variant === "boxed" && "rounded-md border-[length:var(--frame-border-width)] border-border px-6 py-2.5 opacity-80",
            variant === "grid" && "bg-background px-6 py-5 text-center opacity-70",
            variant === "line" && "px-8",
          )}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export type Quote = { text: string; by: string; img?: { src: string; alt: string } };

export function Quotes({ items, variant = "wall" }: { items: Quote[]; variant?: "single" | "huge" | "card" | "wall" | "avatar" | "editorial" }) {
  if (!items?.length) return null;
  if (variant === "editorial") {
    const q = items[0];
    return (
      <FadeUp className="mx-auto max-w-3xl">
        <blockquote className="font-serif text-3xl leading-snug md:text-4xl">
          "{q.text}"
        </blockquote>
        <div className="mt-8 border-t-[length:var(--frame-border-width)] border-border pt-4 text-sm uppercase tracking-[0.15em] text-muted-foreground">
          — {q.by}
        </div>
      </FadeUp>
    );
  }
  if (variant === "single" || variant === "huge" || variant === "card") {
    const q = items[0];
    return (
      <FadeUp className={cn("max-w-2xl", variant === "card" && "rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-card p-9")}>
        <blockquote className={cn("font-serif leading-snug", variant === "huge" ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl")}>
          "{q.text}"
        </blockquote>
        <div className="mt-5 text-sm text-muted-foreground">— {q.by}</div>
      </FadeUp>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((q, i) => (
        <FadeUp key={q.by} delay={i * 80} className="card-surface transition-transform hover:-translate-y-1">
          {variant === "avatar" && q.img && <img src={q.img.src} alt={q.img.alt} className="mb-4 h-11 w-11 rounded-full object-cover" />}
          <blockquote className="text-sm leading-relaxed">"{q.text}"</blockquote>
          <div className="mt-4 text-xs text-muted-foreground">— {q.by}</div>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Lists & comparison ──────────────────────────────────────────────── */

export function Checklist({
  items,
  variant = "list",
}: {
  items: string[];
  variant?: "list" | "two-col" | "boxed" | "pills" | "x";
}) {
  if (!items?.length) return null;
  const Icon = variant === "x" ? X : Check;
  return (
    <ul
      className={cn(
        variant === "pills" ? "flex max-w-3xl flex-wrap gap-2.5" : "grid max-w-2xl gap-3",
        variant === "two-col" && "sm:grid-cols-2 max-w-3xl",
      )}
    >
      {items.map((it) => (
        <li
          key={it}
          className={cn(
            "flex items-center gap-2.5 text-[15px]",
            variant === "boxed" && "rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-card px-4 py-3",
            variant === "pills" && "rounded-full border-[length:var(--frame-border-width)] border-border px-4 py-2 text-sm",
            variant === "x" && "text-muted-foreground",
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", variant === "x" ? "text-muted-foreground" : "text-primary")} />
          {it}
        </li>
      ))}
    </ul>
  );
}

export function Compare({
  columns,
  variant = "two",
}: {
  columns: { title: string; items: string[]; good?: boolean }[];
  variant?: "two" | "stack" | "three" | "striped" | "marks";
}) {
  return (
    <div className={cn("grid gap-4", variant === "stack" ? "max-w-2xl" : variant === "three" ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {columns.map((c) => (
        <FadeUp
          key={c.title}
          className={cn("rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border p-[var(--card-pad)]", c.good && "border-primary/50 bg-primary/5")}
        >
          <h4 className="mb-3 font-serif text-lg">{c.title}</h4>
          <ul>
            {c.items.map((it, j) => (
              <li
                key={it}
                className={cn(
                  "flex items-center gap-2.5 border-b border-border py-2.5 text-sm last:border-0",
                  variant === "striped" && j % 2 === 0 && "bg-secondary/60 border-0 px-2 rounded",
                  !c.good && "text-muted-foreground",
                )}
              >
                {variant === "marks" && (c.good ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <X className="h-4 w-4 shrink-0" />)}
                {it}
              </li>
            ))}
          </ul>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Statements & conversion ─────────────────────────────────────────── */

export function BigStat({
  stat,
  caption,
  variant = "default",
}: {
  stat: Stat;
  caption: string;
  variant?: "default" | "fg" | "row" | "band";
}) {
  return (
    <FadeUp
      className={cn(
        variant === "row" ? "flex flex-wrap items-center justify-center gap-8 text-left" : "text-center",
        variant === "band" && "rounded-2xl bg-primary py-12 text-primary-foreground",
      )}
    >
      <StatNumber
        stat={stat}
        className={cn("text-7xl md:text-8xl lg:text-9xl", variant === "band" && "text-primary-foreground", variant === "fg" && "text-foreground")}
      />
      <p className={cn("mt-3 text-lg", variant === "band" ? "text-primary-foreground/75" : "text-muted-foreground")}>{caption}</p>
    </FadeUp>
  );
}

export function CTA({
  title,
  body,
  action,
  href = "#",
  variant = "filled",
}: {
  title: string;
  body?: string;
  action: string;
  href?: string;
  variant?: "filled" | "split" | "outline" | "invert" | "gradient" | "band";
}) {
  const btn = (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold transition hover:opacity-90",
        variant === "filled" || variant === "gradient" || variant === "band" ? "bg-background text-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      {action}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
  if (variant === "band")
    return (
      <FadeUp className="flex flex-wrap items-center justify-between gap-6 rounded-xl bg-primary px-9 py-8 text-primary-foreground">
        <h3 className="font-serif text-2xl">{title}</h3>
        {btn}
      </FadeUp>
    );
  return (
    <FadeUp
      className={cn(
        "rounded-2xl px-9 py-14",
        variant === "split" ? "flex flex-wrap items-center justify-between gap-7 text-left" : "text-center",
        variant === "filled" && "bg-primary text-primary-foreground",
        variant === "gradient" && "bg-gradient-to-br from-primary to-foreground text-primary-foreground",
        variant === "outline" && "border-[length:calc(var(--frame-border-width)*1.5)] border-foreground",
        variant === "invert" && "bg-foreground text-background",
      )}
    >
      <div className={cn(variant !== "split" && "mx-auto max-w-xl")}>
        <h3 className="font-serif text-3xl">{title}</h3>
        {body && <p className={cn("mt-3", variant === "filled" || variant === "gradient" ? "text-primary-foreground/80" : "opacity-70")}>{body}</p>}
      </div>
      <div className={cn(variant !== "split" && "mt-7")}>{btn}</div>
    </FadeUp>
  );
}

export function Subscribe({
  placeholder = "you@email.com",
  action = "Subscribe",
  variant = "inline",
  onSubmit,
}: {
  placeholder?: string;
  action?: string;
  variant?: "inline" | "center" | "pill" | "stack";
  onSubmit?: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(email);
      }}
      className={cn(
        "flex max-w-md gap-3",
        variant === "center" && "mx-auto justify-center",
        variant === "stack" && "max-w-xs flex-col",
        variant === "pill" && "gap-0 rounded-full border-[length:var(--frame-border-width)] border-border bg-card p-1.5",
      )}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 px-4 py-3 text-sm outline-none",
          variant === "pill" ? "bg-transparent" : "rounded-md border-[length:var(--frame-border-width)] border-border bg-card",
        )}
      />
      <button
        type="submit"
        className={cn("shrink-0 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90", variant === "pill" ? "rounded-full" : "rounded-md")}
      >
        {action}
      </button>
    </form>
  );
}

/* ── Motion strips & bento ───────────────────────────────────────────── */

export function Marquee({
  children,
  speed = "normal",
  reverse,
}: {
  children: ReactNode;
  speed?: "slow" | "normal" | "fast";
  reverse?: boolean;
}) {
  const dur = speed === "slow" ? "48s" : speed === "fast" ? "18s" : "30s";
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className="flex w-max gap-5 [animation:marquee_linear_infinite]"
        style={{ animationDuration: dur, animationDirection: reverse ? "reverse" : "normal", animationName: "marquee", animationTimingFunction: "linear", animationIterationCount: "infinite" }}
      >
        {children}
        {children}
      </div>
      <style>{"@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}"}</style>
    </div>
  );
}

export function Bento({
  cells,
}: {
  cells: { title?: string; body?: string; img?: { src: string; alt: string }; span?: 1 | 2; tall?: boolean; hot?: boolean }[];
}) {
  return (
    <div className="grid auto-rows-[150px] grid-cols-2 gap-3.5 md:grid-cols-4">
      {cells.map((c, i) => (
        <FadeUp
          key={i}
          delay={i * 70}
          className={cn(
            "overflow-hidden rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-card p-5 transition-transform hover:-translate-y-1",
            c.span === 2 && "col-span-2",
            c.tall && "row-span-2",
            c.hot && "border-primary bg-primary text-primary-foreground",
            c.img && "p-0",
          )}
        >
          {c.img ? (
            <img src={c.img.src} alt={c.img.alt} className="h-full w-full object-cover" />
          ) : (
            <>
              {c.title && <h3 className="font-serif text-lg">{c.title}</h3>}
              {c.body && <p className={cn("mt-1.5 text-sm", c.hot ? "text-primary-foreground/80" : "text-muted-foreground")}>{c.body}</p>}
            </>
          )}
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────── */

export function Timeline({
  items,
  variant = "rail",
}: {
  items: { marker: string; title: string; body: string }[];
  variant?: "rail" | "horizontal" | "alternate" | "cards";
}) {
  if (!items?.length) return null;
  if (variant === "horizontal")
    return (
      <div className="grid gap-7 border-t-2 border-border pt-7 md:auto-cols-fr md:grid-flow-col">
        {items.map((t, i) => (
          <FadeUp key={t.title} delay={i * 90} className="transition-transform hover:-translate-y-1">
            <div className="font-serif text-sm text-primary">{t.marker}</div>
            <h4 className="mt-1 font-serif text-lg">{t.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
          </FadeUp>
        ))}
      </div>
    );
  return (
    <div className={cn(variant !== "alternate" && "max-w-xl border-l-2 border-border pl-8")}>
      {items.map((t, i) => (
        <FadeUp
          key={t.title}
          delay={i * 80}
          className={cn(
            "relative pb-9 last:pb-0",
            variant === "cards" && "mb-4 rounded-[var(--radius)] border-[length:var(--frame-border-width)] border-border bg-card p-5 pb-5 last:mb-0",
            variant === "alternate" && cn("w-1/2 border-border px-9", i % 2 === 0 ? "ml-auto border-l-2" : "border-r-2 text-right"),
          )}
        >
          {variant !== "cards" && (
            <span
              className={cn(
                "absolute top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background",
                variant === "alternate" ? (i % 2 === 0 ? "-left-[7px]" : "-right-[7px]") : "-left-[39px]",
              )}
            />
          )}
          <div className="font-serif text-sm text-primary">{t.marker}</div>
          <h4 className="mt-0.5 font-serif text-lg">{t.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── FeatureSplit ── asymmetric editorial feature row ─────────────────── */
export function FeatureSplit({
  eyebrow,
  title,
  body,
  meta,
  image,
  flip = false,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  meta?: { label: string; value: string }[];
  image?: { src: string; alt: string };
  flip?: boolean;
}) {
  return (
    <FadeUp className={cn("grid items-center gap-12 md:grid-cols-2", flip && "md:[&>*:first-child]:order-2")}>
      <div>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="display text-3xl md:text-4xl" style={{ letterSpacing: "var(--display-tracking)" }}>{title}</h2>
        <p className="lede mt-4">{body}</p>
        {meta?.length ? (
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
            {meta.map((m) => (
              <div key={m.label} className="border-t-[length:var(--frame-border-width)] border-border pt-3">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</dt>
                <dd className="mt-1 font-serif text-lg">{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {image ? (
        <img src={image.src} alt={image.alt} loading="lazy" className="aspect-[4/5] w-full rounded-[var(--radius)] object-cover" />
      ) : (
        <div className="aspect-[4/5] w-full card-surface" />
      )}
    </FadeUp>
  );
}

/* ── Statement ── oversized manifesto / pull-quote block ──────────────── */
export function Statement({
  text,
  cite,
}: {
  text: string;
  cite?: string;
}) {
  return (
    <FadeUp className="mx-auto max-w-4xl text-center">
      <p className="display text-3xl leading-tight md:text-5xl" style={{ letterSpacing: "var(--display-tracking)" }}>{text}</p>
      {cite && <p className="mt-8 text-sm uppercase tracking-[0.2em] text-muted-foreground">{cite}</p>}
    </FadeUp>
  );
}

/* ── Masthead ── magazine-style section header with rules ─────────────── */
export function Masthead({
  kicker,
  title,
  deck,
}: {
  kicker?: string;
  title: string;
  deck?: string;
}) {
  return (
    <FadeUp>
      <div className="flex items-end justify-between gap-6 border-b-[length:var(--frame-border-width)] border-border pb-5">
        {kicker && <span className="eyebrow">{kicker}</span>}
        <span className="text-xs text-muted-foreground">{new Date().getFullYear()}</span>
      </div>
      <h2 className="display mt-6 text-4xl md:text-6xl" style={{ letterSpacing: "var(--display-tracking)" }}>{title}</h2>
      {deck && <p className="lede mt-4 max-w-2xl">{deck}</p>}
    </FadeUp>
  );
}

/* ── ProductGrid ── shop product cards (image · name · price) ─────────── */
export type Product = { name: string; price: string; image?: { src: string; alt: string }; href?: string; note?: string };
export function ProductGrid({ items, columns = 3 }: { items: Product[]; columns?: 2 | 3 | 4 }) {
  if (!items?.length) return null;
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
      {items.map((p, i) => (
        <FadeUp key={p.name} delay={i * 70} className="group">
          <a href={p.href || "#"} className="block">
            {p.image ? (
              <img src={p.image.src} alt={p.image.alt} loading="lazy" className="aspect-[4/5] w-full rounded-[var(--radius)] object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            ) : (
              <div className="aspect-[4/5] w-full rounded-[var(--radius)] bg-muted" />
            )}
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-base">{p.name}</h3>
              <span className="text-sm font-medium text-muted-foreground">{p.price}</span>
            </div>
            {p.note && <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>}
          </a>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── PriceList ── itemized menu / service price list ──────────────────── */
export type PriceItem = { name: string; description?: string; price: string };
export function PriceList({ items, columns = 1 }: { items: PriceItem[]; columns?: 1 | 2 }) {
  if (!items?.length) return null;
  return (
    <div className={cn("grid gap-x-12", columns === 2 ? "md:grid-cols-2" : "mx-auto max-w-2xl")}>
      {items.map((it, i) => (
        <FadeUp key={it.name} delay={i * 50} className="flex items-baseline gap-4 border-b-[length:var(--frame-border-width)] border-border py-4">
          <div className="min-w-0">
            <h3 className="font-serif text-lg">{it.name}</h3>
            {it.description && <p className="mt-0.5 text-sm text-muted-foreground">{it.description}</p>}
          </div>
          <span className="ml-auto whitespace-nowrap font-serif text-lg text-primary">{it.price}</span>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Reviews ── testimonials with a star rating ───────────────────────── */
export type Review = { quote: string; author: string; role?: string; rating?: number };
export function Reviews({ items, columns = 3 }: { items: Review[]; columns?: 2 | 3 }) {
  if (!items?.length) return null;
  const Stars = ({ n = 5 }: { n?: number }) => (
    <div className="mb-3 flex gap-0.5 text-primary" aria-label={n + " out of 5 stars"}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn("h-4 w-4", i < n ? "fill-current" : "fill-current opacity-20")}>
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </div>
  );
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3")}>
      {items.map((r, i) => (
        <FadeUp key={r.author} delay={i * 70} className="card-surface">
          <Stars n={r.rating ?? 5} />
          <blockquote className="text-sm leading-relaxed">"{r.quote}"</blockquote>
          <div className="mt-4 text-sm font-medium">
            {r.author}
            {r.role && <span className="font-normal text-muted-foreground"> · {r.role}</span>}
          </div>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Badges ── labelled accreditation / trust strip ───────────────────── */
export type Badge = { label: string; sublabel?: string; icon?: ReactNode };
export function Badges({ items, variant = "row" }: { items: Badge[]; variant?: "row" | "cards" }) {
  if (!items?.length) return null;
  if (variant === "cards")
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((b, i) => (
          <FadeUp key={b.label} delay={i * 60} className="card-surface flex items-center gap-3">
            {b.icon && <div className="text-primary [&>svg]:h-6 [&>svg]:w-6">{b.icon}</div>}
            <div>
              <div className="text-sm font-medium">{b.label}</div>
              {b.sublabel && <div className="text-xs text-muted-foreground">{b.sublabel}</div>}
            </div>
          </FadeUp>
        ))}
      </div>
    );
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
      {items.map((b, i) => (
        <FadeUp key={b.label} delay={i * 60} className="flex items-center gap-2.5 text-muted-foreground">
          {b.icon && <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{b.icon}</span>}
          <span className="text-sm font-medium uppercase tracking-wide">{b.label}</span>
        </FadeUp>
      ))}
    </div>
  );
}
