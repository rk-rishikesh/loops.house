import { supabaseAdmin } from "@/lib/supabase/admin";
import type { HackathonResultInsert, HackathonResultRow } from "@/lib/supabase/types";

export async function getResults(hackathonId: string): Promise<HackathonResultRow[]> {
  const { data } = await supabaseAdmin
    .from("hackathon_results")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("rank", { ascending: true });
  return data ?? [];
}

export async function saveResults(results: HackathonResultInsert[]): Promise<void> {
  if (results.length === 0) return;
  await supabaseAdmin.from("hackathon_results").upsert(results, {
    onConflict: "hackathon_id,submission_id",
  });
}

export async function deleteResults(hackathonId: string): Promise<void> {
  await supabaseAdmin.from("hackathon_results").delete().eq("hackathon_id", hackathonId);
}
