import { useEffect, useRef } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)");
    let stop: (() => void) | undefined;
    const update = () => {
      stop?.();
      stop = undefined;
      dot.hidden = ring.hidden = preference.matches;
      if (preference.matches) return;
      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx;
      let ry = my;

      const onMove = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      };

      let raf = 0;
      const tick = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      window.addEventListener("mousemove", onMove);
      stop = () => {
        window.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(raf);
      };
    };
    update();
    preference.addEventListener("change", update);
    return () => { preference.removeEventListener("change", update); stop?.(); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
