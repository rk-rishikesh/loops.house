/**
 * Storage abstraction layer.
 *
 * Delegates to Supabase via the browser client.
 * Exports keep the same names so existing page imports continue to work,
 * but all functions are now async.
 *
 * Mapping functions & interfaces are defined in lib/data-mappers.ts
 * and re-exported here for backward compatibility.
 */

import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";
import {
  profileToStored,
  storedToProfileInsert,
  boosterToStored,
  teamToStored,
  submissionToStored,
} from "@/lib/data-mappers";
import type { TeamRow, SubmissionStatus } from "@/lib/data-mappers";

// Re-export all types and interfaces for backward compatibility
export type {
  StoredProject,
  StoredBooster,
  StoredTeam,
  StoredSubmission,
  BoosterType,
  BoosterStatus,
  ProfileRow,
  BoosterRow,
  TeamRow,
  SubmissionRow,
  HostAppWithUser,
  UserListItem,
  JudgeInviteWithUser,
  EvaluationScore,
} from "@/lib/data-mappers";

// --- Supabase client ---

function sb() {
  return createClient();
}

async function ensureAuthReady() {
  // Intentional no-op. Session management is handled by AuthProvider's
  // onAuthStateChange(INITIAL_SESSION). Calling getSession() here caused
  // NavigatorLockAcquireTimeoutError due to lock contention with the
  // AuthProvider and getRole() all competing for the same exclusive lock.
  //
  // With staleTime:0 + refetchOnMount:'always', queries automatically
  // refetch once AuthProvider finishes loading and triggers a re-render.
}

// --- Projects ---

export async function getProjects() {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("loops_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getProjects:", error.message);
  return (data ?? []).map(profileToStored);
}

export async function getProject(projectId: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("loops_profiles")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) console.error("[storage] getProject:", error.message);
  return data ? profileToStored(data) : null;
}

export async function saveProject(project: import("@/lib/data-mappers").StoredProject) {
  await ensureAuthReady();
  const payload = storedToProfileInsert(project);
  if (project.project_id) {
    const { id: _id, ...updates } = payload as typeof payload & { id?: string };
    const { error } = await sb()
      .from("loops_profiles")
      .upsert({ id: project.project_id, ...updates })
      .select();
    if (error) console.error("[storage] saveProject upsert:", error.message);
  } else {
    const { error } = await sb().from("loops_profiles").insert(payload).select();
    if (error) console.error("[storage] saveProject insert:", error.message);
  }
}

export async function removeProject(projectId: string) {
  await ensureAuthReady();
  const { error } = await sb().from("loops_profiles").delete().eq("id", projectId);
  if (error) console.error("[storage] removeProject:", error.message);
}

// --- Boosters ---

export async function getBoosters() {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("boosters")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getBoosters:", error.message);
  return (data ?? []).map(boosterToStored);
}

export async function getBooster(id: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[storage] getBooster:", error.message);
  return data ? boosterToStored(data) : null;
}

export async function saveBooster(booster: import("@/lib/data-mappers").StoredBooster) {
  await ensureAuthReady();
  const { error } = await sb()
    .from("boosters")
    .upsert({
      id: booster.id,
      host_id: booster.host_id!,
      name: booster.name,
      problem_statements: booster.problem_statements,
      theme: booster.theme ?? null,
      booster_type: booster.booster_type ?? "idea",
      website_url: booster.website_url ?? null,
      technical_resources: (booster.technical_resources ?? []) as unknown as Json,
      technical_docs: booster.technical_docs ?? null,
      bounty_pool_summary: booster.bounty_pool_summary ?? null,
      program_goal: booster.program_goal ?? null,
      timeline: booster.timeline ?? null,
      organizer_notes: booster.organizer_notes ?? null,
    })
    .select();
  if (error) throw new Error(`[storage] saveBooster: ${error.message}`);
}

// --- Teams ---

export async function getTeams(userId?: string) {
  await ensureAuthReady();
  if (userId) {
    const { data, error } = await sb()
      .from("team_members")
      .select("teams(*)")
      .eq("user_id", userId);
    if (error) console.error("[storage] getTeams(userId):", error.message);
    return (data?.map((d) => (d as Record<string, unknown>).teams as TeamRow).filter(Boolean) ?? []).map(teamToStored);
  }
  const { data, error } = await sb()
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getTeams:", error.message);
  return (data ?? []).map(teamToStored);
}

export async function getTeam(id: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[storage] getTeam:", error.message);
  return data ? teamToStored(data) : null;
}

export async function saveTeam(team: { id?: string; name: string; owner_id: string; created_at?: string }) {
  await ensureAuthReady();
  const payload: Database["public"]["Tables"]["teams"]["Insert"] = {
    name: team.name,
    owner_id: team.owner_id,
    ...(team.id ? { id: team.id } : {}),
  };

  const { data, error } = await sb()
    .from("teams")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) console.error("[storage] saveTeam:", error.message);

  // Auto-add owner as member
  if (data) {
    const { error: memberError } = await sb().from("team_members").upsert(
      { team_id: data.id, user_id: data.owner_id, role: "owner" },
      { onConflict: "team_id,user_id" },
    );
    if (memberError) console.error("[storage] saveTeam member:", memberError.message);
  }
}

// --- Submissions ---

export async function submitProjectToBooster(
  boosterId: string,
  teamId: string,
  projectId: string,
) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("submissions")
    .upsert(
      {
        booster_id: boosterId,
        team_id: teamId,
        project_id: projectId,
        status: "submitted" as SubmissionStatus,
      },
      { onConflict: "booster_id,project_id" },
    )
    .select()
    .single();
  if (error) console.error("[storage] submitProjectToBooster:", error.message);
  return data ? submissionToStored(data) : null;
}

export async function getProjectSubmissions(projectId: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getProjectSubmissions:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getBoosterSubmissions(boosterId: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getBoosterSubmissions:", error.message);
  return (data ?? []).map(submissionToStored);
}

/** Fetch multiple boosters by IDs in a single query. */
export async function getBoostersByIds(ids: string[]) {
  await ensureAuthReady();
  if (ids.length === 0) return {};
  const { data, error } = await sb()
    .from("boosters")
    .select("*")
    .in("id", ids);
  if (error) console.error("[storage] getBoostersByIds:", error.message);
  const map: Record<string, import("@/lib/data-mappers").StoredBooster> = {};
  (data ?? []).forEach((b) => { map[b.id] = boosterToStored(b); });
  return map;
}

/** Fetch all submissions across multiple boosters in a single query. */
export async function getSubmissionsForBoosters(boosterIds: string[]) {
  await ensureAuthReady();
  if (boosterIds.length === 0) return [];
  const { data, error } = await sb()
    .from("submissions")
    .select("*")
    .in("booster_id", boosterIds)
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getSubmissionsForBoosters:", error.message);
  return (data ?? []).map(submissionToStored);
}

/** Fetch booster with its sponsor tracks from the booster_tracks table. */
export async function getBoosterWithTracks(id: string) {
  await ensureAuthReady();
  const { data: booster, error } = await sb()
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[storage] getBoosterWithTracks:", error.message);
  if (!booster) return null;

  const { data: tracks, error: tracksError } = await sb()
    .from("booster_tracks")
    .select("sponsor_name, track_description")
    .eq("booster_id", id);
  if (tracksError) console.error("[storage] getBoosterWithTracks tracks:", tracksError.message);

  const stored = boosterToStored(booster);
  stored.sponsor_tracks = (tracks ?? []).map((t) => ({
    sponsor: t.sponsor_name,
    track_description: t.track_description ?? "",
  }));
  return stored;
}
