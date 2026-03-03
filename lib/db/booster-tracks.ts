import { supabaseAdmin } from "@/lib/supabase/admin";


export interface TrackChunk {
  content: string;
  source: string;
  embedding: number[];
}

/** Insert track chunks for a booster (replaces existing) */
export async function upsertBoosterTrackChunks(
  boosterId: string,
  trackId: string | null,
  chunks: TrackChunk[],
): Promise<void> {
  // Delete old chunks for this track (or all if trackId is null)
  let deleteQuery = supabaseAdmin
    .from("booster_track_chunks")
    .delete()
    .eq("booster_id", boosterId);

  if (trackId) deleteQuery = deleteQuery.eq("track_id", trackId);
  await deleteQuery;

  if (chunks.length === 0) return;

  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map((c) => ({
      booster_id: boosterId,
      track_id: trackId,
      content: c.content,
      source: c.source,
      embedding: JSON.stringify(c.embedding),
    }));
    await supabaseAdmin.from("booster_track_chunks").insert(batch);
  }
}

/** Semantic search via match_booster_chunks RPC */
export async function matchBoosterChunks(
  boosterId: string,
  queryEmbedding: number[],
  topK = 5,
  minSimilarity = 0.75,
): Promise<{ content: string; source: string; similarity: number }[]> {
  const { data, error } = await supabaseAdmin.rpc("match_booster_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_booster_id: boosterId,
    match_count: topK,
    match_threshold: minSimilarity,
  });

  if (error) {
    console.error("matchBoosterChunks error:", error);
    return [];
  }

  return data ?? [];
}

/** Check if booster has any indexed track chunks */
export async function hasBoosterChunks(boosterId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("booster_track_chunks")
    .select("id", { count: "exact", head: true })
    .eq("booster_id", boosterId);
  return (count ?? 0) > 0;
}
