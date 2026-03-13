"use server";

/**
 * Server Actions for mutations.
 *
 * Each action: authenticate → validate with Zod → mutate via server client → revalidatePath.
 * Returns ActionResult<T> so client components can display success/error.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { z } from "zod";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import type { StoredProject } from "@/lib/data-mappers";
import { storedToProfileInsert } from "@/lib/data-mappers";
import { saveResults } from "@/lib/db/hackathon-results";
import { addSpeaker, removeSpeaker, updateSpeaker } from "@/lib/db/hackathon-speakers";
import { computePhase } from "@/lib/hackathon-phase";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database, Json, SubmissionStatus } from "@/lib/supabase/types";
import {
  addSpeakerSchema,
  createInvitationSchema,
  createTeamSchema,
  editHackathonSchema,
  finalizeHackathonSchema,
  respondInvitationSchema,
  updateSpeakerSchema,
} from "@/lib/validations/schemas";

// --- Result type ---

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

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
    .select("is_admin, is_event_creator")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    isAdmin: profile.is_admin,
    isEventCreator: profile.is_event_creator,
  };
}

// --- Project actions ---

export async function saveProjectAction(project: StoredProject): Promise<ActionResult> {
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
    const { error } = await supabase.from("loops_profiles").insert(payload).select();
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/builder/projects");
  revalidatePath("/projects");
  return { success: true, data: undefined };
}

export async function removeProjectAction(projectId: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("loops_profiles").delete().eq("id", projectId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/builder/projects");
  return { success: true, data: undefined };
}

// --- Hackathon actions ---

export async function saveHackathonAction(hackathon: {
  id: string;
  name: string;
  problem_statements: string[];
  theme?: string;
  is_exclusive?: boolean;
  website_url?: string;
  technical_resources?: { url: string; description: string }[];
  technical_docs?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
  organizer_notes?: string;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // For new hackathons, user must be event_creator or admin
  // For existing hackathons, user must be host, cohost, or admin
  const { data: existing } = await supabaseAdmin
    .from("hackathons")
    .select("host_id")
    .eq("id", hackathon.id)
    .maybeSingle();

  if (existing) {
    // Updating existing — check host, cohost, or admin
    if (existing.host_id !== user.id && !user.isAdmin) {
      const { data: cohost } = await supabaseAdmin
        .from("hackathon_cohosts")
        .select("user_id")
        .eq("hackathon_id", hackathon.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cohost) return { success: false, error: "Unauthorized" };
    }
  } else {
    // Creating new hackathon
    // We allow any authenticated user to start as a host
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("hackathons")
    .upsert({
      id: hackathon.id,
      host_id: existing?.host_id ?? user.id,
      name: hackathon.name,
      problem_statements: hackathon.problem_statements,
      theme: hackathon.theme ?? null,
      is_exclusive: hackathon.is_exclusive ?? false,
      website_url: hackathon.website_url ?? null,
      technical_resources: hackathon.technical_resources ?? [],
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
  if (error) return { success: false, error: error.message };

  // Auto-add creator as cohost on new hackathon
  if (!existing) {
    await supabaseAdmin
      .from("hackathon_cohosts")
      .upsert(
        { hackathon_id: hackathon.id, user_id: user.id },
        { onConflict: "hackathon_id,user_id" },
      );
  }

  revalidatePath("/host");
  revalidatePath("/hackathons");
  return { success: true, data: undefined };
}

// --- Team actions ---

export async function saveTeamAction(data: {
  name: string;
}): Promise<ActionResult<{ id: string; name: string }>> {
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
    await supabase
      .from("team_members")
      .upsert(
        { team_id: team.id, user_id: user.id, role: "owner" },
        { onConflict: "team_id,user_id" },
      );
  }

  revalidatePath("/builder/teams");
  return { success: true, data: { id: team.id, name: team.name } };
}

// --- Team member actions ---

export async function addTeamMemberAction(
  teamId: string,
  email: string,
): Promise<ActionResult<{ user_id: string; email: string; display_name: string | null }>> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Verify caller is team owner
  const supabase = await createServerSupabase();
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if (!team || team.owner_id !== user.id) {
    return { success: false, error: "Only the team owner can add members" };
  }

  // Look up user by email
  const { data: targetUser } = await supabaseAdmin
    .from("users")
    .select("id, email, display_name")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (!targetUser) {
    return { success: false, error: "No user found with that email" };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", targetUser.id)
    .maybeSingle();
  if (existing) {
    return { success: false, error: "User is already a team member" };
  }

  // Add as member
  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: targetUser.id, role: "member" });
  if (error) return { success: false, error: error.message };

  revalidatePath("/builder/projects");
  return {
    success: true,
    data: {
      user_id: targetUser.id,
      email: targetUser.email,
      display_name: targetUser.display_name,
    },
  };
}

export async function removeTeamMemberAction(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Verify caller is team owner
  const supabase = await createServerSupabase();
  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single();
  if (!team || team.owner_id !== user.id) {
    return { success: false, error: "Only the team owner can remove members" };
  }

  // Cannot remove owner
  if (userId === team.owner_id) {
    return { success: false, error: "Cannot remove the team owner" };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/builder/projects");
  return { success: true, data: undefined };
}

// --- Submission actions ---

export async function submitProjectAction(
  hackathonId: string,
  teamId: string,
  projectId: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Phase-gate: submissions only allowed during building phase
  const { data: hackathon } = await supabaseAdmin
    .from("hackathons")
    .select("start_date, submission_deadline, results_date, finalized_at")
    .eq("id", hackathonId)
    .single();
  if (!hackathon) return { success: false, error: "Hackathon not found" };
  const phase = computePhase(hackathon);
  if (phase !== "building") {
    return { success: false, error: "Submissions are only accepted during the building phase" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
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
  if (error) return { success: false, error: error.message };

  revalidatePath("/host");
  revalidatePath("/hackathons");
  return { success: true, data: undefined };
}

// --- Evaluation actions ---

export async function saveHumanEvaluationAction(data: {
  project_id: string;
  hackathon_id: string;
  scores: Record<string, number>;
  remarks: Record<string, string>;
  overall_notes: string;
  overall_score: number;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!data.project_id || !data.hackathon_id) {
    return { success: false, error: "project_id and hackathon_id are required" };
  }

  // Verify user is a judge for this hackathon
  const { data: judgeRow } = await supabaseAdmin
    .from("hackathon_judges")
    .select("user_id")
    .eq("hackathon_id", data.hackathon_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!judgeRow && !user.isAdmin) {
    return { success: false, error: "You are not a judge for this hackathon" };
  }

  // Get submission id
  const { data: submission } = await supabaseAdmin
    .from("submissions")
    .select("id")
    .eq("project_id", data.project_id)
    .eq("hackathon_id", data.hackathon_id)
    .maybeSingle();

  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const { error } = await supabaseAdmin.from("human_evaluations").upsert(
    {
      submission_id: submission.id,
      judge_id: user.id,
      hackathon_id: data.hackathon_id,
      scores: data.scores as unknown as Json,
      remarks: data.remarks as unknown as Json,
      overall_notes: data.overall_notes || null,
      overall_score: data.overall_score,
    },
    { onConflict: "submission_id,judge_id" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/judge");
  return { success: true, data: undefined };
}

// --- Invitation actions ---

export async function createInvitationAction(data: {
  type: string;
  email: string;
  hackathon_id?: string;
  project_id?: string;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = createInvitationSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    console.error(
      "[createInvitationAction] validation failed:",
      JSON.stringify({ path: issue.path, message: issue.message, received: data }),
    );
    return { success: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }

  const { type, email, hackathon_id, project_id } = parsed.data;

  if (type === "event_host" && !user.isAdmin) {
    return { success: false, error: "Only admins can invite event hosts" };
  }

  if (type === "cohost") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return { success: false, error: "Hackathon not found" };
    if (hackathon.host_id !== user.id && !user.isAdmin) {
      return { success: false, error: "Only the event creator or admin can add cohosts" };
    }
  }

  if (type === "judge") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return { success: false, error: "Hackathon not found" };
    if (hackathon.host_id !== user.id && !user.isAdmin) {
      const { data: cohost } = await supabaseAdmin
        .from("hackathon_cohosts")
        .select("user_id")
        .eq("hackathon_id", hackathon_id!)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cohost)
        return { success: false, error: "Only host, cohost, or admin can invite judges" };
    }
  }

  if (type === "project_member") {
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (!project) return { success: false, error: "Project not found" };
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("owner_id")
      .eq("id", project.team_id)
      .single();
    if (!team || (team.owner_id !== user.id && !user.isAdmin)) {
      return { success: false, error: "Only the project owner or admin can invite members" };
    }
  }

  const insertPayload = {
    type: type as Database["public"]["Enums"]["invitation_type"],
    email,
    invited_by: user.id,
    hackathon_id: hackathon_id ?? null,
    project_id: project_id ?? null,
  };

  const { error } = await supabaseAdmin.from("invitations").insert(insertPayload);

  if (error) {
    console.error(
      "[createInvitationAction] insert failed:",
      error.message,
      "payload:",
      JSON.stringify(insertPayload),
    );
    return { success: false, error: error.message };
  }

  // TODO: Send email notification to invitee using Resend
  revalidatePath("/notifications");
  revalidatePath("/host");
  return { success: true, data: undefined };
}

export async function respondToInvitationAction(data: {
  invitation_id: string;
  accept: boolean;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = respondInvitationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Fetch invitation
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("id", parsed.data.invitation_id)
    .eq("status", "pending")
    .single();

  if (fetchError || !invitation)
    return { success: false, error: "Invitation not found or already resolved" };

  // Verify this user's email matches the invitation
  if (invitation.email !== user.email) {
    return { success: false, error: "This invitation is not for you" };
  }

  // Verify the inviter still has permission
  const inviterValid = await verifyInviterStillAuthorized(invitation);
  if (!inviterValid) {
    await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);
    return {
      success: false,
      error: "The person who invited you no longer has permission. Invitation removed.",
    };
  }

  if (!parsed.data.accept) {
    // Reject — delete the invitation
    await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);
    revalidatePath("/notifications");
    return { success: true, data: undefined };
  }

  // Accept — apply the role change, then delete invitation
  const { type, hackathon_id, project_id } = invitation;

  if (type === "event_host") {
    await supabaseAdmin.from("users").update({ is_event_creator: true }).eq("id", user.id);
  } else if (type === "cohost") {
    await supabaseAdmin
      .from("hackathon_cohosts")
      .upsert(
        { hackathon_id: hackathon_id!, user_id: user.id },
        { onConflict: "hackathon_id,user_id" },
      );
  } else if (type === "judge") {
    await supabaseAdmin
      .from("hackathon_judges")
      .upsert(
        { hackathon_id: hackathon_id!, user_id: user.id },
        { onConflict: "hackathon_id,user_id" },
      );
  } else if (type === "project_member") {
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (project) {
      await supabaseAdmin
        .from("team_members")
        .upsert(
          { team_id: project.team_id, user_id: user.id, role: "member" },
          { onConflict: "team_id,user_id" },
        );
    }
  }

  // Delete the invitation after acceptance
  await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);

  // Clear capabilities cookies so middleware recalculates from DB on next request
  const cookieStore = await cookies();
  cookieStore.delete("x-user-caps");
  cookieStore.delete("x-user-caps-hint");

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

/** Verify the inviter still holds the capability that authorized the invitation */
async function verifyInviterStillAuthorized(invitation: {
  type: string;
  invited_by: string;
  hackathon_id: string | null;
  project_id: string | null;
}): Promise<boolean> {
  const { type, invited_by, hackathon_id, project_id } = invitation;

  if (type === "event_host") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return data?.is_admin === true;
  }

  if (type === "cohost") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return false;
    if (hackathon.host_id === invited_by) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  if (type === "judge") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return false;
    if (hackathon.host_id === invited_by) return true;
    const { data: cohost } = await supabaseAdmin
      .from("hackathon_cohosts")
      .select("user_id")
      .eq("hackathon_id", hackathon_id!)
      .eq("user_id", invited_by)
      .maybeSingle();
    if (cohost) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  if (type === "project_member") {
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (!project) return false;
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("owner_id")
      .eq("id", project.team_id)
      .single();
    if (!team) return false;
    if (team.owner_id === invited_by) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  return false;
}

// --- Admin actions ---

export async function adminToggleEventCreatorAction(
  userId: string,
  isEventCreator: boolean,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ is_event_creator: isEventCreator })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function adminToggleAdminAction(
  userId: string,
  isAdmin: boolean,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ is_admin: isAdmin })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

// --- Speaker actions ---

async function getHackathon(id: string) {
  const { data } = await supabaseAdmin.from("hackathons").select("*").eq("id", id).single();
  return data;
}

export async function addSpeakerAction(
  data: z.infer<typeof addSpeakerSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = addSpeakerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const hackathon = await getHackathon(parsed.data.hackathon_id);
  if (!hackathon) return { success: false, error: "Hackathon not found" };

  const caps = await getFullCapabilities(supabaseAdmin, auth.id);
  if (!caps || !canManageHackathon(caps, hackathon.host_id, auth.id, hackathon.id)) {
    return { success: false, error: "Not authorized" };
  }

  const phase = computePhase(hackathon);
  if (phase === "finalized") {
    return { success: false, error: "Hackathon is finalized" };
  }

  const speaker = await addSpeaker({
    hackathon_id: parsed.data.hackathon_id,
    name: parsed.data.name,
    image_url: parsed.data.image_url || null,
  });
  if (!speaker) return { success: false, error: "Failed to add speaker" };

  revalidatePath(`/host/${parsed.data.hackathon_id}`);
  revalidatePath(`/hackathons/${parsed.data.hackathon_id}`);
  return { success: true, data: { id: speaker.id } };
}

export async function updateSpeakerAction(
  data: z.infer<typeof updateSpeakerSchema>,
): Promise<ActionResult> {
  const parsed = updateSpeakerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const result = await updateSpeaker(parsed.data.id, {
    name: parsed.data.name,
    image_url: parsed.data.image_url,
  });
  if (!result) return { success: false, error: "Failed to update speaker" };

  revalidatePath("/host");
  return { success: true, data: undefined };
}

export async function removeSpeakerAction(
  speakerId: string,
  hackathonId: string,
): Promise<ActionResult> {
  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const hackathon = await getHackathon(hackathonId);
  if (!hackathon) return { success: false, error: "Hackathon not found" };

  const caps = await getFullCapabilities(supabaseAdmin, auth.id);
  if (!caps || !canManageHackathon(caps, hackathon.host_id, auth.id, hackathon.id)) {
    return { success: false, error: "Not authorized" };
  }

  const phase = computePhase(hackathon);
  if (phase === "finalized") {
    return { success: false, error: "Hackathon is finalized" };
  }

  await removeSpeaker(speakerId);
  revalidatePath(`/host/${hackathonId}`);
  revalidatePath(`/hackathons/${hackathonId}`);
  return { success: true, data: undefined };
}

// --- Edit hackathon action ---

export async function editHackathonAction(
  data: z.infer<typeof editHackathonSchema>,
): Promise<ActionResult> {
  const parsed = editHackathonSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const hackathon = await getHackathon(parsed.data.id);
  if (!hackathon) return { success: false, error: "Hackathon not found" };

  const caps = await getFullCapabilities(supabaseAdmin, auth.id);
  if (!caps || !canManageHackathon(caps, hackathon.host_id, auth.id, hackathon.id)) {
    return { success: false, error: "Not authorized" };
  }

  const phase = computePhase(hackathon);
  if (phase === "finalized") {
    return { success: false, error: "Hackathon is finalized" };
  }

  const { id, ...updates } = parsed.data;
  const updatePayload: Record<string, unknown> = {};
  const dateFields = new Set(["start_date", "submission_deadline", "judging_deadline", "results_date"]);
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      // Coerce empty date strings to null so Postgres doesn't choke on ""
      updatePayload[key] = dateFields.has(key) && value === "" ? null : value;
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  const { error } = await supabaseAdmin.from("hackathons").update(updatePayload).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/host/${id}`);
  revalidatePath(`/hackathons/${id}`);
  return { success: true, data: undefined };
}

// --- Finalize hackathon action ---

export async function finalizeHackathonAction(
  data: z.infer<typeof finalizeHackathonSchema>,
): Promise<ActionResult> {
  const parsed = finalizeHackathonSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  const auth = await getAuthUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const hackathon = await getHackathon(parsed.data.hackathon_id);
  if (!hackathon) return { success: false, error: "Hackathon not found" };

  const caps = await getFullCapabilities(supabaseAdmin, auth.id);
  if (!caps || !canManageHackathon(caps, hackathon.host_id, auth.id, hackathon.id)) {
    return { success: false, error: "Not authorized" };
  }

  const phase = computePhase(hackathon);
  if (phase !== "completed") {
    return { success: false, error: `Cannot finalize in ${phase} phase` };
  }

  // 1. Store ai_weight and finalized_at on hackathon
  await supabaseAdmin
    .from("hackathons")
    .update({
      ai_weight: parsed.data.ai_weight,
      finalized_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.hackathon_id);

  // 2. Store frozen leaderboard results
  const resultRows = parsed.data.results.map((r) => ({
    hackathon_id: parsed.data.hackathon_id,
    submission_id: r.submission_id,
    project_id: r.project_id,
    rank: r.rank,
    final_score: r.final_score,
    ai_score_weighted: r.ai_score_weighted,
    judge_score_weighted: r.judge_score_weighted,
    raw_ai_score: r.raw_ai_score,
    raw_judge_avg_score: r.raw_judge_avg_score,
  }));
  await saveResults(resultRows);

  revalidatePath(`/host/${parsed.data.hackathon_id}`);
  revalidatePath(`/hackathons/${parsed.data.hackathon_id}`);
  return { success: true, data: undefined };
}
