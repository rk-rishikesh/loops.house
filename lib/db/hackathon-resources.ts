import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export interface HackathonResourceRow {
  id: string;
  hackathon_id: string;
  content: Json;
  source_urls: string[];
  generated_at: string;
  created_at: string;
}

export async function getHackathonResources(
  hackathonId: string,
): Promise<HackathonResourceRow | null> {
  const { data, error } = await supabaseAdmin
    .from("hackathon_resources")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .maybeSingle();
  if (error) console.error("[hackathon-resources] get:", error.message);
  return data;
}

export async function upsertHackathonResources(
  hackathonId: string,
  content: Json,
  sourceUrls: string[],
): Promise<void> {
  const { error } = await supabaseAdmin.from("hackathon_resources").upsert(
    {
      hackathon_id: hackathonId,
      content,
      source_urls: sourceUrls,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "hackathon_id" },
  );
  if (error) console.error("[hackathon-resources] upsert:", error.message);
}
