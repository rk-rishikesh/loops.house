"use server";

/**
 * Server Actions for mutations.
 *
 * Each action: authenticate → validate with Zod → mutate via server client → revalidatePath.
 * Returns ActionResult<T> so client components can display success/error.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { storedToProfileInsert } from "@/lib/data-mappers";
import type { StoredProject } from "@/lib/data-mappers";
import type { AppRole, Database, Json, SubmissionStatus, HostApplicationStatus } from "@/lib/supabase/types";
import {
  createTeamSchema,
  hostApplicationCreateSchema,
  hostApplicationReviewSchema,
  adminRoleUpdateSchema,
} from "@/lib/validations/schemas";

// --- Result type ---

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// --- Auth helper ---

async function getAuthUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { id: user.id, role: profile.role as AppRole };
}

// --- Project actions ---

export async function saveProjectAction(
  project: StoredProject,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const payload = storedToProfileInsert(project);
  const supabase = await createServerSupabase();

  if (project.project_id) {
    const { id: _id, ...updates } = payload as typeof payload & { id?: string };
    const { error } = await supabase
      .from("loops_profiles")
      .upsert({ id: project.project_id, ...updates })
      .select();
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("loops_profiles")
      .insert(payload)
      .select();
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/builder/projects");
  revalidatePath("/viewer");
  return { success: true, data: undefined };
}

export async function removeProjectAction(
  projectId: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("loops_profiles")
    .delete()
    .eq("id", projectId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/builder/projects");
  return { success: true, data: undefined };
}

// --- Booster actions ---

export async function saveBoosterAction(
  booster: {
    id: string;
    name: string;
    problem_statements: string[];
    theme?: string;
    booster_type?: string;
    website_url?: string;
    technical_resources?: { url: string; description: string }[];
    technical_docs?: string;
    bounty_pool_summary?: string;
    program_goal?: string;
    timeline?: string;
    organizer_notes?: string;
  },
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !["host", "admin"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("boosters")
    .upsert({
      id: booster.id,
      host_id: user.id,
      name: booster.name,
      problem_statements: booster.problem_statements,
      theme: booster.theme ?? null,
      booster_type: (booster.booster_type ?? "idea") as "idea" | "momentum" | "capital",
      website_url: booster.website_url ?? null,
      technical_resources: booster.technical_resources ?? [],
      technical_docs: booster.technical_docs ?? null,
      bounty_pool_summary: booster.bounty_pool_summary ?? null,
      program_goal: booster.program_goal ?? null,
      timeline: booster.timeline ?? null,
      organizer_notes: booster.organizer_notes ?? null,
    })
    .select();
  if (error) return { success: false, error: error.message };

  revalidatePath("/host");
  revalidatePath("/boosters");
  return { success: true, data: undefined };
}

// --- Team actions ---

export async function saveTeamAction(
  data: { name: string },
): Promise<ActionResult<{ id: string; name: string }>> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = createTeamSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name: parsed.data.name, owner_id: user.id })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  // Auto-add owner as member
  if (team) {
    await supabase.from("team_members").upsert(
      { team_id: team.id, user_id: user.id, role: "owner" },
      { onConflict: "team_id,user_id" },
    );
  }

  revalidatePath("/builder/teams");
  return { success: true, data: { id: team.id, name: team.name } };
}

// --- Submission actions ---

export async function submitProjectAction(
  boosterId: string,
  teamId: string,
  projectId: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createServerSupabase();
  const { error } = await supabase
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
  if (error) return { success: false, error: error.message };

  revalidatePath("/host");
  revalidatePath("/boosters");
  return { success: true, data: undefined };
}

// --- Host application actions ---

export async function submitHostApplicationAction(
  data: {
    booster_type: string;
    event_name: string;
    expected_participants?: number;
    contact?: string;
    description?: string;
  },
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = hostApplicationCreateSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabaseAdmin
    .from("host_applications")
    .insert({
      user_id: user.id,
      booster_type: parsed.data.booster_type,
      event_name: parsed.data.event_name,
      expected_participants: parsed.data.expected_participants ?? null,
      contact: parsed.data.contact ?? null,
      description: parsed.data.description ?? null,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/applications");
  return { success: true, data: undefined };
}

// --- Admin actions ---

export async function updateUserRoleAction(
  userId: string,
  role: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return { success: false, error: "Unauthorized" };

  const parsed = adminRoleUpdateSchema.safeParse({ user_id: userId, role });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.user_id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function reviewHostApplicationAction(
  id: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return { success: false, error: "Unauthorized" };

  const parsed = hostApplicationReviewSchema.safeParse({ id, status });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data: app, error } = await supabaseAdmin
    .from("host_applications")
    .update({ status: parsed.data.status as HostApplicationStatus, reviewed_by: user.id })
    .eq("id", parsed.data.id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  // If approved, elevate user to host role
  if (parsed.data.status === "approved" && app) {
    await supabaseAdmin
      .from("users")
      .update({ role: "host" })
      .eq("id", app.user_id);
  }

  revalidatePath("/admin/applications");
  return { success: true, data: undefined };
}

// --- Evaluation actions ---

export async function saveEvaluationAction(
  data: {
    project_id: string;
    booster_id: string;
    ai_score?: Record<string, unknown>;
    human_score?: Record<string, unknown>;
    status?: string;
  },
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !["host", "judge", "admin"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  if (!data.project_id || !data.booster_id) {
    return { success: false, error: "project_id and booster_id are required" };
  }

  const updates: Database["public"]["Tables"]["submissions"]["Update"] = {};
  if (data.ai_score !== undefined) updates.ai_score = data.ai_score as Json;
  if (data.human_score !== undefined) updates.human_score = data.human_score as Json;
  if (data.status !== undefined) updates.status = data.status as SubmissionStatus;

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  const { error } = await supabaseAdmin
    .from("submissions")
    .update(updates)
    .eq("project_id", data.project_id)
    .eq("booster_id", data.booster_id)
    .select()
    .maybeSingle();
  if (error) return { success: false, error: error.message };

  revalidatePath("/host/judging");
  return { success: true, data: undefined };
}
