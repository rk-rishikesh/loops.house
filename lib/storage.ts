/**
 * Storage abstraction layer.
 *
 * Delegates to Supabase via lib/db/*.
 * Exports keep the same names so existing page imports continue to work,
 * but all functions are now async.
 *
 * Legacy interfaces (StoredProject, StoredBooster, StoredTeam) are
 * maintained as type aliases mapping to the DB row shapes for smooth migration.
 */

import { createClient } from "@/lib/supabase/client";
import type { Database, Json, BoosterType as DBBoosterType, SubmissionStatus } from "@/lib/supabase/types";

// Re-export BoosterType from the DB types
export type BoosterType = DBBoosterType;

// --- Legacy-compatible interfaces (used across all pages) ---

export interface StoredProject {
  project_id: string;
  team_id?: string;
  name: string;
  tagline?: string;
  category?: string;
  description?: string;
  refined_description?: string;
  tech_stack_tags?: string[];
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  theme_label?: string;
  key_features?: string[];
  logo_url?: string;
  website_url?: string;
  github_url?: string;
  youtube_url?: string;
  screenshot_urls?: string[];
  additional_links?: { label: string; url: string }[];
  social_links?: { label: string; url: string }[];
  created_at: string;
  knowledge_base_chunks?: number;
  kb_sections?: string[];
  flattened_codebase?: string;
  [key: string]: unknown;
}

export interface StoredBooster {
  id: string;
  name: string;
  problem_statements: string[];
  theme?: string;
  booster_type?: BoosterType;
  website_url?: string;
  technical_resources?: { url: string; description: string }[];
  technical_docs?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  timeline?: string;
  organizer_notes?: string;
  sponsor_tracks?: { sponsor: string; track_description: string }[];
  created_at: string;
}

export interface StoredTeam {
  id: string;
  name: string;
  created_at: string;
}

// --- Helpers: map DB rows ↔ legacy shapes ---

type ProfileRow = Database["public"]["Tables"]["loops_profiles"]["Row"];
type BoosterRow = Database["public"]["Tables"]["boosters"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];

function profileToStored(p: ProfileRow): StoredProject {
  const colors = (p.colors ?? {}) as Record<string, string>;
  return {
    project_id: p.id,
    team_id: p.team_id,
    name: p.name,
    tagline: p.tagline ?? undefined,
    category: p.category ?? undefined,
    description: p.description ?? undefined,
    refined_description: p.refined_description ?? undefined,
    tech_stack_tags: p.tech_stack ?? undefined,
    primary_color: colors.primary_color ?? undefined,
    secondary_color: colors.secondary_color ?? undefined,
    accent_color: colors.accent_color ?? undefined,
    theme_label: colors.theme_label ?? undefined,
    key_features: p.key_features ?? undefined,
    logo_url: p.logo_url ?? undefined,
    website_url: p.website_url ?? undefined,
    github_url: p.github_url ?? undefined,
    youtube_url: p.youtube_url ?? undefined,
    screenshot_urls: p.screenshot_urls ?? undefined,
    additional_links: p.additional_links as { label: string; url: string }[] | undefined,
    social_links: p.social_links as { label: string; url: string }[] | undefined,
    created_at: p.created_at,
    knowledge_base_chunks: p.knowledge_base_chunks ?? undefined,
    kb_sections: p.kb_sections ?? undefined,
    flattened_codebase: p.flattened_codebase ?? undefined,
  };
}

function storedToProfileInsert(s: StoredProject) {
  return {
    ...(s.project_id ? { id: s.project_id } : {}),
    team_id: s.team_id!,
    name: s.name,
    tagline: s.tagline ?? null,
    category: s.category ?? null,
    description: s.description ?? null,
    refined_description: s.refined_description ?? null,
    tech_stack: s.tech_stack_tags ?? [],
    colors: {
      primary_color: s.primary_color ?? null,
      secondary_color: s.secondary_color ?? null,
      accent_color: s.accent_color ?? null,
      theme_label: s.theme_label ?? null,
    },
    key_features: s.key_features ?? [],
    logo_url: s.logo_url ?? null,
    website_url: s.website_url ?? null,
    github_url: s.github_url ?? null,
    youtube_url: s.youtube_url ?? null,
    screenshot_urls: s.screenshot_urls ?? [],
    additional_links: s.additional_links ?? [],
    social_links: s.social_links ?? [],
    flattened_codebase: s.flattened_codebase ?? null,
    knowledge_base_chunks: s.knowledge_base_chunks ?? 0,
    kb_sections: s.kb_sections ?? [],
  };
}

function boosterToStored(b: BoosterRow): StoredBooster {
  return {
    id: b.id,
    name: b.name,
    problem_statements: b.problem_statements ?? [],
    theme: b.theme ?? undefined,
    booster_type: b.booster_type,
    website_url: b.website_url ?? undefined,
    technical_resources: b.technical_resources as { url: string; description: string }[] | undefined,
    technical_docs: b.technical_docs ?? undefined,
    bounty_pool_summary: b.bounty_pool_summary ?? undefined,
    program_goal: b.program_goal ?? undefined,
    timeline: b.timeline ?? undefined,
    organizer_notes: b.organizer_notes ?? undefined,
    created_at: b.created_at,
  };
}

function teamToStored(t: TeamRow): StoredTeam {
  return { id: t.id, name: t.name, created_at: t.created_at };
}

// --- Supabase client ---

function sb() {
  return createClient();
}

let authInit: Promise<void> | null = null;
async function ensureAuthReady() {
  // Storage is primarily used from client components.
  // Ensure Supabase has loaded the persisted session before queries run,
  // otherwise RLS-protected tables can appear "empty" until a hard refresh.
  if (typeof window === "undefined") return;
  const client = sb();
  if (!authInit) {
    authInit = client.auth.getSession().then(() => undefined);
  }
  await authInit;
}

// --- Projects ---

export async function getProjects(): Promise<StoredProject[]> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("loops_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(profileToStored);
}

export async function getProject(projectId: string): Promise<StoredProject | null> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("loops_profiles")
    .select("*")
    .eq("id", projectId)
    .single();
  return data ? profileToStored(data) : null;
}

export async function saveProject(project: StoredProject): Promise<void> {
  await ensureAuthReady();
  const payload = storedToProfileInsert(project);
  if (project.project_id) {
    const { id: _id, ...updates } = payload as typeof payload & { id?: string };
    await sb()
      .from("loops_profiles")
      .upsert({ id: project.project_id, ...updates })
      .select();
  } else {
    await sb().from("loops_profiles").insert(payload).select();
  }
}

export async function removeProject(projectId: string): Promise<void> {
  await ensureAuthReady();
  await sb().from("loops_profiles").delete().eq("id", projectId);
}

// --- Boosters ---

export async function getBoosters(): Promise<StoredBooster[]> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("boosters")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(boosterToStored);
}

export async function getBooster(id: string): Promise<StoredBooster | null> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  return data ? boosterToStored(data) : null;
}

export async function saveBooster(booster: StoredBooster & { host_id?: string }): Promise<void> {
  await ensureAuthReady();
  await sb()
    .from("boosters")
    .upsert({
      id: booster.id,
      host_id: booster.host_id ?? "",
      name: booster.name,
      problem_statements: booster.problem_statements,
      theme: booster.theme ?? null,
      booster_type: booster.booster_type ?? "idea",
      website_url: booster.website_url ?? null,
      technical_resources: (booster.technical_resources ?? []) as Json,
      technical_docs: booster.technical_docs ?? null,
      bounty_pool_summary: booster.bounty_pool_summary ?? null,
      program_goal: booster.program_goal ?? null,
      timeline: booster.timeline ?? null,
      organizer_notes: booster.organizer_notes ?? null,
    })
    .select();
}

// --- Teams ---

export async function getTeams(userId?: string): Promise<StoredTeam[]> {
  await ensureAuthReady();
  if (userId) {
    const { data } = await sb()
      .from("team_members")
      .select("teams(*)")
      .eq("user_id", userId);
    return (data?.map((d) => (d as Record<string, unknown>).teams as TeamRow).filter(Boolean) ?? []).map(teamToStored);
  }
  const { data } = await sb()
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(teamToStored);
}

export async function getTeam(id: string): Promise<StoredTeam | null> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();
  return data ? teamToStored(data) : null;
}

export async function saveTeam(team: { id?: string; name: string; owner_id: string; created_at?: string }): Promise<void> {
  await ensureAuthReady();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { name: team.name, owner_id: team.owner_id };
  if (team.id) payload.id = team.id;

  const { data } = await sb()
    .from("teams")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  // Auto-add owner as member
  if (data) {
    await sb().from("team_members").upsert(
      { team_id: data.id, user_id: data.owner_id, role: "owner" },
      { onConflict: "team_id,user_id" },
    );
  }
}

// --- Submissions ---

export interface StoredSubmission {
  id: string;
  booster_id: string;
  team_id: string;
  project_id: string;
  status: SubmissionStatus;
  ai_score: Record<string, unknown>;
  human_score: Record<string, unknown>;
  momentum_score: number;
  created_at: string;
}

function submissionToStored(s: SubmissionRow): StoredSubmission {
  return {
    id: s.id,
    booster_id: s.booster_id,
    team_id: s.team_id,
    project_id: s.project_id,
    status: s.status,
    ai_score: (s.ai_score ?? {}) as Record<string, unknown>,
    human_score: (s.human_score ?? {}) as Record<string, unknown>,
    momentum_score: Number(s.momentum_score ?? 0),
    created_at: s.created_at,
  };
}

export async function submitProjectToBooster(
  boosterId: string,
  teamId: string,
  projectId: string,
): Promise<StoredSubmission | null> {
  await ensureAuthReady();
  const { data } = await sb()
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
  return data ? submissionToStored(data) : null;
}

export async function getProjectSubmissions(projectId: string): Promise<StoredSubmission[]> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(submissionToStored);
}

export async function getBoosterSubmissions(boosterId: string): Promise<StoredSubmission[]> {
  await ensureAuthReady();
  const { data } = await sb()
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(submissionToStored);
}

/** Fetch multiple boosters by IDs in a single query. */
export async function getBoostersByIds(ids: string[]): Promise<Record<string, StoredBooster>> {
  await ensureAuthReady();
  if (ids.length === 0) return {};
  const { data } = await sb()
    .from("boosters")
    .select("*")
    .in("id", ids);
  const map: Record<string, StoredBooster> = {};
  (data ?? []).forEach((b) => { map[b.id] = boosterToStored(b); });
  return map;
}

/** Fetch all submissions across multiple boosters in a single query. */
export async function getSubmissionsForBoosters(boosterIds: string[]): Promise<StoredSubmission[]> {
  await ensureAuthReady();
  if (boosterIds.length === 0) return [];
  const { data } = await sb()
    .from("submissions")
    .select("*")
    .in("booster_id", boosterIds)
    .order("created_at", { ascending: false });
  return (data ?? []).map(submissionToStored);
}

/** Fetch booster with its sponsor tracks from the booster_tracks table. */
export async function getBoosterWithTracks(id: string): Promise<StoredBooster | null> {
  await ensureAuthReady();
  const { data: booster } = await sb()
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  if (!booster) return null;

  const { data: tracks } = await sb()
    .from("booster_tracks")
    .select("sponsor_name, track_description")
    .eq("booster_id", id);

  const stored = boosterToStored(booster);
  stored.sponsor_tracks = (tracks ?? []).map((t) => ({
    sponsor: t.sponsor_name,
    track_description: t.track_description ?? "",
  }));
  return stored;
}
