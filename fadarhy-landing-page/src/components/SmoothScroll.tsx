import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";

function smoothScrollAllowed(): boolean {
  if (window.self !== window.top) return false; // editor preview / any embed
  return !window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)").matches;
}

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)");
    let stop: (() => void) | undefined;
    const update = () => {
      stop?.();
      stop = undefined;
      if (!smoothScrollAllowed()) return;
      const lenis = new Lenis({
        duration: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: true,
      });
      lenisRef.current = lenis;
      let frame = 0;
      const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
      frame = requestAnimationFrame(raf);
      stop = () => {
        cancelAnimationFrame(frame);
        lenis.destroy();
        lenisRef.current = null;
      };
    };
    update();
    preference.addEventListener("change", update);
    return () => {
      preference.removeEventListener("change", update);
      stop?.();
    };
  }, []);

  // A navigation moves the page (to the top, or back to a restored position)
  // without Lenis knowing; adopt wherever the router put it and re-measure the
  // new page, so the next wheel tick doesn't animate back to the old spot.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    const frame = requestAnimationFrame(() => {
      lenis.resize();
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
