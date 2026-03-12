/**
 * UserCapabilities — replaces the single AppRole.
 *
 * Computed from DB state. Cached in cookie for middleware fast-path.
 * Full capabilities loaded on demand in server components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Basic capabilities — available at cookie/middleware level for fast route gating */
export interface BasicCapabilities {
  isAdmin: boolean;
  isEventCreator: boolean;
  isCohost: boolean; // true if cohost on at least one hackathon
  isJudge: boolean; // true if judge on at least one hackathon
}

/** Full capabilities including per-hackathon role arrays */
export interface UserCapabilities extends BasicCapabilities {
  cohostOf: string[]; // hackathon IDs
  judgeOf: string[]; // hackathon IDs
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  capabilities: UserCapabilities;
}

/** Basic capabilities from users table + existence checks (for middleware/cookie) */
export async function getBasicCapabilities(
  supabase: SupabaseClient,
  userId: string,
): Promise<BasicCapabilities | null> {
  const [userResult, cohostResult, judgeResult] = await Promise.all([
    supabase.from("users").select("is_admin, is_event_creator").eq("id", userId).single(),
    supabase
      .from("hackathon_cohosts")
      .select("hackathon_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("hackathon_judges")
      .select("hackathon_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (!userResult.data) return null;

  return {
    isAdmin: userResult.data.is_admin,
    isEventCreator: userResult.data.is_event_creator,
    isCohost: (cohostResult.count ?? 0) > 0,
    isJudge: (judgeResult.count ?? 0) > 0,
  };
}

/** Full capabilities including per-hackathon role arrays */
export async function getFullCapabilities(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserCapabilities | null> {
  const [userResult, cohostResult, judgeResult] = await Promise.all([
    supabase.from("users").select("is_admin, is_event_creator").eq("id", userId).single(),
    supabase.from("hackathon_cohosts").select("hackathon_id").eq("user_id", userId),
    supabase.from("hackathon_judges").select("hackathon_id").eq("user_id", userId),
  ]);

  if (!userResult.data) return null;

  const cohostOf = (cohostResult.data ?? []).map((r) => r.hackathon_id);
  const judgeOf = (judgeResult.data ?? []).map((r) => r.hackathon_id);

  return {
    isAdmin: userResult.data.is_admin,
    isEventCreator: userResult.data.is_event_creator,
    isCohost: cohostOf.length > 0,
    isJudge: judgeOf.length > 0,
    cohostOf,
    judgeOf,
  };
}

/**
 * Encode basic capabilities into a cookie string.
 * Format: "userId:flag1,flag2,..."
 */
export function encodeCapsForCookie(userId: string, caps: BasicCapabilities): string {
  const flags: string[] = [];
  if (caps.isAdmin) flags.push("admin");
  if (caps.isEventCreator) flags.push("event_creator");
  if (caps.isCohost) flags.push("cohost");
  if (caps.isJudge) flags.push("judge");
  return `${userId}:${flags.join(",")}`;
}

/** Decode basic capabilities from cookie string */
export function decodeCapsFromCookie(
  cookie: string,
  expectedUserId: string,
): BasicCapabilities | null {
  const sep = cookie.indexOf(":");
  if (sep === -1) return null;
  const uid = cookie.slice(0, sep);
  if (uid !== expectedUserId) return null;
  const flags = cookie.slice(sep + 1).split(",");
  return {
    isAdmin: flags.includes("admin"),
    isEventCreator: flags.includes("event_creator"),
    isCohost: flags.includes("cohost"),
    isJudge: flags.includes("judge"),
  };
}

/** Check if user can manage a specific hackathon (host or cohost) */
export function canManageHackathon(
  caps: UserCapabilities,
  hackathonHostId: string,
  userId: string,
  hackathonId: string,
): boolean {
  return caps.isAdmin || hackathonHostId === userId || caps.cohostOf.includes(hackathonId);
}

/** Check if user can judge a specific hackathon */
export function canJudgeHackathon(caps: UserCapabilities, hackathonId: string): boolean {
  return caps.isAdmin || caps.judgeOf.includes(hackathonId);
}
