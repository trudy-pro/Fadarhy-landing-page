// src/lib/auth-return.ts — where to send someone after they sign in.
//
// Shared by the auth kit (AuthPage, RequireAuth) and Swarmz Payments
// (SubscribeButton, CheckoutReturn, ManageSubscriptionButton). It only ever
// hands back a RELATIVE, same-site path such as "/pricing?plan=pro#faq" —
// never an absolute or protocol-relative URL — so a crafted ?returnTo= can't
// bounce anyone to another website.
//
// The return path travels two ways so it survives every sign-in round trip:
//   - the URL:            /auth?returnTo=%2Fpricing   (reloads, new tabs)
//   - sessionStorage:     a fallback for flows that drop the query string
//                         (email confirmation in the same tab, OAuth popups).
// Read it ONCE with consumeReturnTo() after a successful sign-in.
//
// SSR-safe: nothing here touches window or sessionStorage at import time.

/** Query parameter that carries the in-app path to return to after sign-in. */
export const RETURN_TO_PARAM = "returnTo";

/** Default sign-in route. Pass your own path to authUrl() if you mounted AuthPage elsewhere. */
export const AUTH_PATH = "/auth";

const STORAGE_KEY = "swarmz:returnTo";
const MAX_LENGTH = 2048;
// Dummy origin used only to parse and normalise a path.
const PARSE_BASE = "https://return-to.invalid";

/**
 * Validate a return path. Returns the normalised path ("/a?b#c") or null.
 * Accepts only paths on this site: must start with a single "/", may not
 * contain backslashes or control characters, and must still be a plain path
 * after the browser's own normalisation ("/.//evil.com" becomes "//evil.com",
 * which is rejected).
 */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > MAX_LENGTH) return null;
  if (raw.charAt(0) !== "/") return null;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    // 92 = backslash; < 32 and 127 = control characters (tabs and newlines
    // are stripped by browsers, which turns "/<TAB>/evil.com" into "//evil.com").
    if (code < 32 || code === 127 || code === 92) return null;
  }
  if (raw.charAt(1) === "/") return null;
  let url: URL;
  try {
    url = new URL(raw, PARSE_BASE);
  } catch {
    return null;
  }
  if (url.origin !== PARSE_BASE) return null;
  const path = url.pathname + url.search + url.hash;
  if (path.charAt(0) !== "/" || path.charAt(1) === "/") return null;
  return path;
}

/** The current page as a return path (pathname + search + hash). null on the server. */
export function currentPath(): string | null {
  if (typeof window === "undefined") return null;
  const { pathname, search, hash } = window.location;
  return safeReturnTo(pathname + search + hash);
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null; // storage blocked (privacy mode, sandboxed frame)
  }
}

/** Remember where to come back to after signing in. Defaults to the current page. */
export function rememberReturnTo(path?: string | null): void {
  const safe = safeReturnTo(path === undefined ? currentPath() : path);
  const store = storage();
  if (!store) return;
  try {
    if (safe) store.setItem(STORAGE_KEY, safe);
    else store.removeItem(STORAGE_KEY);
  } catch {
    /* quota or access errors are not worth failing a sign-in for */
  }
}

/** Forget any remembered return path. */
export function clearReturnTo(): void {
  const store = storage();
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function fromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return safeReturnTo(new URLSearchParams(window.location.search).get(RETURN_TO_PARAM));
  } catch {
    return null;
  }
}

function fromStorage(): string | null {
  const store = storage();
  try {
    return safeReturnTo(store?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** Read the pending return path (URL first, then sessionStorage) without using it up. */
export function peekReturnTo(): string | null {
  return fromUrl() ?? fromStorage();
}

/**
 * Read the pending return path and use it up, so a later sign-in on another
 * page never jumps back to a stale destination. Returns null when there is
 * none — callers fall back to their own default ("/").
 */
export function consumeReturnTo(): string | null {
  const path = peekReturnTo();
  clearReturnTo();
  return path;
}

/**
 * Build the sign-in URL that brings the visitor back afterwards, and remember
 * the destination in sessionStorage as well:
 *   authUrl("/pricing")             -> "/auth?returnTo=%2Fpricing"
 *   authUrl("/pricing", "/login")   -> "/login?returnTo=%2Fpricing"
 * extra adds more query parameters (for example { mode: "signup" }).
 */
export function authUrl(
  returnTo?: string | null,
  authPath: string = AUTH_PATH,
  extra?: Record<string, string>,
): string {
  const base = safeReturnTo(authPath) ?? AUTH_PATH;
  const target = safeReturnTo(returnTo === undefined ? currentPath() : returnTo);
  rememberReturnTo(target);
  const params = new URLSearchParams(extra ?? {});
  if (target) params.set(RETURN_TO_PARAM, target);
  const query = params.toString();
  const pathOnly = base.split("?")[0].split("#")[0];
  return query ? pathOnly + "?" + query : pathOnly;
}
