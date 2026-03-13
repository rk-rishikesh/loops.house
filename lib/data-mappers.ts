/**
 * Shared data mappers: DB rows ↔ StoredXxx shapes.
 *
 * Used by both lib/storage.ts (browser client) and lib/server-data.ts (server client).
 * Extracted so the same mapping logic isn't duplicated.
 */

import type { Database, Json } from "@/lib/supabase/types";
import type {
  ColorsJson,
  EvaluationScore,
  JudgingCriterionItem,
  LinkItem,
  TechnicalResourceItem,
} from "@/lib/types/json-schemas";
import { asJsonArray, asJsonObject } from "@/lib/types/json-schemas";

export type { Database };

// Re-export JSON schema types for convenience
export type { ColorsJson, LinkItem, TechnicalResourceItem, JudgingCriterionItem, EvaluationScore };

// Re-export enum types from the DB types
export type HackathonStatus = Database["public"]["Enums"]["hackathon_status"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
export type InvitationType = Database["public"]["Enums"]["invitation_type"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];

// --- Row type aliases ---

export type ProfileRow = Database["public"]["Tables"]["loops_profiles"]["Row"];
export type HackathonRow = Database["public"]["Tables"]["hackathons"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
export type HackathonCohostRow = Database["public"]["Tables"]["hackathon_cohosts"]["Row"];
export type HackathonJudgeRow = Database["public"]["Tables"]["hackathon_judges"]["Row"];

// --- Shared types for admin/host views ---

/** Subset of user columns for the admin user list */
export type UserListItem = Pick<
  UserRow,
  | "id"
  | "email"
  | "display_name"
  | "is_admin"
  | "is_event_creator"
  | "oauth_provider"
  | "created_at"
>;

// --- StoredXxx interfaces ---

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
  additional_links?: LinkItem[];
  social_links?: LinkItem[];
  created_at: string;
  knowledge_base_chunks?: number;
  kb_sections?: string[];
  flattened_codebase?: string;
}

export interface StoredHackathon {
  id: string;
  name: string;
  host_id?: string;
  status?: HackathonStatus;
  problem_statements: string[];
  theme?: string;
  description?: string;
  is_exclusive?: boolean;
  website_url?: string;
  technical_resources?: TechnicalResourceItem[];
  technical_docs?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
  organizer_notes?: string;
  sponsor_tracks?: { sponsor: string; track_description: string }[];
  judging_criteria?: JudgingCriterionItem[];
  finalized_at?: string | null;
  ai_weight?: number;
  created_at: string;
}

export interface StoredTeam {
  id: string;
  name: string;
  created_at: string;
}

export interface StoredSubmission {
  id: string;
  hackathon_id: string;
  team_id: string;
  project_id: string;
  status: SubmissionStatus;
  ai_score: EvaluationScore;
  ai_evaluated_at: string | null;
  momentum_score: number;
  created_at: string;
}

export type HumanEvaluationRow = Database["public"]["Tables"]["human_evaluations"]["Row"];

// --- Mapper functions ---

const EMPTY_COLORS: ColorsJson = {};

export function profileToStored(p: ProfileRow): StoredProject {
  const colors = asJsonObject<ColorsJson>(p.colors, EMPTY_COLORS);
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
    additional_links: asJsonArray<LinkItem>(p.additional_links) || undefined,
    social_links: asJsonArray<LinkItem>(p.social_links) || undefined,
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
    additional_links: (s.additional_links ?? []) as unknown as Json,
    social_links: (s.social_links ?? []) as unknown as Json,
    flattened_codebase: s.flattened_codebase ?? null,
    knowledge_base_chunks: s.knowledge_base_chunks ?? 0,
    kb_sections: s.kb_sections ?? [],
  };
}

export function hackathonToStored(b: HackathonRow): StoredHackathon {
  return {
    id: b.id,
    name: b.name,
    host_id: b.host_id,
    status: b.status,
    problem_statements: b.problem_statements ?? [],
    theme: b.theme ?? undefined,
    description: b.description ?? undefined,
    is_exclusive: b.is_exclusive ?? undefined,
    website_url: b.website_url ?? undefined,
    technical_resources: asJsonArray<TechnicalResourceItem>(b.technical_resources) || undefined,
    technical_docs: b.technical_docs ?? undefined,
    bounty_pool_summary: b.bounty_pool_summary ?? undefined,
    program_goal: b.program_goal ?? undefined,
    start_date: b.start_date ?? undefined,
    submission_deadline: b.submission_deadline ?? undefined,
    judging_deadline: b.judging_deadline ?? undefined,
    results_date: b.results_date ?? undefined,
    organizer_notes: b.organizer_notes ?? undefined,
    judging_criteria: asJsonArray<JudgingCriterionItem>(b.judging_criteria) || undefined,
    finalized_at: b.finalized_at ?? null,
    ai_weight: typeof b.ai_weight === "number" ? b.ai_weight : 0.5,
    created_at: b.created_at,
  };
}

export function teamToStored(t: TeamRow): StoredTeam {
  return { id: t.id, name: t.name, created_at: t.created_at };
}

export function submissionToStored(s: SubmissionRow): StoredSubmission {
  return {
    id: s.id,
    hackathon_id: s.hackathon_id,
    team_id: s.team_id,
    project_id: s.project_id,
    status: s.status,
    ai_score: asJsonObject<EvaluationScore>(s.ai_score, {}),
    ai_evaluated_at: s.ai_evaluated_at ?? null,
    momentum_score: Number(s.momentum_score ?? 0),
    created_at: s.created_at,
  };
}

// --- Hackathon Speaker / Result types & mappers ---

import type { HackathonResultRow, HackathonSpeakerRow } from "@/lib/supabase/types";

export interface StoredSpeaker {
  id: string;
  hackathon_id: string;
  name: string;
  image_url?: string | null;
  created_at: string;
}

export interface StoredResult {
  id: string;
  hackathon_id: string;
  submission_id: string;
  project_id: string;
  rank: number;
  final_score: number;
  ai_score_weighted: number;
  judge_score_weighted: number;
  raw_ai_score: number;
  raw_judge_avg_score: number;
  created_at: string;
}

export function speakerToStored(s: HackathonSpeakerRow): StoredSpeaker {
  return {
    id: s.id,
    hackathon_id: s.hackathon_id,
    name: s.name,
    image_url: s.image_url,
    created_at: s.created_at ?? new Date().toISOString(),
  };
}

export function resultToStored(r: HackathonResultRow): StoredResult {
  return {
    id: r.id,
    hackathon_id: r.hackathon_id,
    submission_id: r.submission_id,
    project_id: r.project_id,
    rank: r.rank,
    final_score: Number(r.final_score),
    ai_score_weighted: Number(r.ai_score_weighted),
    judge_score_weighted: Number(r.judge_score_weighted),
    raw_ai_score: Number(r.raw_ai_score),
    raw_judge_avg_score: Number(r.raw_judge_avg_score),
    created_at: r.created_at ?? new Date().toISOString(),
  };
}
