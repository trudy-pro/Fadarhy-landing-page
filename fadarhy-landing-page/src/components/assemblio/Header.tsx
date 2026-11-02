import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, Globe, Menu, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
      <span className="ml-2.5 md-title-large font-semibold! text-ink">FadäRhy</span>
    </a>
  );
}

// English only for now; Deutsch and Français are shown but not switchable yet.
const langs = [
  { code: "EN", name: "English", live: true },
  { code: "DE", name: "Deutsch", live: false },
  { code: "FR", name: "Français", live: false },
];

function LangSwitch({ className = "" }: { className?: string }) {
  const current = langs.find((l) => l.live)!;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger aria-label={`Language: ${current.name}`}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-section px-3 md-label-large text-ink transition-colors hover:bg-line data-[state=open]:bg-line ${className}`}>
        <Globe className="size-4 text-link" aria-hidden />
        {current.code}
        <ChevronDown className="size-3.5 text-ink-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] rounded-card border-line bg-card p-1">
        {langs.map((l) => (
          <DropdownMenuItem key={l.code} disabled={!l.live} lang={l.code.toLowerCase()}
            className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 md-label-large text-ink">
            <span>{l.name}</span>
            {l.live ? <Check className="size-4 text-link" aria-hidden /> : <span className="text-[11px] text-ink-muted">Coming soon</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="sticky top-0 z-40">
      <div className="flex items-center justify-center gap-2 bg-night px-4 py-1.5 md-label-large font-normal! text-mist dark:bg-surface dark:text-ink">
        <span className="rounded-chip bg-mist px-1.5 py-0.5 md-label-small text-night dark:bg-thread-lime dark:text-on-thread-lime">Overall winner</span>
        <span className="hidden sm:inline">Hack am Rhein 2026 | Live beta, free for founders</span>
        <ArrowRight className="size-3.5" />
      </div>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 lg:px-10">
          <Logo />
          <nav className="hidden lg:flex items-center gap-9 md-body-medium">
            {links.map((l) => (
              <a key={l.label} href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-ink transition-colors hover:text-link">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <ThemeToggle className="max-sm:hidden" />
            <LangSwitch className="max-sm:hidden" />
            <a href="mailto:hallo@fadarhy.ch?subject=Early%20access%20to%20Fad%C3%A4Rhy" className="inline-flex min-h-10 items-center whitespace-nowrap btn-primary rounded-btn px-3 text-[16px] sm:px-4 font-medium">
              Get early access
            </a>
            <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-btn text-link hover:bg-section lg:hidden">
              {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-menu" className="border-t border-line px-4 pb-4 pt-2 lg:hidden">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex min-h-12 items-center rounded-btn px-3 md-body-medium text-ink hover:bg-section hover:text-link">{l.label}</a>
            ))}
            <div className="mt-2 flex items-center gap-3 border-t border-line px-3 pt-4 sm:hidden">
              <ThemeToggle />
              <LangSwitch />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
