import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type JudgeInviteRow = Database["public"]["Tables"]["judge_invites"]["Row"];

const supabase = createClient();

export async function getJudgeInvitesForBooster(
  boosterId: string,
): Promise<JudgeInviteRow[]> {
  const { data } = await supabase
    .from("judge_invites")
    .select("*")
    .eq("booster_id", boosterId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getJudgeInvitesForUser(
  userId: string,
): Promise<JudgeInviteRow[]> {
  const { data } = await supabase
    .from("judge_invites")
    .select("*")
    .eq("judge_user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createJudgeInvite(
  boosterId: string,
  judgeUserId: string,
  invitedBy: string,
  assignedTracks?: string[],
): Promise<JudgeInviteRow | null> {
  const { data } = await supabase
    .from("judge_invites")
    .insert({
      booster_id: boosterId,
      judge_user_id: judgeUserId,
      invited_by: invitedBy,
      assigned_tracks: assignedTracks ?? [],
    })
    .select()
    .single();
  return data;
}

export async function acceptJudgeInvite(
  inviteId: string,
): Promise<JudgeInviteRow | null> {
  const { data } = await supabase
    .from("judge_invites")
    .update({ accepted: true })
    .eq("id", inviteId)
    .select()
    .single();
  return data;
}
