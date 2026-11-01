import { useEffect, useState, type ReactElement } from "react";
import { getSupabase } from "../../lib/supabase-client";
import { getProviderConfig } from "../../lib/managed-oauth-client";

export type SocialProvider = "google" | "apple";
const ORDER: readonly SocialProvider[] = ["google", "apple"];

const LABEL: Record<SocialProvider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
};

/** How long a sign-in page waits for the provider list before it shows the
 *  form without social buttons (they still appear if the answer comes later). */
const WAIT_MS = 1500;

/** Official multicolour Google "G". Brand colours are fixed (not themed) so the
 *  mark stays recognisable on any background. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

/** Apple logo. Uses currentColor so it inherits the button's text colour and
 *  reads correctly in both light and dark themes. */
function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 14 17" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M11.624 9.04c-.02-1.852 1.51-2.74 1.58-2.782-.86-1.259-2.198-1.43-2.674-1.45-1.138-.116-2.222.67-2.8.67-.576 0-1.466-.654-2.41-.636-1.24.018-2.384.72-3.022 1.83-1.289 2.236-.33 5.546.925 7.364.613.89 1.343 1.888 2.3 1.852.923-.037 1.272-.598 2.387-.598 1.115 0 1.428.598 2.41.58.995-.018 1.625-.906 2.234-1.8.704-1.03.993-2.028 1.01-2.08-.022-.01-1.937-.743-1.957-2.946l.017-.073ZM9.79 3.5c.508-.616.85-1.472.757-2.325-.731.03-1.617.487-2.143 1.102-.471.545-.884 1.416-.773 2.252.815.063 1.65-.414 2.16-1.03Z" />
    </svg>
  );
}

const ICON: Record<SocialProvider, () => ReactElement> = {
  google: GoogleIcon,
  apple: AppleIcon,
};

export type SocialProviders = {
  /** The answer is in (or the wait ran out). */
  ready: boolean;
  /** Providers that are on for this project, in display order. */
  providers: SocialProvider[];
};

/**
 * Which social providers this project has on (managed by the platform or the
 * project's own app), resolved at runtime, so turning one on or off in the
 * backend settings needs no code change. A failed lookup (no backend yet,
 * sign-in service unreachable) resolves to none: no button beats a button
 * that cannot work. Pass enabled=false to skip the lookup.
 */
export function useSocialProviders(enabled: boolean = true): SocialProviders {
  const [state, setState] = useState<SocialProviders>({ ready: !enabled, providers: [] });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const settle = (providers: SocialProvider[]) => {
      if (alive) setState({ ready: true, providers });
    };
    const timer = setTimeout(() => settle([]), WAIT_MS);
    getProviderConfig().then((cfg) => {
      clearTimeout(timer);
      settle(cfg ? ORDER.filter((p) => cfg[p] !== "off") : []);
    });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled]);

  return state;
}

export type SocialAuthProps = {
  /** Providers to show. Default: looked up at runtime (useSocialProviders). */
  providers?: SocialProvider[];
  /**
   * Where the "or" divider goes: "top" (default, for buttons placed under a
   * form), "bottom" (buttons placed above a form) or "none".
   */
  divider?: "top" | "bottom" | "none";
};

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span>or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Social sign-in (Google / Apple). Renders a button per provider that is on
 *  and NOTHING (no buttons, no divider) when none is. The scaffolded client
 *  routes each click: managed → the sign-in service popup, own app → native. */
export function SocialAuth({ providers: given, divider = "top" }: SocialAuthProps = {}) {
  const lookup = useSocialProviders(given === undefined);
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn(provider: SocialProvider) {
    const sb = getSupabase();
    if (!sb) { setError("Sign-in isn't available yet."); return; }
    setError(null);
    setPending(provider);
    try {
      // The scaffolded client's shim routes google/apple: managed → broker popup,
      // byo → native. SocialAuth just triggers it.
      const { error: e } = await sb.auth.signInWithOAuth({ provider });
      if (e) throw e;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(null);
    }
  }

  const providers = given ?? lookup.providers;
  if (providers.length === 0) return null;

  return (
    <div className={divider === "top" ? "mt-5 grid gap-3" : "grid gap-3"}>
      {divider === "top" ? <Divider /> : null}
      {providers.map((p) => {
        const Icon = ICON[p];
        // Plain <button> on the design tokens (no UI-library import), so it
        // keeps working when a project swaps its component library.
        return (
          <button
            key={p}
            type="button"
            className="inline-flex h-11 w-full cursor-pointer appearance-none items-center justify-center gap-2.5 whitespace-nowrap rounded-btn border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors [font-family:inherit] hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
            onClick={() => onSignIn(p)}
            disabled={pending !== null}
            aria-busy={pending === p}
          >
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <Icon />
            </span>
            {pending === p ? "Signing in…" : LABEL[p]}
          </button>
        );
      })}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {divider === "bottom" ? <Divider /> : null}
    </div>
  );
}
