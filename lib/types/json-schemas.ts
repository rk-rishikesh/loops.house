/**
 * Typed schemas for Supabase JSON columns.
 *
 * These replace the generic `Json` type on columns with known shapes,
 * giving components real type safety without runtime validation overhead.
 */

import type { Json } from "@/lib/supabase/types";

// --- loops_profiles.colors ---

export interface ColorsJson {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  theme_label?: string | null;
}

// --- loops_profiles.additional_links / social_links ---

export interface LinkItem {
  label: string;
  url: string;
}

// --- hackathons.technical_resources ---

export interface TechnicalResourceItem {
  url: string;
  description: string;
}

// --- hackathons.judging_criteria ---

export interface JudgingCriterionItem {
  name: string;
  description: string;
}

// --- submissions.ai_score / human_score ---

export interface CriterionScoreDetail {
  score: number;
  reasoning?: string;
}

export interface EvaluationScore {
  [criterionName: string]: number | string | CriterionScoreDetail;
}

// --- Narrowing helpers ---

/** Safely narrow a `Json | null` value to a typed array. */
export function asJsonArray<T>(val: Json | null, fallback: T[] = []): T[] {
  return Array.isArray(val) ? (val as unknown as T[]) : fallback;
}

/** Safely narrow a `Json | null` value to a typed object. */
export function asJsonObject<T>(val: Json | null, fallback: T): T {
  return val && typeof val === "object" && !Array.isArray(val) ? (val as unknown as T) : fallback;
}
