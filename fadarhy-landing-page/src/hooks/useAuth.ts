import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-client";
import { safeReturnTo } from "@/lib/auth-return";

export type AuthResult = { error: string | null; code?: string };
export type SignUpResult = AuthResult & {
  /** true when the account needs its email confirmed before it can sign in. */
  needsConfirmation: boolean;
};

export type AuthState = {
  user: User | null;
  session: Session | null;
  /** true until the stored session is known (same as !ready). */
  loading: boolean;
  /** The initial session is known. Never treat someone as signed out before this. */
  ready: boolean;
  /** Access token of the signed-in user, for your own API calls (null when signed out). */
  accessToken: string | null;
  /** A backend is connected, so signing in can work. */
  configured: boolean;
  /** A password-reset link signed the user in — ask them for a new password. */
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Email a one-time sign-in link that opens this page signed in (then returnTo).
   *  Creates the account for a new email unless sign-ups are closed. */
  sendMagicLink: (email: string, opts?: { returnTo?: string | null }) => Promise<AuthResult>;
  /** returnTo: in-app path the confirmation email link should open. */
  signUp: (
    email: string,
    password: string,
    opts?: { returnTo?: string | null; data?: Record<string, unknown> },
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  /** Email a reset link that opens redirectPath (default: this page) in recovery mode. */
  sendPasswordReset: (email: string, opts?: { redirectPath?: string; returnTo?: string | null }) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string, opts?: { returnTo?: string | null }) => Promise<AuthResult>;
};

const NOT_CONFIGURED = "Sign-in isn't available yet for this site.";

/** True when the project has backend credentials (same answer on server and client). */
export function isAuthConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  );
}

/** Turn an auth error into a short, human message. */
export function friendlyAuthError(
  error: { message?: string; code?: string; status?: number } | null | undefined,
): string | null {
  if (!error) return null;
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "That email and password don't match. Try again, or reset your password.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Please confirm your email first — check your inbox for the link we sent.";
  }
  if (code === "user_already_exists" || /already registered|already exists/i.test(message)) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (code === "weak_password" || /password should/i.test(message)) {
    return "Choose a stronger password — at least 8 characters, ideally with a number or symbol.";
  }
  if (code === "same_password") return "Your new password must be different from the old one.";
  if (code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(message)) {
    return "That email address doesn't look right.";
  }
  if (code === "signup_disabled" || /signups not allowed/i.test(message)) {
    return "New sign-ups are closed for this site right now.";
  }
  if (code.startsWith("over_") || error.status === 429 || /rate limit|too many|security purposes/i.test(message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (/failed to fetch|network/i.test(message)) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

function result(error: { message?: string; code?: string; status?: number } | null): AuthResult {
  return error ? { error: friendlyAuthError(error), code: error.code } : { error: null };
}

/** Absolute URL for an in-app path (email links must be absolute). */
function linkTo(path: string | null | undefined): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin + (safeReturnTo(path) ?? "/");
}

/**
 * Auth state + actions on top of getSupabase(). SSR-safe: the server render
 * and the first browser render are both "not ready"; the stored session is
 * read after hydration (INITIAL_SESSION). Without backend credentials the hook
 * is inert: ready, signed out, and actions resolve with a friendly error.
 */
export function useAuth(): AuthState {
  const configured = isAuthConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "USER_UPDATED" || event === "SIGNED_OUT") setRecovering(false);
      setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return result(error);
  }, []);

  const sendMagicLink = useCallback(async (email: string, opts?: { returnTo?: string | null }) => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const here = typeof window !== "undefined" ? window.location.pathname : "/";
    const back = safeReturnTo(opts?.returnTo);
    const query = back ? "?" + new URLSearchParams({ returnTo: back }).toString() : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: linkTo(here + query) },
    });
    return result(error);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, opts?: { returnTo?: string | null; data?: Record<string, unknown> }) => {
      const supabase = getSupabase();
      if (!supabase) return { error: NOT_CONFIGURED, needsConfirmation: false };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: linkTo(opts?.returnTo), data: opts?.data },
      });
      if (error) return { ...result(error), needsConfirmation: false };
      // No session back = the project requires email confirmation first.
      return { error: null, needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(
    async (email: string, opts?: { redirectPath?: string; returnTo?: string | null }) => {
      const supabase = getSupabase();
      if (!supabase) return { error: NOT_CONFIGURED };
      const here = typeof window !== "undefined" ? window.location.pathname : "/";
      const params = new URLSearchParams({ mode: "recover" });
      const back = safeReturnTo(opts?.returnTo);
      if (back) params.set("returnTo", back);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: linkTo((safeReturnTo(opts?.redirectPath) ?? here) + "?" + params.toString()),
      });
      return result(error);
    },
    [],
  );

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    return result(error);
  }, []);

  const resendConfirmation = useCallback(async (email: string, opts?: { returnTo?: string | null }) => {
    const supabase = getSupabase();
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: linkTo(opts?.returnTo) },
    });
    return result(error);
  }, []);

  return {
    user: session?.user ?? null,
    session,
    loading: !ready,
    ready,
    accessToken: session?.access_token ?? null,
    configured,
    recovering,
    signIn,
    sendMagicLink,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    resendConfirmation,
  };
}
