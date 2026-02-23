import { embedText, cosineSimilarity } from "./embeddings";

export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

interface ProjectStore {
  chunks: VectorChunk[];
  createdAt: number;
}

const store = new Map<string, ProjectStore>();

export function upsertChunks(projectId: string, chunks: VectorChunk[]): void {
  store.set(projectId, { chunks, createdAt: Date.now() });
}

export function getChunks(projectId: string): VectorChunk[] | null {
  return store.get(projectId)?.chunks ?? null;
}

export function deleteProject(projectId: string): boolean {
  return store.delete(projectId);
}

export function hasProject(projectId: string): boolean {
  return store.has(projectId);
}

export async function queryTopK(
  projectId: string,
  query: string,
  k: number = 5,
  minSimilarity: number = 0
): Promise<{ chunk: VectorChunk; score: number }[]> {
  const project = store.get(projectId);
  if (!project) return [];

  const queryEmbedding = await embedText(query);

  const scored = project.chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .filter((s) => s.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function listProjects(): string[] {
  return Array.from(store.keys());
}
