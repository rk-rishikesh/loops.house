import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export interface KBChunk {
  content: string;
  embedding: number[];
  metadata?: Record<string, string>;
}

/** Create or get knowledge base for a project */
export async function ensureKnowledgeBase(projectId: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("knowledge_bases")
    .select("id")
    .eq("project_id", projectId)
    .single();

  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin
    .from("knowledge_bases")
    .insert({ project_id: projectId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("ensureKnowledgeBase insert error:", error);
    throw new Error(`Failed to create knowledge base: ${error?.message ?? "unknown"}`);
  }

  // Link back to profile
  await supabaseAdmin
    .from("loops_profiles")
    .update({ knowledge_base_id: data.id })
    .eq("id", projectId);

  return data.id;
}

/** Insert chunks into the knowledge base (replaces existing for project) */
export async function upsertChunks(projectId: string, chunks: KBChunk[]): Promise<void> {
  const kbId = await ensureKnowledgeBase(projectId);

  // Delete old chunks for this project
  await supabaseAdmin.from("knowledge_base_chunks").delete().eq("project_id", projectId);

  if (chunks.length === 0) return;

  // Insert in batches of 100
  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map((c, idx) => ({
      kb_id: kbId,
      project_id: projectId,
      chunk_index: i + idx,
      content: c.content,
      embedding: JSON.stringify(c.embedding),
      metadata: (c.metadata ?? {}) as Json,
    }));
    await supabaseAdmin.from("knowledge_base_chunks").insert(batch);
  }

  // Update chunk count on profile
  await supabaseAdmin
    .from("loops_profiles")
    .update({ knowledge_base_chunks: chunks.length })
    .eq("id", projectId);
}

/** Semantic search via match_kb_chunks RPC */
export async function queryTopK(
  projectId: string,
  queryEmbedding: number[],
  topK = 5,
  minSimilarity = 0.0,
): Promise<{ content: string; metadata: Json; similarity: number }[]> {
  const { data, error } = await supabaseAdmin.rpc("match_kb_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_project_id: projectId,
    match_count: topK,
    match_threshold: minSimilarity,
  });

  if (error) {
    console.error("queryTopK error:", error);
    return [];
  }

  return data ?? [];
}

/** Get all chunks for a project (non-vector, for full context) */
export async function getChunks(projectId: string): Promise<{ content: string; metadata: Json }[]> {
  const { data } = await supabaseAdmin
    .from("knowledge_base_chunks")
    .select("content, metadata")
    .eq("project_id", projectId)
    .order("chunk_index", { ascending: true });
  return data ?? [];
}

/** Check if project has indexed chunks */
export async function hasProject(projectId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("knowledge_base_chunks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  return (count ?? 0) > 0;
}

/** Delete all KB data for a project */
export async function deleteProjectKB(projectId: string): Promise<void> {
  await supabaseAdmin.from("knowledge_base_chunks").delete().eq("project_id", projectId);
  await supabaseAdmin.from("knowledge_bases").delete().eq("project_id", projectId);
}
