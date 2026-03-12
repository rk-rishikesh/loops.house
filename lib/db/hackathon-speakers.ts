import { supabaseAdmin } from "@/lib/supabase/admin";
import type { HackathonSpeakerInsert, HackathonSpeakerRow } from "@/lib/supabase/types";

export async function getSpeakers(hackathonId: string): Promise<HackathonSpeakerRow[]> {
  const { data } = await supabaseAdmin
    .from("hackathon_speakers")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addSpeaker(
  speaker: HackathonSpeakerInsert,
): Promise<HackathonSpeakerRow | null> {
  const { data } = await supabaseAdmin.from("hackathon_speakers").insert(speaker).select().single();
  return data;
}

export async function updateSpeaker(
  id: string,
  updates: { name?: string; image_url?: string | null },
): Promise<HackathonSpeakerRow | null> {
  const { data } = await supabaseAdmin
    .from("hackathon_speakers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data;
}

export async function removeSpeaker(id: string): Promise<void> {
  await supabaseAdmin.from("hackathon_speakers").delete().eq("id", id);
}
