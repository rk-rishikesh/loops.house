/**
 * Vector store — delegates to Supabase pgvector via lib/db/knowledge-base.ts.
 *
 * Keeps the same exports so existing API routes continue to work.
 */

import {
  getChunks as dbGetChunks,
  hasProject as dbHasProject,
  queryTopK as dbQueryTopK,
  upsertChunks as dbUpsert,
  deleteProjectKB,
} from "@/lib/db/knowledge-base";
import { embedText } from "./embeddings";

export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export async function upsertChunks(projectId: string, chunks: VectorChunk[]): Promise<void> {
  await dbUpsert(
    projectId,
    chunks.map((c) => ({
      content: c.text,
      embedding: c.embedding,
      metadata: c.metadata as Record<string, string> | undefined,
    })),
  );
}

export async function getChunks(projectId: string): Promise<VectorChunk[] | null> {
  const chunks = await dbGetChunks(projectId);
  if (chunks.length === 0) return null;
  return chunks.map((c, i) => ({
    id: `${projectId}-${i}`,
    text: c.content,
    embedding: [],
    metadata: c.metadata as Record<string, unknown>,
  }));
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteProjectKB(projectId);
}

export async function hasProject(projectId: string): Promise<boolean> {
  return dbHasProject(projectId);
}

export async function queryTopK(
  projectId: string,
  query: string,
  k = 5,
  minSimilarity = 0,
): Promise<{ chunk: VectorChunk; score: number }[]> {
  const queryEmbedding = await embedText(query);
  const results = await dbQueryTopK(projectId, queryEmbedding, k, minSimilarity);

  return results.map((r) => ({
    chunk: {
      id: r.metadata ? String((r.metadata as Record<string, unknown>).id ?? "") : "",
      text: r.content,
      embedding: [],
      metadata: r.metadata as Record<string, unknown>,
    },
    score: r.similarity,
  }));
}
