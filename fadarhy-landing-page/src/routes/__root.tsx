/// <reference types="vite/client" />
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, type ReactNode } from "react";
import { site } from "@/data/content";
import appCss from "@/styles.css?url";
import { themeInitScript } from "@/lib/theme";
// Side-effect import (in addition to the ?url link above): makes Vite inject the
// stylesheet client-side AND populates TanStack Start's dev CSS aggregator
// (/@tanstack-start/styles.css). Without it a fully client-rendered route — e.g.
// an auth-gated page that renders nothing on the server — paints UNSTYLED in the
// dev preview, because the ?url <link> alone is unreliable for client-only pages.
import "@/styles.css";

// This route IS the HTML document (TanStack Start SSR). There is no
// index.html and no main.tsx — Start owns the entry + hydration. To add
// a page you still just drop a file in src/routes/ and give it a head().
// Per-route head() (title/description/og) merges over the defaults here.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
      { title: site.title },
      { name: "description", content: site.description },
      { property: "og:title", content: site.title },
      { property: "og:description", content: site.description },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      // Frutiger is self-hosted in public/fonts; only the monospaced utility
      // font remains on Google Fonts.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  // Browser extensions (LanguageTool's data-lt-installed, Grammarly's
  // data-gr-*, Dark Reader, etc.) stamp attributes onto <html>/<body> before
  // React hydrates. Without suppressHydrationWarning that mismatch makes React
  // bail on the document root and drop the dev server's injected styles, so the
  // page renders completely UNSTYLED for any visitor running such an extension
  // (incognito disables extensions, which is why it looks fine there). It
  // covers attribute mismatches on these two elements only — it does not
  // recurse, so genuine mismatches deeper in the tree are still reported.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        {/* swarmz-bridge surfaces console + fetch + vite errors back to
            the editor overlay. It self-noops when not iframed. Injected
            here (not via index.html, which no longer exists) so it ships
            identically under SSR and prerender. */}
        <script src="/swarmz-bridge.js?v=swarmz-bridge%402026-10-27%2Fsoft-reload%2Bpage-swipe-cancel%2Bpods-v2-swap%2Bpresence%23b21"></script>
        {/* swarmz visual-edit / draw resident script. DEV-ONLY: a production
            vite build statically replaces import.meta.env.DEV with false and
            dead-code-eliminates this, so it is physically absent from published
            builds. Present on the first preview load (file written at provision)
            so visual/draw mode is instant — no inject + reload. */}
        {import.meta.env.DEV && <script src="/__swarmz_visual.js"></script>}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="display text-5xl mt-3">Not found</h1>
        <p className="lede mt-4">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

// Root errorComponent fires when the root route itself fails to render,
// so it must emit its own document shell (RootDocument) — there is no
// parent layout left to provide <html>. It also reports the error to the
// parent editor frame using the same swarmz:runtime_error message shape
// the bridge script (public/swarmz-bridge.js) emits, so the editor's
// existing listener picks it up with zero extra wiring. Self-noops when
// not iframed.
// Router 1.170 types the thrown value as unknown (anything can be thrown), so
// normalise it to an Error once here.
function ErrorPage({ error: thrown, reset }: ErrorComponentProps) {
  const error = useMemo(() => (thrown instanceof Error ? thrown : new Error(String(thrown))), [thrown]);
  const router = useRouter();
  const message = error && error.message ? error.message : String(error);
  useEffect(() => {
    console.error(error);
    // Error name + the first /src/ stack frame make the report actionable:
    // the editor's auto-heal classifies "ReferenceError: x is not defined"
    // as a deterministic bug (never dismissed as transient) and the fix
    // prompt lands on the exact file instead of hunting. Re-post every 20s
    // while this page stays mounted — a crash the user is still looking at
    // must never read as "cleared".
    const name = error && error.name && error.name !== "Error" ? error.name + ": " : "";
    const frame = (String((error && error.stack) || "").match(/\/src\/[^\s)?]+/) || [""])[0];
    const payload = ("Route error: " + name + message + (frame ? " " + frame : "")).slice(0, 500);
    const report = () => {
      // String arg on purpose: the bridge's console.error wrapper captures it
      // into the pod's console log (stamped by the sidecar) WITHOUT double-
      // posting a runtime_error (it only postMessages Error instances). Each
      // 20s beat is the AI done-gate's "the error screen is visible right
      // now" signal — a crash the model fixed mid-run stops beating.
      console.error(payload);
      try {
        if (window.parent !== window) {
          window.parent.postMessage(
            { type: "swarmz:runtime_error", error: payload },
            "*",
          );
        }
      } catch {
        // cross-origin parent / not iframed — fine
      }
    };
    report();
    const t = setInterval(report, 20000);
    return () => clearInterval(t);
  }, [error, message]);
  return (
    <RootDocument>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="display text-4xl mt-3">This page hit an error</h1>
          <p className="lede mt-4">{message}</p>
          <p className="lede mt-2">Check the latest changes for the cause, or try again.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center rounded-md border border-current px-4 py-2 text-sm font-medium"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium underline underline-offset-4"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </RootDocument>
  );
}
