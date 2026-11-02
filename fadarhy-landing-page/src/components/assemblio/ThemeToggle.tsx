import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyChoice, getChoice, setChoice } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    read();
    window.addEventListener("fadarhy-theme-change", read);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOs = () => {
      if (getChoice() === "system") {
        applyChoice("system");
        read();
      }
    };
    mq.addEventListener("change", onOs);
    return () => {
      window.removeEventListener("fadarhy-theme-change", read);
      mq.removeEventListener("change", onOs);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setChoice(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-grid size-10 place-items-center rounded-btn bg-section text-ink transition-colors hover:bg-line ${className}`}
    >
      {dark ? <Sun className="size-5 text-link" aria-hidden="true" /> : <Moon className="size-5 text-link" aria-hidden="true" />}
    </button>
  );
}
