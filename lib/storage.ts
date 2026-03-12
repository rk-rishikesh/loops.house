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

import type { SubmissionStatus, TeamRow } from "@/lib/data-mappers";
import {
  hackathonToStored,
  profileToStored,
  storedToProfileInsert,
  submissionToStored,
  teamToStored,
} from "@/lib/data-mappers";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";

// Re-export all types and interfaces for backward compatibility
export type {
  EvaluationScore,
  HackathonRow,
  HackathonStatus,
  ProfileRow,
  StoredHackathon,
  StoredProject,
  StoredSubmission,
  StoredTeam,
  SubmissionRow,
  TeamRow,
  UserListItem,
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

// --- Hackathons ---

export async function getHackathons() {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getHackathons:", error.message);
  return (data ?? []).map(hackathonToStored);
}

export async function getHackathon(id: string) {
  await ensureAuthReady();
  const { data, error } = await sb().from("hackathons").select("*").eq("id", id).single();
  if (error) console.error("[storage] getHackathon:", error.message);
  return data ? hackathonToStored(data) : null;
}

export async function saveHackathon(hackathon: import("@/lib/data-mappers").StoredHackathon) {
  await ensureAuthReady();
  const { error } = await sb()
    .from("hackathons")
    .upsert({
      id: hackathon.id,
      host_id: hackathon.host_id!,
      name: hackathon.name,
      problem_statements: hackathon.problem_statements,
      theme: hackathon.theme ?? null,
      is_exclusive: hackathon.is_exclusive ?? false,
      website_url: hackathon.website_url ?? null,
      technical_resources: (hackathon.technical_resources ?? []) as unknown as Json,
      technical_docs: hackathon.technical_docs ?? null,
      bounty_pool_summary: hackathon.bounty_pool_summary ?? null,
      program_goal: hackathon.program_goal ?? null,
      start_date: hackathon.start_date ?? null,
      submission_deadline: hackathon.submission_deadline ?? null,
      judging_deadline: hackathon.judging_deadline ?? null,
      results_date: hackathon.results_date ?? null,
      organizer_notes: hackathon.organizer_notes ?? null,
    })
    .select();
  if (error) throw new Error(`[storage] saveHackathon: ${error.message}`);
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
    return (
      data?.map((d) => (d as Record<string, unknown>).teams as TeamRow).filter(Boolean) ?? []
    ).map(teamToStored);
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
  const { data, error } = await sb().from("teams").select("*").eq("id", id).single();
  if (error) console.error("[storage] getTeam:", error.message);
  return data ? teamToStored(data) : null;
}

export async function saveTeam(team: {
  id?: string;
  name: string;
  owner_id: string;
  created_at?: string;
}) {
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
    const { error: memberError } = await sb()
      .from("team_members")
      .upsert(
        { team_id: data.id, user_id: data.owner_id, role: "owner" },
        { onConflict: "team_id,user_id" },
      );
    if (memberError) console.error("[storage] saveTeam member:", memberError.message);
  }
}

// --- Submissions ---

export async function submitProjectToHackathon(
  hackathonId: string,
  teamId: string,
  projectId: string,
) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("submissions")
    .upsert(
      {
        hackathon_id: hackathonId,
        team_id: teamId,
        project_id: projectId,
        status: "submitted" as SubmissionStatus,
      },
      { onConflict: "hackathon_id,project_id" },
    )
    .select()
    .single();
  if (error) console.error("[storage] submitProjectToHackathon:", error.message);
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

export async function getHackathonSubmissions(hackathonId: string) {
  await ensureAuthReady();
  const { data, error } = await sb()
    .from("submissions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getHackathonSubmissions:", error.message);
  return (data ?? []).map(submissionToStored);
}

/** Fetch multiple hackathons by IDs in a single query. */
export async function getHackathonsByIds(ids: string[]) {
  await ensureAuthReady();
  if (ids.length === 0) return {};
  const { data, error } = await sb().from("hackathons").select("*").in("id", ids);
  if (error) console.error("[storage] getHackathonsByIds:", error.message);
  const map: Record<string, import("@/lib/data-mappers").StoredHackathon> = {};
  (data ?? []).forEach((b) => {
    map[b.id] = hackathonToStored(b);
  });
  return map;
}

/** Fetch all submissions across multiple hackathons in a single query. */
export async function getSubmissionsForHackathons(hackathonIds: string[]) {
  await ensureAuthReady();
  if (hackathonIds.length === 0) return [];
  const { data, error } = await sb()
    .from("submissions")
    .select("*")
    .in("hackathon_id", hackathonIds)
    .order("created_at", { ascending: false });
  if (error) console.error("[storage] getSubmissionsForHackathons:", error.message);
  return (data ?? []).map(submissionToStored);
}

/** Fetch hackathon with its sponsor tracks from the hackathon_tracks table. */
export async function getHackathonWithTracks(id: string) {
  await ensureAuthReady();
  const { data: hackathon, error } = await sb()
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[storage] getHackathonWithTracks:", error.message);
  if (!hackathon) return null;

  const { data: tracks, error: tracksError } = await sb()
    .from("hackathon_tracks")
    .select("sponsor_name, track_description")
    .eq("hackathon_id", id);
  if (tracksError) console.error("[storage] getHackathonWithTracks tracks:", tracksError.message);

  const stored = hackathonToStored(hackathon);
  stored.sponsor_tracks = (tracks ?? []).map((t) => ({
    sponsor: t.sponsor_name,
    track_description: t.track_description ?? "",
  }));
  return stored;
}
