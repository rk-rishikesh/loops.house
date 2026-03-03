import { embedBatch } from "./embeddings";
import { upsertChunks, type VectorChunk } from "./vector-store";

export interface KnowledgeBaseEntry {
  projectId: string;
  sections: {
    source: "code" | "demo" | "theme" | "profile";
    content: string;
  }[];
}

export function chunkText(
  text: string,
  chunkSize: number = 1500,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start = end - overlap;
  }

  return chunks;
}

export async function buildKnowledgeBase(
  entry: KnowledgeBaseEntry
): Promise<{ chunkCount: number }> {
  const allText = entry.sections.map((s) => s.content).join("\n\n---\n\n");
  const textChunks = chunkText(allText);
  const embeddings = await embedBatch(textChunks);

  const vectorChunks: VectorChunk[] = textChunks.map((text, i) => ({
    id: `${entry.projectId}-${i}`,
    text,
    embedding: embeddings[i],
    metadata: {
      source: entry.sections.find((s) =>
        text.includes(s.content.slice(0, 50))
      )?.source ?? "profile",
    },
  }));

  await upsertChunks(entry.projectId, vectorChunks);
  return { chunkCount: vectorChunks.length };
}
