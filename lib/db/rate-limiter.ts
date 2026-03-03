import { supabaseAdmin } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

/** Check rate limit via Supabase RPC (DB-backed, persistent across restarts) */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs = 3600000,
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_ms: windowMs,
  });

  if (error || !data?.length) {
    // On error, deny the request (fail closed) and log
    console.error("Rate limit check failed:", error);
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowMs).toISOString() };
  }

  const result = data[0];
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.reset_at,
  };
}
