import { Link } from "@tanstack/react-router";
import { site } from "@/data/content";

export function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-background/70 border-b border-border">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-sm font-medium tracking-tight">
          {site.title}
        </Link>
        <nav className="flex gap-8 text-sm text-muted-foreground">
          <Link to="/" className="link-line hover:text-foreground transition-colors">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
