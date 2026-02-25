import { createClient } from "@/lib/supabase/client";
import type { Database, Json, SubmissionStatus } from "@/lib/supabase/types";

type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];

const supabase = createClient();

export async function submitProject(
  boosterId: string,
  teamId: string,
  projectId: string,
): Promise<SubmissionRow | null> {
  const { data } = await supabase
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
  return data;
}

export async function getSubmissions(
  boosterId: string,
): Promise<SubmissionRow[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Lean list query for submissions */
export async function getSubmissionsList(
  boosterId?: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  let query = supabase
    .from("submissions")
    .select("id, booster_id, project_id, team_id, status, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (boosterId) query = query.eq("booster_id", boosterId);
  const { data } = await query;
  return data ?? [];
}

export async function getSubmission(
  boosterId: string,
  projectId: string,
): Promise<SubmissionRow | null> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("booster_id", boosterId)
    .eq("project_id", projectId)
    .single();
  return data;
}

export async function updateScore(
  submissionId: string,
  updates: { ai_score?: Json; human_score?: Json; momentum_score?: number },
): Promise<void> {
  await supabase
    .from("submissions")
    .update(updates)
    .eq("id", submissionId);
}

export async function getProjectSubmissions(
  projectId: string,
): Promise<SubmissionRow[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
