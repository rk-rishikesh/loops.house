import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["loops_profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["loops_profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["loops_profiles"]["Update"];

const supabase = createClient();

export async function getProjects(teamId?: string): Promise<ProfileRow[]> {
  let query = supabase.from("loops_profiles").select("*").order("created_at", { ascending: false });

  if (teamId) query = query.eq("team_id", teamId);
  const { data } = await query;
  return data ?? [];
}

export async function getPublicProjects(): Promise<ProfileRow[]> {
  const { data } = await supabase
    .from("loops_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Lean list query — only columns needed for list pages */
export async function getProjectsList(
  teamId?: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  let query = supabase
    .from("loops_profiles")
    .select("id, team_id, name, tagline, category, logo_url, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (teamId) query = query.eq("team_id", teamId);
  const { data } = await query;
  return data ?? [];
}

export async function getProject(id: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("loops_profiles").select("*").eq("id", id).single();
  return data;
}

export async function saveProject(
  project: ProfileInsert & { id?: string },
): Promise<ProfileRow | null> {
  if (project.id) {
    // Update existing
    const { id, ...updates } = project;
    const { data } = await supabase
      .from("loops_profiles")
      .update(updates as ProfileUpdate)
      .eq("id", id)
      .select()
      .single();
    return data;
  }
  // Insert new
  const { data } = await supabase.from("loops_profiles").insert(project).select().single();
  return data;
}

export async function removeProject(id: string): Promise<void> {
  await supabase.from("loops_profiles").delete().eq("id", id);
}

/** Get all projects for teams the user belongs to */
export async function getUserProjects(userId: string): Promise<ProfileRow[]> {
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (!memberships?.length) return [];

  const teamIds = memberships.map((m) => m.team_id);
  const { data } = await supabase
    .from("loops_profiles")
    .select("*")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}
