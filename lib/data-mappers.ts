/**
 * Shared data mappers: DB rows ↔ legacy StoredXxx shapes.
 *
 * Used by both lib/storage.ts (browser client) and lib/server-data.ts (server client).
 * Extracted so the same mapping logic isn't duplicated.
 */

import type { Database } from "@/lib/supabase/types";

export type { Database };

// Re-export BoosterType from the DB types
export type BoosterType = Database["public"]["Enums"]["booster_type"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

// --- Row type aliases ---

export type ProfileRow = Database["public"]["Tables"]["loops_profiles"]["Row"];
export type BoosterRow = Database["public"]["Tables"]["boosters"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];

// --- Legacy-compatible interfaces ---

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
  judging_criteria?: { name: string; description: string }[];
  created_at: string;
}

export interface StoredTeam {
  id: string;
  name: string;
  created_at: string;
}

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

// --- Mapper functions ---

export function profileToStored(p: ProfileRow): StoredProject {
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

export function storedToProfileInsert(s: StoredProject) {
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

export function boosterToStored(b: BoosterRow): StoredBooster {
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
    judging_criteria: b.judging_criteria as { name: string; description: string }[] | undefined,
    created_at: b.created_at,
  };
}

export function teamToStored(t: TeamRow): StoredTeam {
  return { id: t.id, name: t.name, created_at: t.created_at };
}

export function submissionToStored(s: SubmissionRow): StoredSubmission {
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
