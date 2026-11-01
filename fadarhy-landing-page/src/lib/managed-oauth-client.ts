import type { SupabaseClient } from "@supabase/supabase-js";

export const BROKER_ORIGIN =
  (import.meta.env.VITE_SWARMZ_OAUTH_ORIGIN as string | undefined) ?? "https://oauth.swarmz.net";

/** Thrown when the project is NOT enrolled in managed OAuth (a custom/BYO
 *  provider, or no backend). Callers catch this to fall back to native OAuth. */
export class ManagedNotEnrolledError extends Error {}

export const POPUP_BLOCKED_MESSAGE = "Popup blocked — allow popups and try again.";
const POPUP_FEATURES = "width=480,height=720";

/**
 * Open the sign-in popup NOW, inside the click. Browsers only allow a popup
 * while the user gesture is still live; an `await` (even a fast fetch) can
 * end it, and inside the editor preview the embedded app then sees
 * `window.open` return null ("Popup blocked"). So the window is opened first
 * on about:blank and navigated once the destination is known. Returns null
 * when the browser refused.
 */
export function openOAuthPopup(name: string = "swarmz-oauth"): Window | null {
  try { return window.open("about:blank", name, POPUP_FEATURES); } catch (e) { return null; }
}

/** Point a pre-opened popup at `url`, or open one now when none was passed. */
export function navigateOAuthPopup(popup: Window | null | undefined, url: string, name: string): Window | null {
  if (popup && !popup.closed) {
    try { popup.location.replace(url); } catch (e) { popup.location.href = url; }
    return popup;
  }
  return window.open(url, name, POPUP_FEATURES);
}

/** Close a pre-opened popup that turned out not to be needed. */
export function closeOAuthPopup(popup: Window | null | undefined): void {
  if (!popup) return;
  try { if (!popup.closed) popup.close(); } catch (e) { /* ignore */ }
}

function projectRef(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  let ref = "";
  try {
    const host = url ? new URL(url).hostname : "";
    if (host.endsWith(".supabase.co")) ref = host.slice(0, host.length - ".supabase.co".length);
  } catch (e) { /* ignore */ }
  if (!ref) throw new ManagedNotEnrolledError("Managed sign-in needs a connected Supabase backend.");
  return ref;
}

/**
 * Open the swarmz managed-OAuth popup for the provider, receive the
 * broker-minted session, and set it on the passed client. Opens the popup
 * itself when called synchronously from a user gesture; a caller that had
 * to await something first (the scaffold client resolves the provider mode
 * over the network) passes the window it opened synchronously in `popup`
 * (see openOAuthPopup) and this navigates it. Rejects with
 * ManagedNotEnrolledError when the project is not managed-enrolled, so the
 * caller can fall back to native OAuth.
 */
export function runManagedOAuth(client: SupabaseClient, provider: "google" | "apple", popup?: Window | null): Promise<void> {
  return new Promise((resolve, reject) => {
    let ref: string;
    try { ref = projectRef(); } catch (e) { closeOAuthPopup(popup); reject(e as Error); return; }

    const start = new URL(BROKER_ORIGIN + "/oauth/managed/start");
    start.searchParams.set("ref", ref);
    start.searchParams.set("appOrigin", window.location.origin);
    start.searchParams.set("provider", provider);

    const win = navigateOAuthPopup(popup, start.toString(), "swarmz-oauth");
    if (!win) { reject(new Error(POPUP_BLOCKED_MESSAGE)); return; }

    let settled = false;
    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(poll);
      clearTimeout(timer);
    };
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== BROKER_ORIGIN) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "swarmz:oauth_complete" && data.session) {
        cleanup();
        try { win.close(); } catch (e) { /* ignore */ }
        const { error } = await client.auth.setSession(data.session);
        if (error) reject(error); else resolve();
      } else if (data.type === "swarmz:oauth_error") {
        cleanup();
        try { win.close(); } catch (e) { /* ignore */ }
        const msg = typeof data.message === "string" ? data.message : "Sign-in failed";
        // "not enrolled"-shaped errors only. Availability errors (paused
        // backend, "Backend is waking up" after a resume) must NOT fall back
        // to native OAuth — managed mode disables the native provider, so the
        // fallback presents as sign-in being broken/disabled. Regression:
        // unpaused projects looked like managed OAuth was off until the
        // status poll caught up.
        if (/not enrolled|only for cloud|unknown or inactive/i.test(msg)) {
          reject(new ManagedNotEnrolledError(msg));
        } else {
          reject(new Error(msg));
        }
      }
    };
    window.addEventListener("message", onMessage);

    const poll = setInterval(() => {
      if (settled) return;
      if (win.closed) { cleanup(); reject(new Error("Sign-in was not completed.")); }
    }, 500);
    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      try { win.close(); } catch (e) { /* ignore */ }
      reject(new Error("Sign-in timed out."));
    }, 120000);
  });
}

export type ProviderMode = "managed" | "byo" | "off";
export interface ProviderConfig { google: ProviderMode; apple: ProviderMode; }

const CONFIG_TTL_MS = 60_000;
let configCache: { at: number; value: ProviderConfig } | null = null;
let inflight: Promise<ProviderConfig | null> | null = null;

function normMode(v: unknown): ProviderMode {
  return v === "managed" || v === "byo" ? v : "off";
}

/** Per-provider mode from the broker (cached ~60s). Resolves to null on any
 *  failure (no backend / network / non-200) so callers degrade to the shim.
 *  Pass { fresh: true } to skip the cache read (always fetch) — the cache is
 *  still populated on success and the inflight single-flight still applies. */
export function getProviderConfig(opts?: { fresh?: boolean }): Promise<ProviderConfig | null> {
  if (!opts?.fresh && configCache && Date.now() - configCache.at < CONFIG_TTL_MS) {
    return Promise.resolve(configCache.value);
  }
  if (inflight) return inflight;
  let ref: string;
  try { ref = projectRef(); } catch { return Promise.resolve(null); }
  inflight = (async () => {
    try {
      // `cache: "no-store"` so a Managed<->BYO switch is reflected on the very next
      // sign-in click: the in-memory `configCache` (+ `fresh: true`) controls freshness,
      // not the browser HTTP cache (the /config response carries a max-age).
      const res = await fetch(`${BROKER_ORIGIN}/oauth/managed/config?ref=${encodeURIComponent(ref)}`, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      const value: ProviderConfig = { google: normMode(data.google), apple: normMode(data.apple) };
      configCache = { at: Date.now(), value };
      return value;
    } catch {
      return null;
    }
  })().finally(() => { inflight = null; });
  return inflight;
}
