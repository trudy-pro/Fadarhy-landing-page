import { getSupabase } from "../lib/supabase-client";
import { runManagedOAuth } from "../lib/managed-oauth-client";

/** Open the swarmz managed-OAuth popup, receive the minted session, set it.
 *  Thin wrapper over the shared runner. NOTE: the scaffolded Supabase client
 *  also routes a native supabase.auth.signInWithOAuth({ provider }) through the
 *  same broker, so either entry point works — prefer <SocialAuth /> for new UI.
 *  Call this synchronously from a click handler (it opens a popup). */
export function signInWithManaged(provider: "google" | "apple"): Promise<void> {
  const sb = getSupabase();
  if (!sb) return Promise.reject(new Error("Backend not connected"));
  return runManagedOAuth(sb, provider);
}
