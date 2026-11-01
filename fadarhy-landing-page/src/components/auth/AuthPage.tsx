import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { consumeReturnTo, peekReturnTo, rememberReturnTo, safeReturnTo } from "@/lib/auth-return";
import { site } from "@/data/content";
// <SocialAuth /> shows the Google / Apple buttons the project has on (managed
// sign-in or the project's own app) and nothing for a provider that is off, so
// Cloud settings changes need no code change. NEVER hand-write
// supabase.auth.signInWithOAuth for google/apple: managed mode disables the
// native provider and a direct call fails with HTTP 400 "provider is not enabled".
import { SocialAuth, useSocialProviders } from "@/components/auth/SocialAuth";

type Mode = "sign-in" | "sign-up" | "magic" | "forgot" | "recover";
type Sent = { kind: "confirm" | "reset" | "magic"; email: string };

export type AuthPageProps = {
  /** Form shown first. Default: ?mode=signup in the URL, else "sign-in". */
  defaultMode?: "sign-in" | "sign-up";
  /**
   * After signing in, go to ?returnTo= — or "/" when this is a dedicated sign-in
   * route (/auth, /login, …); rendered inside another page it stays put. Pass
   * false to never navigate (RequireAuth does).
   */
  redirect?: boolean;
  /** Called once the visitor is signed in. */
  onAuthenticated?: () => void;
  /** Full page with the brand side panel (default). false = a compact form inside a page. */
  fullScreen?: boolean;
  /** The side panel's line. Default: site.description from src/data/content.ts. */
  tagline?: string;
  /** A photo for the side panel (a file in public/ or a URL). Default: none, the panel is type on the brand colour. */
  image?: string;
  /** The brand mark (a file in public/, e.g. "/icon.png"). Default: the first letter of site.title. */
  logo?: string;
  /** Offer "Email me a sign-in link" next to the password form. Default: true. */
  magicLink?: boolean;
};

const COPY: Record<Mode, { title: string; submit: string; busy: string }> = {
  "sign-in": { title: "Welcome back", submit: "Sign in", busy: "Signing in…" },
  "sign-up": { title: "Create your account", submit: "Create account", busy: "Creating account…" },
  magic: { title: "Sign in with a link", submit: "Email me a link", busy: "Sending…" },
  forgot: { title: "Reset your password", submit: "Send reset link", busy: "Sending…" },
  recover: { title: "Choose a new password", submit: "Save password", busy: "Saving…" },
};

/** "Crumb & Co." stays one sentence: no second full stop. */
function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : text + ".";
}

function subtitleFor(mode: Mode): string {
  if (mode === "sign-in") return sentence("Sign in to " + (site.title || "your account"));
  if (mode === "sign-up") return site.title ? sentence("Join " + site.title) : "Start with your email.";
  if (mode === "magic") return "We'll email you a link that signs you in.";
  if (mode === "forgot") return "We'll email you a link to choose a new one.";
  return "Use at least 8 characters.";
}

function sentCopy(sent: Sent): { lead: string; tail: string; subtitle: string } {
  if (sent.kind === "confirm") {
    return {
      subtitle: "One more step to finish signing up.",
      lead: "We sent a confirmation link to ",
      tail: ". Open it to finish creating your account, and you'll come right back.",
    };
  }
  if (sent.kind === "magic") {
    return {
      subtitle: "Your sign-in link is on its way.",
      lead: "We sent a sign-in link to ",
      tail: ". Open it on this device to finish signing in.",
    };
  }
  return {
    subtitle: "Follow the link to choose a new password.",
    lead: "If an account exists for ",
    tail: ", you'll get a link to choose a new password.",
  };
}

// First path segments of dedicated sign-in routes (/auth, /login, …). On one of
// these, a sign-in with no ?returnTo= goes home; anywhere else it stays put.
const AUTH_SEGMENTS = ["auth", "login", "log-in", "signin", "sign-in", "signup", "sign-up", "register"];
function onAuthRoute(pathname: string): boolean {
  return AUTH_SEGMENTS.includes((pathname.split("/")[1] ?? "").toLowerCase());
}

const RADIUS = "rounded-[var(--radius,0.5rem)]";
const BTN_RADIUS = "rounded-btn";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FIELD =
  "h-11 w-full appearance-none border border-input bg-background px-3 text-base text-foreground " + RADIUS + " " +
  "[font-family:inherit] placeholder:text-muted-foreground/70 transition-shadow " + FOCUS + " sm:text-sm";
const PRIMARY =
  "inline-flex h-11 w-full cursor-pointer appearance-none items-center justify-center gap-2 border-0 bg-primary px-4 " +
  "text-sm font-medium text-primary-foreground transition-colors [font-family:inherit] hover:bg-primary/90 " +
  BTN_RADIUS + " " + FOCUS + " focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-60";
const SECONDARY =
  "inline-flex h-10 cursor-pointer appearance-none items-center justify-center gap-2 border border-input bg-background px-4 " +
  "text-sm font-medium text-foreground transition-colors [font-family:inherit] hover:bg-accent hover:text-accent-foreground " +
  BTN_RADIUS + " " + FOCUS + " disabled:pointer-events-none disabled:opacity-60";
const LINK =
  "cursor-pointer appearance-none border-0 bg-transparent p-0 font-medium text-foreground underline-offset-4 " +
  "[font-family:inherit] hover:underline focus-visible:outline-none focus-visible:underline";
const QUIET_LINK = LINK + " text-sm text-muted-foreground hover:text-foreground";

function initialOf(title: string | undefined): string {
  return (title ?? "").trim().charAt(0).toUpperCase() || "·";
}

/**
 * Sign-in / create-account page with a brand side panel, Google and Apple
 * (when on), email + password, an email sign-in link, and password reset.
 * Plain elements on the project's design tokens (no UI-library imports), so it
 * follows the palette, fonts, radius and dark mode of any design. After a
 * successful sign-in it returns to ?returnTo= (validated, in-app paths only;
 * see src/lib/auth-return.ts), else "/" on a dedicated sign-in route, else it
 * stays on the page it gates. Mount it on a route (src/routes/auth.tsx with
 * component: AuthPage) or gate a page with <RequireAuth>
 * (src/components/auth/RequireAuth.tsx). The side panel takes tagline, image
 * and logo props; it hides below the lg breakpoint.
 */
export default function AuthPage({
  defaultMode,
  redirect = true,
  onAuthenticated,
  fullScreen = true,
  tagline,
  image,
  logo,
  magicLink = true,
}: AuthPageProps) {
  const router = useRouter();
  const auth = useAuth();
  const social = useSocialProviders(auth.configured);
  const [mode, setMode] = useState<Mode>(defaultMode ?? "sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const id = useId();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const done = useRef(false);
  const onAuthenticatedRef = useRef(onAuthenticated);
  onAuthenticatedRef.current = onAuthenticated;

  // Read ?mode= and ?returnTo= once, in the browser.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("mode");
    if (requested === "recover") setMode("recover");
    else if (!defaultMode && (requested === "signup" || requested === "sign-up")) setMode("sign-up");
    const back = safeReturnTo(params.get("returnTo"));
    if (back) rememberReturnTo(back);
  }, [defaultMode]);

  useEffect(() => {
    if (auth.recovering) setMode("recover");
  }, [auth.recovering]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  // Signed in (password, Google/Apple or an email link): back to where they started.
  useEffect(() => {
    if (!auth.ready || !auth.user || mode === "recover" || done.current) return;
    done.current = true;
    onAuthenticatedRef.current?.();
    if (!redirect) return;
    const here = window.location.pathname + window.location.search;
    const target = consumeReturnTo();
    // No destination and this page is not a dedicated sign-in route (the form
    // is gating a page): stay — the page shows its content now.
    const to = target ?? (onAuthRoute(window.location.pathname) ? "/" : null);
    if (!to || to === here) return;
    if (router?.history) router.history.replace(to);
    else window.location.replace(to);
  }, [auth.ready, auth.user, mode, redirect, router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(null);
    setPassword("");
    setShowPassword(false);
    window.setTimeout(() => emailRef.current?.focus(), 0);
  }

  function invalid(address: string): string | null {
    if (mode !== "recover" && !address) return "Enter your email address.";
    if (mode !== "forgot" && mode !== "magic" && !password) return "Enter your password.";
    if ((mode === "sign-up" || mode === "recover") && password.length < 8) {
      return "Use at least 8 characters for your password.";
    }
    return null;
  }

  async function run(address: string): Promise<string | null> {
    if (mode === "sign-in") return (await auth.signIn(address, password)).error;
    if (mode === "sign-up") {
      const outcome = await auth.signUp(address, password, { returnTo: peekReturnTo() });
      if (!outcome.error && outcome.needsConfirmation) {
        setSent({ kind: "confirm", email: address });
        setResendIn(30);
      }
      return outcome.error;
    }
    if (mode === "magic" || mode === "forgot") {
      const outcome = mode === "magic"
        ? await auth.sendMagicLink(address, { returnTo: peekReturnTo() })
        : await auth.sendPasswordReset(address, { returnTo: peekReturnTo() });
      if (!outcome.error) setSent({ kind: mode === "magic" ? "magic" : "reset", email: address });
      return outcome.error;
    }
    const outcome = await auth.updatePassword(password);
    if (!outcome.error) setMode("sign-in"); // already signed in by the link: the effect above moves on
    return outcome.error;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const address = email.trim();
    const problem = invalid(address);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      setError(await run(address));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!sent || resendIn > 0) return;
    setError(null);
    const outcome = await auth.resendConfirmation(sent.email, { returnTo: peekReturnTo() });
    if (outcome.error) setError(outcome.error);
    else setResendIn(30);
  }

  const copy = COPY[mode];
  const expiredLink = mode === "recover" && auth.ready && !auth.user;
  const loading = auth.configured && mode !== "forgot" && (!auth.ready || !social.ready);
  const errorId = id + "-error";
  const title = sent ? "Check your email" : expiredLink ? "Link expired" : copy.title;
  const subtitle = sent
    ? sentCopy(sent).subtitle
    : expiredLink
      ? "Password reset links work once and expire after a while."
      : subtitleFor(mode);

  let panel: ReactNode;
  if (!auth.configured) {
    panel = <p className="text-sm text-muted-foreground">Sign-in isn't available on this site yet.</p>;
  } else if (loading) {
    panel = <FormSkeleton />;
  } else if (sent) {
    const text = sentCopy(sent);
    panel = (
      <div role="status" aria-live="polite">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text.lead}
          <span className="font-medium text-foreground">{sent.email}</span>
          {text.tail}
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {sent.kind === "confirm" ? (
            <button type="button" onClick={resend} disabled={resendIn > 0} className={SECONDARY}>
              {resendIn > 0 ? "Resend in " + resendIn + "s" : "Resend email"}
            </button>
          ) : null}
          <button type="button" onClick={() => switchMode("sign-in")} className={QUIET_LINK}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  } else if (expiredLink) {
    panel = (
      <div>
        <p className="text-sm text-muted-foreground">This reset link is no longer valid. Request a fresh one.</p>
        <button type="button" onClick={() => switchMode("forgot")} className={PRIMARY + " mt-6"}>
          Send a new link
        </button>
      </div>
    );
  } else {
    const entry = mode === "sign-in" || mode === "sign-up";
    panel = (
      <>
        {entry && social.providers.length > 0 ? (
          <div className="mb-5">
            <SocialAuth providers={social.providers} divider="bottom" />
          </div>
        ) : null}
        <form noValidate onSubmit={submit} className="grid gap-4">
          {mode !== "recover" ? (
            <Field label="Email" htmlFor={id + "-email"}>
              <input
                ref={emailRef}
                id={id + "-email"}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error) && !email.trim()}
                aria-describedby={error ? errorId : undefined}
                className={FIELD}
              />
            </Field>
          ) : null}
          {mode !== "forgot" && mode !== "magic" ? (
            <Field
              label={mode === "recover" ? "New password" : "Password"}
              htmlFor={id + "-password"}
              action={
                mode === "sign-in" ? (
                  <button type="button" onClick={() => switchMode("forgot")} className={LINK + " text-xs text-muted-foreground"}>
                    Forgot password?
                  </button>
                ) : null
              }
            >
              <div className="relative">
                <input
                  id={id + "-password"}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error) && Boolean(email.trim())}
                  aria-describedby={error ? errorId : undefined}
                  className={FIELD + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className={
                    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer appearance-none items-center " +
                    "justify-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground " +
                    RADIUS + " " + FOCUS
                  }
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {mode !== "sign-in" ? <p className="text-xs text-muted-foreground">At least 8 characters.</p> : null}
            </Field>
          ) : null}
          {error ? (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy} aria-busy={busy} className={PRIMARY + " mt-1"}>
            {busy ? <Spinner /> : null}
            {busy ? copy.busy : copy.submit}
          </button>
        </form>
        <ModeLinks mode={mode} magicLink={magicLink} onSwitch={switchMode} />
      </>
    );
  }

  const body = (
    <>
      <div className="mb-8">
        <h1 className={"display leading-tight text-foreground " + (fullScreen ? "text-3xl sm:text-[2.125rem]" : "text-2xl sm:text-3xl")}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {panel}
    </>
  );

  if (!fullScreen) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-background px-6 py-12 text-foreground">
        <div className="w-full max-w-sm">{body}</div>
      </section>
    );
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel tagline={tagline ?? site.description} image={image} logo={logo} />
      <div className="flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <header className="flex h-9 items-center lg:hidden">
          <a href="/" className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground no-underline">
            <BrandMark logo={logo} />
            {site.title}
          </a>
        </header>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{body}</div>
      </div>
    </main>
  );
}

/** The sign-in page's side panel: the brand colour, the app's name and one
 *  line in the display face, or a photo when one is passed. Hidden on phones. */
function BrandPanel({ tagline, image, logo }: { tagline: string; image?: string; logo?: string }) {
  const year = new Date().getFullYear();
  return (
    <aside
      className={
        "relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14 " +
        (image ? "bg-muted text-white" : "bg-primary text-primary-foreground dark:border-r dark:bg-card dark:text-card-foreground")
      }
    >
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        </>
      ) : null}
      <a href="/" className="relative inline-flex items-center gap-3 text-sm font-medium text-inherit no-underline">
        <BrandMark logo={logo} inverse={!image} />
        {site.title}
      </a>
      <div className="relative max-w-md">
        {tagline ? <p className="display text-4xl leading-[1.1] xl:text-5xl">{tagline}</p> : null}
        <p className="mt-8 text-xs opacity-70">
          © {year} {site.title}
        </p>
      </div>
    </aside>
  );
}

function BrandMark({ logo, inverse = false }: { logo?: string; inverse?: boolean }) {
  const box = "h-7 w-7 shrink-0 rounded-[calc(var(--radius,0.5rem)-2px)]";
  if (logo) return <img src={logo} alt="" className={box + " object-contain"} />;
  return (
    <span
      aria-hidden="true"
      className={
        box + " inline-flex items-center justify-center text-xs font-semibold " +
        (inverse
          ? "bg-primary-foreground text-primary dark:bg-primary dark:text-primary-foreground"
          : "bg-primary text-primary-foreground")
      }
    >
      {initialOf(site.title)}
    </span>
  );
}

function ModeLinks({ mode, magicLink, onSwitch }: { mode: Mode; magicLink: boolean; onSwitch: (next: Mode) => void }) {
  if (mode === "forgot" || mode === "recover") {
    return (
      <p className="mt-6 text-sm">
        <button type="button" onClick={() => onSwitch("sign-in")} className={QUIET_LINK}>
          Back to sign in
        </button>
      </p>
    );
  }
  return (
    <div className="mt-6 grid gap-3 text-sm">
      {mode === "sign-in" && magicLink ? (
        <p>
          <button type="button" onClick={() => onSwitch("magic")} className={QUIET_LINK}>
            Email me a sign-in link instead
          </button>
        </p>
      ) : null}
      {mode === "magic" ? (
        <p>
          <button type="button" onClick={() => onSwitch("sign-in")} className={QUIET_LINK}>
            Use a password instead
          </button>
        </p>
      ) : null}
      <p className="text-muted-foreground">
        {mode === "sign-up" ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => onSwitch(mode === "sign-up" ? "sign-in" : "sign-up")} className={LINK}>
          {mode === "sign-up" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

/** Same footprint as the form, so nothing moves when it arrives. */
function FormSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4">
      <span className="sr-only">Loading…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className={"h-11 animate-pulse bg-muted motion-reduce:animate-none " + RADIUS} />
      ))}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
