import { createClient } from "@/lib/supabase/client";
import type { Database, BoosterType } from "@/lib/supabase/types";

type BoosterRow = Database["public"]["Tables"]["boosters"]["Row"];
type BoosterInsert = Database["public"]["Tables"]["boosters"]["Insert"];
type BoosterUpdate = Database["public"]["Tables"]["boosters"]["Update"];

const supabase = createClient();

export async function getBoosters(hostId?: string): Promise<BoosterRow[]> {
  let query = supabase
    .from("boosters")
    .select("*")
    .order("created_at", { ascending: false });

  if (hostId) query = query.eq("host_id", hostId);
  const { data } = await query;
  return data ?? [];
}

export async function getPublicBoosters(
  type?: BoosterType,
): Promise<BoosterRow[]> {
  let query = supabase
    .from("boosters")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("booster_type", type);
  const { data } = await query;
  return data ?? [];
}

/** Lean list query — only columns needed for list pages */
export async function getBoostersList(
  type?: BoosterType,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  let query = supabase
    .from("boosters")
    .select("id, host_id, booster_type, name, theme, problem_statements, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("booster_type", type);
  const { data } = await query;
  return data ?? [];
}

/** Filter boosters by type at the DB level */
export async function getBoostersByType(type: BoosterType): Promise<BoosterRow[]> {
  const { data } = await supabase
    .from("boosters")
    .select("*")
    .eq("booster_type", type)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBooster(id: string): Promise<BoosterRow | null> {
  const { data } = await supabase
    .from("boosters")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function saveBooster(
  booster: BoosterInsert & { id?: string },
): Promise<BoosterRow | null> {
  if (booster.id) {
    const { id, ...updates } = booster;
    const { data } = await supabase
      .from("boosters")
      .update(updates as BoosterUpdate)
      .eq("id", id)
      .select()
      .single();
    return data;
  }
  const { data } = await supabase
    .from("boosters")
    .insert(booster)
    .select()
    .single();
  return data;
}
