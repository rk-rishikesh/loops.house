/**
 * Rate limiter — delegates to Supabase DB via lib/db/rate-limiter.ts.
 *
 * Keeps the same export signatures so existing API routes continue to work,
 * but checkRateLimit is now async.
 */

import { checkRateLimit as dbCheckRateLimit } from "@/lib/db/rate-limiter";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs = 3600000,
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const result = await dbCheckRateLimit(key, maxRequests, windowMs);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
