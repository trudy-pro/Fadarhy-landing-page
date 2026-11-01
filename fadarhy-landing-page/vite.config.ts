import { defineConfig, normalizePath, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Vite only SOFT-invalidates the importers of a deleted module: their cached
// transform (including the already-resolved import URL) is kept and merely
// re-stamped. A rename that changes the extension — useAuth.ts → useAuth.tsx,
// which the build agent does to fix JSX in a .ts file — therefore leaves every
// importer pointing at the dead path, and the dev server answers HTTP 500
// "Failed to load url /src/hooks/useAuth.ts … Does the file exist?" until the
// importer itself is edited or the server restarts (prod incident 2026-10-02,
// reproduced on Vite 7.3.5; kept for Vite 8). Hard-invalidate those importers on unlink so the
// next request re-resolves the import against the files that exist now.
function reresolveImportersOnDelete(): Plugin {
  return {
    name: "swarmz-reresolve-on-delete",
    configureServer(server) {
      server.watcher.on("unlink", (file: string) => {
        const deleted = normalizePath(file);
        for (const environment of Object.values(server.environments)) {
          const graph = environment.moduleGraph;
          const mods = graph.getModulesByFile(deleted);
          if (!mods) continue;
          for (const mod of mods) {
            for (const importer of mod.importers) {
              graph.invalidateModule(importer, new Set(), Date.now(), true, false);
            }
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    // Order is load-bearing: tanstackStart() MUST precede viteReact().
    // @tanstack/react-start (1.168 and the 1.169 line on Vite 8) bundles its
    // server/build machinery via @tanstack/start-plugin-core: `vite build`
    // emits dist/client + dist/server with NO nitro package/plugin (verified
    // on 1.169.4 + Vite 8.3.5, 2026-10-25). Nitro is only a deploy-target
    // adapter; the pod's dev server, snapshot and publish paths never use it.
    //   prerender → every crawlable route is emitted as static HTML at
    //     `vite build` time (real SEO + instant first paint).
    //     "/" lands at dist/client/index.html (FULL content) — that is
    //     what the sleep/snapshot path serves when the pod is hibernated.
    //   NO spa mode. TanStack Start SPA mode (spa.enabled) COMPLETELY
    //     disables server-side rendering of route content for ALL routes:
    //     only the root shell (Nav/Footer in __root) renders server-side,
    //     and every page body becomes client-only. That made the preview
    //     paint header+footer instantly and the main content ~1-2s later
    //     (empty <main> in the SSR HTML — also bad for SEO, the crawler saw
    //     no content). SSR is ON BY DEFAULT in TanStack Start, so OMITTING
    //     spa gives full server-rendered route content: snappy first paint
    //     AND crawlable HTML. The snapshot still gets a content-full
    //     index.html from prerender above. (operator 2026-06-16, verified
    //     live: SSR body 12.9KB shell-only → 27.9KB with full <main>.)
    // The in-pod AI never touches any of this: it edits file-based
    // routes + each route's head() exactly as before.
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true },
    }),
    viteReact(),
    tailwindcss(),
    reresolveImportersOnDelete(),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
    // ONE React instance across the app AND any externalized dep. Without this,
    // an SSR-rendered library that calls React hooks (e.g. motion) can bind to a
    // SECOND React copy whose hook dispatcher is null during the app's render →
    // "Cannot read properties of null (reading 'useRef')" the instant a motion
    // component renders on the server.
    dedupe: ["react", "react-dom"],
  },
  // SSR: transform motion through Vite's own pipeline instead of letting Node
  // load it as an externalized ESM module. Externalized, motion 12 + React 19 +
  // TanStack Start SSR bound a different React instance and crashed on server
  // render (useRef null) the moment ANY motion component hit a route — and the
  // scaffold ships motion (PageTransition + the AI's entrance animations), so
  // without this every motion-using page 500s on first paint / navigation.
  // (operator 2026-06-17 — root-caused on a live pod: its vite.config had
  // neither dedupe nor ssr.noExternal; the AI had to strip motion to recover.)
  ssr: {
    noExternal: ["motion", "@carbon/react", "@carbon/icons-react", "@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled", "@emotion/cache", "@emotion/css", "@emotion/serialize", "@emotion/utils", "@emotion/hash", "antd", "@ant-design/icons", "@ant-design/cssinjs", "@ant-design/cssinjs-utils", "antd-style", "dayjs", "rc-util", "rc-picker", "rc-pagination", "@rc-component/util", "@rc-component/trigger", "@rc-component/picker", "@rc-component/pagination"],
  },
  // Pre-bundle EVERY client dependency the scaffold ships, and crawl all of
  // src/ at boot. Vite only pre-bundled the 7 deps listed here before; any
  // other import (zod, radix, recharts, date-fns, sonner, …) was discovered
  // the first time a page used it, and Vite answered with "new dependencies
  // optimized … reloading" — a FULL reload of the preview right after it
  // opened or right after the AI added a page, which threw the visitor's
  // scroll position and click away (the "jumps up and down / first click
  // glitches" reports, 2026-10-04). `entries` makes the boot crawl see every
  // import the app already has; the list covers imports the AI adds later.
  // A name the project later uninstalls is skipped, not an error.
  optimizeDeps: {
    entries: ["src/**/*.{ts,tsx}"],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "motion/react",
      // motion re-exports from framer-motion. Left out, Vite found it while a
      // page was loading in a browser ("optimized dependencies changed.
      // reloading") and reloaded the preview (measured 2026-10-26).
      "framer-motion",
      "lucide-react",
      "lenis",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
      "@hookform/resolvers/zod",
      "react-hook-form",
      "zod",
      "date-fns",
      "recharts",
      "sonner",
      "cmdk",
      "embla-carousel-react",
      "input-otp",
      "next-themes",
      "react-day-picker",
      "react-resizable-panels",
      "vaul",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "@supabase/supabase-js",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    hmr: { protocol: "wss", clientPort: 443 },
    // The pod keeps its package store and build snapshots inside /workspace.
    // Watching them costs tens of thousands of file handles and slows every
    // start; nothing in them is ever imported by the app.
    watch: {
      ignored: ["**/.pnpm-store/**", "**/.snapshots/**", "**/.swarmz/**", "**/.local/**"],
    },
    // The preview bridge (public/swarmz-bridge.js) is loaded by
    // src/routes/__root.tsx. TanStack Start renders the document itself, so a
    // transformIndexHtml plugin would never run; this note also tells older
    // Swarmz pipelines not to inject one (they look for "swarmz-bridge").
    // No server.warmup. Pre-transforming every page on boot competed with the
    // first real request for CPU and made the first page 40% slower
    // (measured 2026-10-26, 8-page project). The pod base image ships a
    // complete dependency cache instead (services/cluster/pod-base-image).
  },
});
