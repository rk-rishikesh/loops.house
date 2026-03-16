import { loadCredentials } from "./config.js";

/**
 * Get the platform API base URL (Next.js server).
 * Defaults to https://loops.house, override via LOOPS_PLATFORM_URL for local dev.
 */
export function getPlatformUrl(): string {
  return process.env.LOOPS_PLATFORM_URL || "https://loops.house";
}

/**
 * Make an authenticated fetch to the platform API using Bearer token.
 * Requires stored credentials from `auth login`.
 */
export async function platformFetch(path: string, init?: RequestInit): Promise<Response> {
  const creds = loadCredentials();
  if (!creds?.access_token) {
    throw new Error("Not authenticated. Run `loops auth login` first.");
  }

  const baseUrl = getPlatformUrl();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${creds.access_token}`,
      ...init?.headers,
    },
  });
}
