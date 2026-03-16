import { exec } from "node:child_process";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { Cli, z } from "incur";
import {
  clearCredentials,
  getAnonKey,
  getSupabaseUrl,
  loadCredentials,
  saveCredentials,
} from "./config.js";
import type { Database } from "./types.js";

export const auth = Cli.create("auth", {
  description: "Authenticate with the Loops House platform",
});

auth.command("login", {
  description: "Log in via browser OAuth (Google/GitHub)",
  options: z.object({
    port: z.coerce.number().default(54321).describe("Local callback port"),
    provider: z.enum(["google", "github"]).default("google").describe("OAuth provider to use"),
  }),
  output: z.object({
    email: z.string(),
    user_id: z.string(),
    message: z.string(),
  }),
  examples: [
    { description: "Log in with default settings" },
    { options: { port: 9999 }, description: "Use a custom callback port" },
  ],
  async run({ options, error }) {
    const url = getSupabaseUrl();
    const anon = getAnonKey();

    const supabase = createClient<Database>(url, anon, {
      auth: { persistSession: false, flowType: "pkce" },
    });

    const redirectTo = `http://localhost:${options.port}/callback`;

    // Start PKCE flow — get the auth URL
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: options.provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (oauthError || !oauthData.url) {
      return error({
        code: "OAUTH_INIT_FAILED",
        message: oauthError?.message || "Failed to initialize OAuth flow",
        retryable: true,
      });
    }

    // Wait for the callback
    const result = await new Promise<{ ok: true; code: string } | { ok: false; message: string }>(
      (resolve) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        const server = createServer((req, res) => {
          const reqUrl = new URL(req.url!, `http://localhost:${options.port}`);
          if (reqUrl.pathname === "/callback") {
            const code = reqUrl.searchParams.get("code");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("<html><body><h2>Authenticated! You can close this tab.</h2></body></html>");
            if (timeout) {
              clearTimeout(timeout);
              timeout = null;
            }
            server.close();
            if (code) {
              resolve({ ok: true, code });
            } else {
              resolve({
                ok: false,
                message: reqUrl.searchParams.get("error_description") || "No auth code received",
              });
            }
          }
        });

        server.listen(options.port, () => {
          console.log(`\nOpening browser for authentication...\n`);
          console.log(`If it doesn't open, visit:\n  ${oauthData.url}\n`);
          // Auto-open browser (macOS: open, Linux: xdg-open, Windows: start)
          const cmd =
            process.platform === "darwin"
              ? "open"
              : process.platform === "win32"
                ? "start"
                : "xdg-open";
          exec(`${cmd} "${oauthData.url}"`);
          console.log(`Waiting for authentication on port ${options.port}...`);
        });

        // Timeout after 2 minutes
        timeout = setTimeout(() => {
          server.close();
          resolve({ ok: false, message: "Authentication timed out (2 min)" });
        }, 120_000);
      },
    );

    if (!result.ok) {
      return error({
        code: "AUTH_FAILED",
        message: result.message,
        retryable: true,
      });
    }

    // Exchange code for session
    const { data: session, error: sessionError } = await supabase.auth.exchangeCodeForSession(
      result.code,
    );

    if (sessionError || !session.session) {
      return error({
        code: "TOKEN_EXCHANGE_FAILED",
        message: sessionError?.message || "Failed to exchange code for session",
        retryable: true,
      });
    }

    saveCredentials({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
    });

    return {
      email: session.user?.email || "unknown",
      user_id: session.user?.id || "unknown",
      message: "Successfully authenticated. Credentials saved to ~/.loops/credentials.json",
    };
  },
});

auth.command("status", {
  description: "Check current authentication status",
  output: z.object({
    authenticated: z.boolean(),
    email: z.string().optional(),
    user_id: z.string().optional(),
    expires_at: z.string().optional(),
  }),
  async run() {
    const creds = loadCredentials();
    if (!creds?.access_token) {
      return { authenticated: false };
    }

    const url = getSupabaseUrl();
    const anon = getAnonKey();

    const supabase = createClient<Database>(url, anon, {
      auth: { persistSession: false },
    });

    const { data, error: err } = await supabase.auth.setSession({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
    });

    if (err || !data.user) {
      return { authenticated: false };
    }

    if (data.session) {
      saveCredentials({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    }

    return {
      authenticated: true,
      email: data.user.email,
      user_id: data.user.id,
      expires_at: data.session?.expires_at
        ? new Date(data.session.expires_at * 1000).toISOString()
        : undefined,
    };
  },
});

auth.command("logout", {
  description: "Clear stored credentials",
  output: z.object({ message: z.string() }),
  run() {
    clearCredentials();
    return { message: "Logged out. Credentials cleared." };
  },
});
