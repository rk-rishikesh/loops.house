import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];

const supabase = createClient();

export async function getTeams(userId?: string): Promise<TeamRow[]> {
  if (userId) {
    // Teams where user is a member
    const { data } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", userId);
    return (data?.map((d) => (d as Record<string, unknown>).teams as TeamRow) ?? []).filter(
      Boolean,
    );
  }
  const { data } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Lean list query for teams */
export async function getTeamsList(
  userId?: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  if (userId) {
    const { data } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, owner_id, created_at)")
      .eq("user_id", userId);
    return (data?.map((d) => (d as Record<string, unknown>).teams as TeamRow) ?? []).filter(
      Boolean,
    );
  }
  const { data } = await supabase
    .from("teams")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return data ?? [];
}

export async function getTeam(id: string): Promise<TeamRow | null> {
  const { data } = await supabase.from("teams").select("*").eq("id", id).single();
  return data;
}

export async function saveTeam(team: TeamInsert): Promise<TeamRow | null> {
  const { data } = await supabase
    .from("teams")
    .upsert(team, { onConflict: "id" })
    .select()
    .single();

  // Auto-add owner as member
  if (data) {
    await supabase
      .from("team_members")
      .upsert(
        { team_id: data.id, user_id: data.owner_id, role: "owner" },
        { onConflict: "team_id,user_id" },
      );
  }
  return data;
}

export async function addMember(teamId: string, userId: string): Promise<void> {
  await supabase.from("team_members").insert({ team_id: teamId, user_id: userId, role: "member" });
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId);
}

export async function getTeamMembers(teamId: string) {
  const { data } = await supabase
    .from("team_members")
    .select("user_id, role, joined_at, users(id, email, display_name, avatar_url)")
    .eq("team_id", teamId);
  return data ?? [];
}
