import { createClient } from "@supabase/supabase-js";
import { getAnonKey, getSupabaseUrl, loadCredentials, saveCredentials } from "./config.js";
import type { Database } from "./types.js";

export type { Database };

/**
 * Create an authenticated Supabase client for CLI use.
 * Reads tokens from ~/.loops/credentials.json and auto-refreshes if expired.
 */
export async function getAuthClient() {
  const creds = loadCredentials();
  if (!creds?.access_token) {
    throw new Error("Not authenticated. Run `loops auth login` first.");
  }

  const url = getSupabaseUrl();
  const anon = getAnonKey();

  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false },
  });

  // Set the session from stored credentials
  const { data, error } = await supabase.auth.setSession({
    access_token: creds.access_token,
    refresh_token: creds.refresh_token,
  });

  if (error) {
    throw new Error(
      `Session expired or invalid: ${error.message}. Run \`loops auth login\` again.`,
    );
  }

  if (data.session) {
    saveCredentials({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  }

  return { supabase, user: data.user };
}
