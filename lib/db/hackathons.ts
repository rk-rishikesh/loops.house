import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type HackathonRow = Database["public"]["Tables"]["hackathons"]["Row"];
type HackathonInsert = Database["public"]["Tables"]["hackathons"]["Insert"];
type HackathonUpdate = Database["public"]["Tables"]["hackathons"]["Update"];

const supabase = createClient();

export type { HackathonRow, HackathonInsert, HackathonUpdate };

export async function getHackathons(hostId?: string): Promise<HackathonRow[]> {
  let query = supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });

  if (hostId) query = query.eq("host_id", hostId);
  const { data } = await query;
  return data ?? [];
}

export async function getPublicHackathons(): Promise<HackathonRow[]> {
  const { data } = await supabase
    .from("hackathons")
    .select("*")
    .eq("is_exclusive", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getResidencies(): Promise<HackathonRow[]> {
  const { data } = await supabase
    .from("hackathons")
    .select("*")
    .eq("is_exclusive", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Lean list query — only columns needed for list pages */
export async function getHackathonsList(
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const { data } = await supabase
    .from("hackathons")
    .select("id, host_id, name, theme, problem_statements, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return data ?? [];
}

export async function getHackathon(id: string): Promise<HackathonRow | null> {
  const { data } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function saveHackathon(
  hackathon: HackathonInsert & { id?: string },
): Promise<HackathonRow | null> {
  if (hackathon.id) {
    const { id, ...updates } = hackathon;
    const { data } = await supabase
      .from("hackathons")
      .update(updates as HackathonUpdate)
      .eq("id", id)
      .select()
      .single();
    return data;
  }
  const { data } = await supabase
    .from("hackathons")
    .insert(hackathon)
    .select()
    .single();
  return data;
}
