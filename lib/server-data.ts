/**
 * Server-side data fetching layer.
 *
 * Mirrors lib/storage.ts API but uses the server Supabase client.
 * Import this in server components instead of lib/storage.ts.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import {
  profileToStored,
  boosterToStored,
  teamToStored,
  submissionToStored,
} from "@/lib/data-mappers";
import type {
  StoredProject,
  StoredBooster,
  StoredTeam,
  StoredSubmission,
  BoosterType,
  TeamRow,
} from "@/lib/data-mappers";

// Re-export types for convenience
export type { StoredProject, StoredBooster, StoredTeam, StoredSubmission, BoosterType };

// --- Projects ---

export async function getProjectsServer(): Promise<StoredProject[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("loops_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getProjectsServer:", error.message);
  return (data ?? []).map(profileToStored);
}

export async function getProjectServer(projectId: string): Promise<StoredProject | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("loops_profiles")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) console.error("[server-data] getProjectServer:", error.message);
  return data ? profileToStored(data) : null;
}

// --- Boosters ---

export async function getBoostersServer(type?: BoosterType): Promise<StoredBooster[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("boosters")
    .select("*")
    .order("created_at", { ascending: false });
  if (type) {
    query = query.eq("booster_type", type);
  }
  const { data, error } = await query;
  if (error) console.error("[server-data] getBoostersServer:", error.message);
  return (data ?? []).map(boosterToStored);
}

export async function getBoosterServer(id: string): Promise<StoredBooster | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[server-data] getBoosterServer:", error.message);
  return data ? boosterToStored(data) : null;
}

export async function getBoosterWithTracksServer(id: string): Promise<StoredBooster | null> {
  const supabase = await createServerSupabase();
  const { data: booster, error } = await supabase
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[server-data] getBoosterWithTracksServer:", error.message);
  if (!booster) return null;

  const { data: tracks, error: tracksError } = await supabase
    .from("booster_tracks")
    .select("sponsor_name, track_description")
    .eq("booster_id", id);
  if (tracksError) console.error("[server-data] getBoosterWithTracksServer tracks:", tracksError.message);

  const stored = boosterToStored(booster);
  stored.sponsor_tracks = (tracks ?? []).map((t) => ({
    sponsor: t.sponsor_name,
    track_description: t.track_description ?? "",
  }));
  return stored;
}

// --- Teams ---

export async function getTeamsServer(userId?: string): Promise<StoredTeam[]> {
  const supabase = await createServerSupabase();
  if (userId) {
    const { data, error } = await supabase
      .from("team_members")
      .select("teams(*)")
      .eq("user_id", userId);
    if (error) console.error("[server-data] getTeamsServer(userId):", error.message);
    return (data?.map((d) => (d as Record<string, unknown>).teams as TeamRow).filter(Boolean) ?? []).map(teamToStored);
  }
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getTeamsServer:", error.message);
  return (data ?? []).map(teamToStored);
}

export async function getTeamServer(id: string): Promise<StoredTeam | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[server-data] getTeamServer:", error.message);
  return data ? teamToStored(data) : null;
}

// --- Submissions ---

export async function getSubmissionsServer(boosterId: string): Promise<StoredSubmission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getSubmissionsServer:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getSubmissionServer(boosterId: string, projectId: string): Promise<StoredSubmission | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) console.error("[server-data] getSubmissionServer:", error.message);
  return data ? submissionToStored(data) : null;
}

export async function getSubmissionsForBoostersServer(boosterIds: string[]): Promise<StoredSubmission[]> {
  if (boosterIds.length === 0) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .in("booster_id", boosterIds)
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getSubmissionsForBoostersServer:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getProjectSubmissionsServer(projectId: string): Promise<StoredSubmission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getProjectSubmissionsServer:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getBoostersByIdsServer(ids: string[]): Promise<Record<string, StoredBooster>> {
  if (ids.length === 0) return {};
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("boosters")
    .select("*")
    .in("id", ids);
  if (error) console.error("[server-data] getBoostersByIdsServer:", error.message);
  const map: Record<string, StoredBooster> = {};
  (data ?? []).forEach((b) => { map[b.id] = boosterToStored(b); });
  return map;
}
