/**
 * Server-side data fetching layer.
 *
 * Mirrors lib/storage.ts API but uses the server Supabase client.
 * Import this in server components instead of lib/storage.ts.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import {
  profileToStored,
  hackathonToStored,
  teamToStored,
  submissionToStored,
} from "@/lib/data-mappers";
import type {
  StoredProject,
  StoredHackathon,
  StoredTeam,
  StoredSubmission,
  TeamRow,
} from "@/lib/data-mappers";

// Re-export types for convenience
export type { StoredProject, StoredHackathon, StoredTeam, StoredSubmission };

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

export async function getProjectServer(
  projectId: string,
): Promise<StoredProject | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("loops_profiles")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) console.error("[server-data] getProjectServer:", error.message);
  return data ? profileToStored(data) : null;
}

// --- Hackathons ---

export async function getHackathonsServer(): Promise<StoredHackathon[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getHackathonsServer:", error.message);
  return (data ?? []).map(hackathonToStored);
}

export async function getHackathonServer(
  id: string,
): Promise<StoredHackathon | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("[server-data] getHackathonServer:", error.message);
  return data ? hackathonToStored(data) : null;
}

export async function getHackathonWithTracksServer(
  id: string,
): Promise<StoredHackathon | null> {
  const supabase = await createServerSupabase();
  const { data: hackathon, error } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    console.error("[server-data] getHackathonWithTracksServer:", error.message);
  if (!hackathon) return null;

  const { data: tracks, error: tracksError } = await supabase
    .from("hackathon_tracks")
    .select("sponsor_name, track_description")
    .eq("hackathon_id", id);
  if (tracksError)
    console.error(
      "[server-data] getHackathonWithTracksServer tracks:",
      tracksError.message,
    );

  const stored = hackathonToStored(hackathon);
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
    if (error)
      console.error("[server-data] getTeamsServer(userId):", error.message);
    return (
      data
        ?.map((d) => (d as Record<string, unknown>).teams as TeamRow)
        .filter(Boolean) ?? []
    ).map(teamToStored);
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

// --- Team members ---

export type TeamMemberInfo = {
  user_id: string;
  role: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function getTeamMembersServer(
  teamId: string,
): Promise<TeamMemberInfo[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("team_members")
    .select("user_id, role, users(id, email, display_name, avatar_url)")
    .eq("team_id", teamId);
  if (error)
    console.error("[server-data] getTeamMembersServer:", error.message);
  return (data ?? []).map((m) => {
    const u = (m as Record<string, unknown>).users as {
      id: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
    return {
      user_id: m.user_id,
      role: m.role,
      email: u?.email ?? "",
      display_name: u?.display_name ?? null,
      avatar_url: u?.avatar_url ?? null,
    };
  });
}

export async function getTeamOwnerServer(
  teamId: string,
): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();
  return data?.owner_id ?? null;
}

// --- Submissions ---

export async function getSubmissionsServer(
  hackathonId: string,
): Promise<StoredSubmission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: false });
  if (error)
    console.error("[server-data] getSubmissionsServer:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getSubmissionServer(
  hackathonId: string,
  projectId: string,
): Promise<StoredSubmission | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) console.error("[server-data] getSubmissionServer:", error.message);
  return data ? submissionToStored(data) : null;
}

export async function getSubmissionsForHackathonsServer(
  hackathonIds: string[],
): Promise<StoredSubmission[]> {
  if (hackathonIds.length === 0) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .in("hackathon_id", hackathonIds)
    .order("created_at", { ascending: false });
  if (error)
    console.error(
      "[server-data] getSubmissionsForHackathonsServer:",
      error.message,
    );
  return (data ?? []).map(submissionToStored);
}

export async function getProjectSubmissionsServer(
  projectId: string,
): Promise<StoredSubmission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error)
    console.error("[server-data] getProjectSubmissionsServer:", error.message);
  return (data ?? []).map(submissionToStored);
}

export async function getHackathonsByIdsServer(
  ids: string[],
): Promise<Record<string, StoredHackathon>> {
  if (ids.length === 0) return {};
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .in("id", ids);
  if (error)
    console.error("[server-data] getHackathonsByIdsServer:", error.message);
  const map: Record<string, StoredHackathon> = {};
  (data ?? []).forEach((b) => {
    map[b.id] = hackathonToStored(b);
  });
  return map;
}
