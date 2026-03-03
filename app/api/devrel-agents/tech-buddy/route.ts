import { NextRequest } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { streamContent } from "../../lib/gemini-client";
import { embedText, embedBatch, cosineSimilarity } from "../../lib/embeddings";

interface TechBuddyInput {
  message: string;
  conversation_history: { role: "user" | "assistant"; content: string }[];
  booster_id: string;
}

interface ResourceBundle {
  sponsor_tracks: {
    sponsor_name: string;
    track_name: string;
    track_description: string;
    docs_text: string;
    api_endpoints?: string[];
    sdk_examples?: string[];
  }[];
  technical_cheatsheet: string;
  allowed_apis: string[];
}

interface ResourceChunk {
  text: string;
  embedding: number[];
  source: string;
}

const MAX_CACHED_BOOSTERS = 50;
const boosterResources = new Map<string, ResourceChunk[]>();

function evictIfNeeded() {
  if (boosterResources.size <= MAX_CACHED_BOOSTERS) return;
  // Evict oldest entries (first inserted) until under limit
  const excess = boosterResources.size - MAX_CACHED_BOOSTERS;
  const keys = boosterResources.keys();
  for (let i = 0; i < excess; i++) {
    const { value } = keys.next();
    if (value) boosterResources.delete(value);
  }
}

const SIMILARITY_THRESHOLD = 0.75;
const MAX_HISTORY = 20;
const NO_INFO_RESPONSE =
  "I don't have that information in the available resources. Please check with the organizers or the sponsor directly.";

const SYSTEM_PROMPT = `You are Tech Buddy, a resource assistant for this booster. You answer questions ONLY based on the sponsor documentation and technical cheatsheet provided to you.

RULES:
- If the answer is in the documentation, give it clearly and cite which sponsor/track it came from.
- If the answer is NOT in the documentation, say exactly: "${NO_INFO_RESPONSE}"
- Do NOT answer general programming questions. Do NOT debug code. Do NOT suggest solutions to bugs.
- Do NOT use your general knowledge about these technologies — only use what is in the provided documents.
- You CAN explain what a sponsor API does based on its docs. You CAN show example usage IF it appears in the docs.`;

export async function loadResources(
  boosterId: string,
  bundle: ResourceBundle
): Promise<void> {
  const chunks: { text: string; source: string }[] = [];

  for (const track of bundle.sponsor_tracks) {
    const trackChunks = splitIntoChunks(track.docs_text, 800);
    for (const chunk of trackChunks) {
      chunks.push({ text: chunk, source: `${track.sponsor_name} - ${track.track_name}` });
    }
    if (track.api_endpoints?.length) {
      chunks.push({
        text: `API Endpoints for ${track.sponsor_name}:\n${track.api_endpoints.join("\n")}`,
        source: `${track.sponsor_name} - API`,
      });
    }
    if (track.sdk_examples?.length) {
      chunks.push({
        text: `SDK Examples for ${track.sponsor_name}:\n${track.sdk_examples.join("\n\n")}`,
        source: `${track.sponsor_name} - SDK`,
      });
    }
  }

  if (bundle.technical_cheatsheet) {
    const csChunks = splitIntoChunks(bundle.technical_cheatsheet, 800);
    for (const chunk of csChunks) {
      chunks.push({ text: chunk, source: "Technical Cheatsheet" });
    }
  }

  if (bundle.allowed_apis?.length) {
    chunks.push({
      text: `Allowed APIs and Services:\n${bundle.allowed_apis.join("\n")}`,
      source: "Allowed APIs",
    });
  }

  const embeddings = await embedBatch(chunks.map((c) => c.text));
  const resourceChunks: ResourceChunk[] = chunks.map((c, i) => ({
    text: c.text,
    embedding: embeddings[i],
    source: c.source,
  }));

  boosterResources.set(boosterId, resourceChunks);
  evictIfNeeded();
}

function splitIntoChunks(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

async function retrieveChunks(
  boosterId: string,
  query: string,
  topK: number = 5
): Promise<{ text: string; source: string; score: number }[]> {
  const resources = boosterResources.get(boosterId);
  if (!resources || resources.length === 0) return [];

  const queryEmb = await embedText(query);
  const scored = resources.map((r) => ({
    text: r.text,
    source: r.source,
    score: cosineSimilarity(queryEmb, r.embedding),
  }));

  return scored
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const body = await request.json();

    if (body.action === "load_resources") {
      const { booster_id, resources } = body as {
        action: string;
        booster_id: string;
        resources: ResourceBundle;
      };
      await loadResources(booster_id, resources);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const input: TechBuddyInput = body;
    const bid = input.booster_id ?? (input as { hackathon_id?: string }).hackathon_id;
    if (!input.message || !bid) {
      return new Response(
        JSON.stringify({ error: "message and booster_id are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const retrieved = await retrieveChunks(bid, input.message);

    if (retrieved.length === 0) {
      return new Response(
        JSON.stringify({ response: NO_INFO_RESPONSE, sources: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const contextBlock = retrieved
      .map((r) => `[Source: ${r.source}]\n${r.text}`)
      .join("\n\n---\n\n");

    const history = (input.conversation_history || []).slice(-MAX_HISTORY);
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      })),
      {
        role: "user" as const,
        parts: [
          {
            text: `RETRIEVED DOCUMENTATION:\n${contextBlock}\n\nUSER QUESTION: ${input.message}`,
          },
        ],
      },
    ];

    const response = await streamContent("pro", contents, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ sources: retrieved.map((r) => r.source) })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
