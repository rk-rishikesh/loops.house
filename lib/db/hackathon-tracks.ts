import { supabaseAdmin } from "@/lib/supabase/admin";


export interface TrackChunk {
  content: string;
  source: string;
  embedding: number[];
}

/** Insert track chunks for a hackathon (replaces existing) */
export async function upsertHackathonTrackChunks(
  hackathonId: string,
  trackId: string | null,
  chunks: TrackChunk[],
): Promise<void> {
  // Delete old chunks for this track (or all if trackId is null)
  let deleteQuery = supabaseAdmin
    .from("hackathon_track_chunks")
    .delete()
    .eq("hackathon_id", hackathonId);

  if (trackId) deleteQuery = deleteQuery.eq("track_id", trackId);
  await deleteQuery;

  if (chunks.length === 0) return;

  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map((c) => ({
      hackathon_id: hackathonId,
      track_id: trackId,
      content: c.content,
      source: c.source,
      embedding: JSON.stringify(c.embedding),
    }));
    await supabaseAdmin.from("hackathon_track_chunks").insert(batch);
  }
}

/** Semantic search via match_hackathon_track_chunks RPC */
export async function matchHackathonChunks(
  hackathonId: string,
  queryEmbedding: number[],
  topK = 5,
  minSimilarity = 0.75,
): Promise<{ content: string; source: string; similarity: number }[]> {
  const { data, error } = await supabaseAdmin.rpc("match_hackathon_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_hackathon_id: hackathonId,
    match_count: topK,
    match_threshold: minSimilarity,
  });

  if (error) {
    console.error("matchHackathonChunks error:", error);
    return [];
  }

  return data ?? [];
}

/** Check if hackathon has any indexed track chunks */
export async function hasHackathonChunks(hackathonId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("hackathon_track_chunks")
    .select("id", { count: "exact", head: true })
    .eq("hackathon_id", hackathonId);
  return (count ?? 0) > 0;
}
