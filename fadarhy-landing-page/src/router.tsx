import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false },
    },
  });

  return createRouter({
    routeTree,
    context: { queryClient },
    // Restore scroll on back/forward and reload, except inside the editor's live
    // frame (window.name is swz-live there). The router restored a remembered
    // position about 2 s after load, which showed as the page jumping when the
    // editor swapped the saved version for the live app.
    scrollRestoration: typeof window === "undefined" || window.name !== "swz-live",
    // Fetch a page's code on hover / touch, so the click itself is instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });
}
