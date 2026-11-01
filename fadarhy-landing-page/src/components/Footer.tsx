import { site } from "@/data/content";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} {site.title}</span>
        <span>{site.brandSuffix} Built with care</span>
      </div>
    </footer>
  );
}
