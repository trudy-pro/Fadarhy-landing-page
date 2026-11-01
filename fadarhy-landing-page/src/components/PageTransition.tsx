import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // False during the server render and hydration: the first page must be
  // visible in the HTML itself, not wait for an animation.
  const mounted = useRef(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    mounted.current = true;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const animate = mounted.current && !reduced;
  return (
    <motion.div
      key={pathname}
      className="page-transition"
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
