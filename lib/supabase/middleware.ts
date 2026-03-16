import { createServerClient } from "@supabase/ssr";
import { headers } from "next/headers";
import { type BasicCapabilities, getBasicCapabilities } from "@/lib/capabilities";
import { createServerSupabase } from "./server";
import type { Database } from "./types";

export type AuthUser = {
  id: string;
  email: string;
  is_admin: boolean;
  is_event_creator: boolean;
};

export type AuthResult = {
  user: AuthUser;
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
};

/**
 * Validate session and optionally check capabilities.
 *
 * @param check — optional predicate on BasicCapabilities.
 *   Example: `requireAuth((caps) => caps.isAdmin)`
 *   If omitted, any authenticated user passes.
 */
export async function requireAuth(
  check?: (caps: BasicCapabilities) => boolean,
): Promise<AuthResult | null> {
  const supabase = await createServerSupabase();
  let {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Route handlers don't run through edge middleware, so sessions can be stale.
  // If the access token is expired, attempt a refresh before failing auth.
  if ((error || !user) && !user) {
    try {
      await supabase.auth.refreshSession();
    } catch {
      // ignore and fall through
    }

    const retry = await supabase.auth.getUser();
    user = retry.data.user;
    error = retry.error;
  }

  // Fall back to Bearer token auth (used by CLI / MCP tools)
  if (error || !user) {
    const result = await tryBearerAuth(check);
    if (result) return result;
    return null;
  }

  const caps = await getBasicCapabilities(supabase, user.id);
  if (!caps) return null;
  if (check && !check(caps)) return null;

  return {
    user: {
      id: user.id,
      email: user.email!,
      is_admin: caps.isAdmin,
      is_event_creator: caps.isEventCreator,
    },
    supabase,
  };
}

/**
 * Authenticate via Authorization: Bearer <supabase_access_token>.
 * Used by CLI and MCP tools that can't set cookies.
 */
async function tryBearerAuth(
  check?: (caps: BasicCapabilities) => boolean,
): Promise<AuthResult | null> {
  try {
    const hdrs = await headers();
    const authHeader = hdrs.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);

    // Create a Supabase client with the Bearer token injected as the session
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    const caps = await getBasicCapabilities(supabase, user.id);
    if (!caps) return null;
    if (check && !check(caps)) return null;

    return {
      user: {
        id: user.id,
        email: user.email!,
        is_admin: caps.isAdmin,
        is_event_creator: caps.isEventCreator,
      },
      supabase,
    };
  } catch {
    return null;
  }
}

export function unauthorized(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function forbidden(message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
