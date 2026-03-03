import { createServerSupabase } from "./server";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthResult = {
  user: AuthUser;
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
};

/** Validate session and optionally check role. Returns null if unauthorized. */
export async function requireAuth(
  allowedRoles?: string[],
): Promise<AuthResult | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return null;

  return {
    user: { id: user.id, email: user.email!, role: profile.role },
    supabase,
  };
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
