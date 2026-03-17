/**
 * Vector store — delegates to Supabase pgvector via lib/db/knowledge-base.ts.
 *
 * Keeps the same exports so existing API routes continue to work.
 */

import { deleteProjectKB } from "@/lib/db/knowledge-base";

export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

/** @deprecated knowledge_base_chunks table dropped — no-op stub */
export async function upsertChunks(_projectId: string, _chunks: VectorChunk[]): Promise<void> {
  // no-op — table dropped
}

/** @deprecated knowledge_base_chunks table dropped — always returns null */
export async function getChunks(_projectId: string): Promise<VectorChunk[] | null> {
  return null;
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteProjectKB(projectId);
}

/** @deprecated knowledge_base_chunks table dropped — always returns false */
export async function hasProject(_projectId: string): Promise<boolean> {
  return false;
}

/** @deprecated knowledge_base_chunks table dropped — always returns [] */
export async function queryTopK(
  _projectId: string,
  _query: string,
  _k = 5,
  _minSimilarity = 0,
): Promise<{ chunk: VectorChunk; score: number }[]> {
  return [];
}
