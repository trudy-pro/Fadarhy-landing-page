import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function observeReveal(el: HTMLElement, targets: Element[]) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reveal = () => targets.forEach((target) => target.classList.add("in"));
  if (preference.matches || !("IntersectionObserver" in window)) { reveal(); return; }
  // Content stays visible until JS is ready; reveal in-view content before paint.
  document.documentElement.classList.add("js-anim");
  const bounds = el.getBoundingClientRect();
  if (bounds.top < window.innerHeight && bounds.bottom > 0) reveal();
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { reveal(); observer.disconnect(); }
  }, { threshold: 0.12 });
  observer.observe(el);
  const onPreference = () => {
    if (preference.matches) { reveal(); observer.disconnect(); }
  };
  preference.addEventListener("change", onPreference);
  return () => { observer.disconnect(); preference.removeEventListener("change", onPreference); };
}

type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer";
};

/** Fades up on scroll-into-view. Pure CSS transition; React only
 *  toggles a class once. `delay` is in milliseconds. */
export function FadeUp({ children, delay = 0, className, as = "div" }: FadeUpProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el, [el]);
  }, []);
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={cn("fade-up", className)}
      style={{ ["--d" as any]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

type RevealLinesProps = {
  lines: ReactNode[];
  baseDelay?: number;
  step?: number;
  className?: string;
};

/** Splits a multi-line heading and reveals each line on a stagger. Each
 *  child line MUST be wrapped in its own React node so the parent can
 *  control overflow:hidden + transform. */
export function RevealLines({ lines, baseDelay = 0, step = 100, className }: RevealLinesProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el, [...el.querySelectorAll(".reveal-line")]);
  }, []);
  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span
          key={i}
          className="reveal-line"
          style={{ ["--d" as any]: `${baseDelay + i * step}ms` }}
        >
          <span>{line}</span>
        </span>
      ))}
    </div>
  );
}
