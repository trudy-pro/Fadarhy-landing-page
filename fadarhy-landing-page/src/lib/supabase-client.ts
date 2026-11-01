import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runManagedOAuth, ManagedNotEnrolledError, getProviderConfig, openOAuthPopup, navigateOAuthPopup, closeOAuthPopup, POPUP_BLOCKED_MESSAGE } from "./managed-oauth-client";

let client: SupabaseClient | null = null;
let resolved = false;

/** Lazy, SSR-safe Supabase client. Returns null when the project has no
 *  Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in
 *  .env — written automatically when a cloud backend is connected), so
 *  non-cloud projects never crash. The client is created on first call
 *  and reused after that. */
export function getSupabase(): SupabaseClient | null {
  if (resolved) return client;
  resolved = true;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  installManagedOAuthShim(client);
  return client;
}

// True when this app runs embedded (the editor preview iframe). A frame can
// never complete a native OAuth redirect — the provider refuses to render
// inside a frame (X-Frame-Options / frame-ancestors) — so embedded native
// sign-ins must run in a popup instead.
function isEmbedded(): boolean {
  try { return window.self !== window.top; } catch (e) { return true; }
}

// Native OAuth for the embedded preview: get the provider URL without
// navigating (skipBrowserRedirect), open it in a popup, and wait for
// public/swarmz-bridge.js — which boots inside the popup when the provider
// redirects back to this origin — to relay the implicit-flow tokens via
// postMessage. Mirrors runManagedOAuth's popup lifecycle.
async function runNativeOAuthInPopup(c: SupabaseClient, native: (p: any) => Promise<any>, params: any, popup?: Window | null): Promise<any> {
  const provider = params && params.provider;
  const options = { ...((params && params.options) || {}), skipBrowserRedirect: true } as any;
  // The popup must return to THIS origin for the bridge relay to reach us;
  // only default it — an explicit caller redirectTo wins.
  if (!options.redirectTo) options.redirectTo = window.location.origin;
  const res = await native({ ...params, options });
  const url = res && res.data ? res.data.url : null;
  if ((res && res.error) || !url) { closeOAuthPopup(popup); return res; }
  // Reuse the window opened inside the click (see installManagedOAuthShim):
  // after the await above a fresh window.open would be blocked.
  const win = navigateOAuthPopup(popup, url, "swarmz-oauth-native");
  if (!win) return { data: { provider, url }, error: new Error(POPUP_BLOCKED_MESSAGE) };
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(poll);
      clearTimeout(timer);
    };
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "swarmz:native_oauth_complete" && data.session) {
        cleanup();
        try { win.close(); } catch (e) { /* ignore */ }
        const { error } = await c.auth.setSession(data.session);
        resolve({ data: { provider, url }, error: error ?? null });
      } else if (data.type === "swarmz:native_oauth_error") {
        cleanup();
        try { win.close(); } catch (e) { /* ignore */ }
        const msg = typeof data.message === "string" ? data.message : "Sign-in failed";
        resolve({ data: { provider, url }, error: new Error(msg) });
      }
    };
    window.addEventListener("message", onMessage);
    const poll = setInterval(() => {
      if (settled) return;
      if (win.closed) { cleanup(); resolve({ data: { provider, url }, error: new Error("Sign-in was not completed.") }); }
    }, 500);
    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      try { win.close(); } catch (e) { /* ignore */ }
      resolve({ data: { provider, url }, error: new Error("Sign-in timed out.") });
    }, 120000);
  });
}

// Route a native sign-in the right way for the current context: top-level
// windows redirect as usual; the embedded preview runs the popup flow above.
function runNative(c: SupabaseClient, native: (p: any) => Promise<any>, params: any, popup?: Window | null): Promise<any> {
  if (isEmbedded()) return runNativeOAuthInPopup(c, native, params, popup);
  closeOAuthPopup(popup); // top-level windows redirect; no popup needed
  return native(params);
}

// Managed Google/Apple sign-in is brokered by swarmz, so the project's own
// Google/Apple provider stays DISABLED — a native
// supabase.auth.signInWithOAuth({ provider: "google" }) would 400
// "provider is not enabled". To make every sign-in path work (including a
// hand-written button), we transparently route google/apple through the
// managed broker popup, and fall back to the real native flow when the
// project is NOT managed-enrolled (a custom/BYO provider). Setup is fully
// guarded so a failure here can never break client creation.
function installManagedOAuthShim(c: SupabaseClient): void {
  try {
    const auth = c.auth as any;
    if (typeof auth.signInWithOAuth !== "function") return;
    const native = auth.signInWithOAuth.bind(auth);
    auth.signInWithOAuth = async (params: any) => {
      const provider = params && params.provider;
      // Any popup this sign-in may need is opened HERE, synchronously inside
      // the click, before the first await: once the gesture ends the browser
      // (and the editor preview frame) reports "Popup blocked". Top-level
      // native sign-ins redirect instead and close it again unused.
      const needsPopup = provider === "google" || provider === "apple" || isEmbedded();
      const popup = needsPopup ? openOAuthPopup("swarmz-oauth") : null;
      if (provider !== "google" && provider !== "apple") return runNative(c, native, params, popup);
      const oauthProvider: "google" | "apple" = provider;
      // Resolve the CURRENT mode fresh on every click — never route a sign-in off
      // a stale cache (a just-switched provider would otherwise 400 for ~60s).
      let mode: string = "managed";
      try { const cfg = await getProviderConfig({ fresh: true }); if (cfg) mode = cfg[oauthProvider]; } catch (e) { /* default managed */ }
      if (mode === "off") {
        closeOAuthPopup(popup);
        return { data: { provider: provider, url: null }, error: new Error(provider + " sign-in is not enabled") };
      }
      if (mode === "byo") return runNative(c, native, params, popup);
      // managed (or config unavailable -> default managed, with native fallback):
      try {
        await runManagedOAuth(c, provider, popup);
        return { data: { provider: provider, url: null }, error: null };
      } catch (e) {
        // The popup was closed by runManagedOAuth on failure; the native
        // fallback opens its own only if the gesture is still live.
        if (e instanceof ManagedNotEnrolledError) return runNative(c, native, params, null);
        return { data: { provider: provider, url: null }, error: e as Error };
      }
    };
  } catch (e) { /* leave native signInWithOAuth intact */ }
}
