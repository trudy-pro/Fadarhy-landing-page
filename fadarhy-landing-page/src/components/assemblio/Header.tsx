import { ArrowRight } from "lucide-react";
import logoMark from "@/assets/fadarhy-logo-tile.jpg";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For programmes", href: "#pilot" },
  { label: "Journey", href: "#journey" },
  { label: "Team", href: "#team" },
  { label: "Try FadäRhy", href: "https://app.fadarhy.ch/", external: true },
];

export function Logo() {
  return (
    <a href="#top" aria-label="FadäRhy" className="flex items-center text-primary">
      <img src={logoMark} alt="" aria-hidden className="size-10 shrink-0 rounded-[10px]" />
      <span className="ml-2.5 text-[24px] font-semibold tracking-tight leading-none text-ink">FadäRhy</span>
    </a>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="flex items-center justify-center gap-2 bg-night px-4 py-1.5 text-[13px] text-mist dark:bg-surface dark:text-ink">
        <span className="rounded bg-mist px-1.5 py-0.5 text-[11px] font-medium text-night dark:bg-thread-lime dark:text-on-thread-lime">Overall winner</span>
        <span className="hidden sm:inline">Hack am Rhein 2026 | Live beta, free for founders</span>
        <ArrowRight className="size-3.5" />
      </div>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 lg:px-10">
          <Logo />
          <nav className="hidden lg:flex items-center gap-9 text-[14px] font-medium">
            {links.map((l) => (
              <a key={l.label} href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-ink transition-colors hover:text-link">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <ThemeToggle className="hidden sm:inline-grid" />
            <span className="hidden sm:inline text-[13px] text-ink-muted">EN</span>
            <a href="mailto:hallo@fadarhy.ch?subject=Early%20access%20to%20Fad%C3%A4Rhy" className="inline-flex min-h-10 items-center rounded-[10px] bg-rhine-blue px-4 text-[14px] font-medium text-on-rhine-blue hover:brightness-[0.93]">
              Get early access
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
