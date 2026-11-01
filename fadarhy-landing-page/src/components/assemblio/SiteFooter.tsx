import { ThemeToggle } from "./ThemeToggle";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-8 text-[13px] text-ink-muted lg:px-10">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
          <span className="text-[15px] font-semibold tracking-tight text-ink">FadäRhy</span>
          <span className="text-[11px] uppercase text-ink-muted">© 2026 FadäRhy · Basel, Switzerland</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-medium">
          <ThemeToggle />
          <a href="mailto:hallo@fadarhy.ch" className="inline-flex items-center gap-1 text-[12px] text-link underline underline-offset-4">
            hallo@fadarhy.ch
          </a>
          <a href="#imprint" className="hover:text-ink">Imprint</a>
          <a href="#privacy" className="hover:text-ink">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
