import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { authUrl, currentPath } from "@/lib/auth-return";
import AuthPage from "@/components/auth/AuthPage";

/**
 * Show children only to signed-in visitors. It waits for the stored session
 * before deciding (no flash of the sign-in form for people who are signed in).
 *
 *   <RequireAuth><Dashboard /></RequireAuth>
 *     signed out -> the sign-in form right here; after signing in the page
 *     simply shows its content (no navigation needed)
 *   <RequireAuth redirectTo="/auth"><Dashboard /></RequireAuth>
 *     signed out -> /auth?returnTo=<this page>, and back here after sign-in
 */
export function RequireAuth({
  children,
  fallback,
  redirectTo,
}: {
  children: ReactNode;
  /** Shown while the session loads (and while redirecting). Default: a small spinner. */
  fallback?: ReactNode;
  /** Send signed-out visitors to this sign-in route instead of showing the form here. */
  redirectTo?: string;
}) {
  const { ready, user, recovering } = useAuth();
  const router = useRouter();
  const leave = Boolean(redirectTo) && ready && !user && !recovering;

  useEffect(() => {
    if (!leave || !redirectTo) return;
    const to = authUrl(currentPath(), redirectTo);
    if (router?.history) router.history.replace(to);
    else window.location.replace(to);
  }, [leave, redirectTo, router]);

  const waiting = fallback ?? (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (!ready) return <>{waiting}</>;
  if (recovering) return <AuthPage redirect={false} fullScreen={false} />;
  if (!user) return redirectTo ? <>{waiting}</> : <AuthPage redirect={false} fullScreen={false} />;
  return <>{children}</>;
}

/** Same component, alternative name. */
export const AuthGate = RequireAuth;

export default RequireAuth;
