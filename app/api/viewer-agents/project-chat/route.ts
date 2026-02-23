import { NextRequest } from "next/server";
import { streamContent } from "../../lib/gemini-client";
import { queryTopK } from "../../lib/vector-store";
import { checkRateLimit, getClientIP } from "../../lib/rate-limiter";

interface ProjectContext {
  name?: string;
  tagline?: string;
  refined_description?: string;
  description?: string;
  key_features?: string[];
  tech_stack_tags?: string[];
  category?: string;
  flattened_codebase?: string;
}

interface ProjectChatInput {
  project_id: string;
  message: string;
  conversation_history: { role: "user" | "assistant"; content: string }[];
  project?: ProjectContext;
}

function buildKbContext(project: ProjectContext): string {
  const p = project;
  const parts = [
    p.name ? `Project: ${p.name}` : "",
    p.tagline ? `Tagline: ${p.tagline}` : "",
    p.refined_description || p.description ? `Description:\n${p.refined_description || p.description}` : "",
    p.key_features?.length ? `Key features:\n${p.key_features.map((f) => `- ${f}`).join("\n")}` : "",
    p.tech_stack_tags?.length ? `Tech stack: ${p.tech_stack_tags.join(", ")}` : "",
    p.category ? `Category: ${p.category}` : "",
    p.flattened_codebase ? `\n--- Code (excerpt) ---\n${p.flattened_codebase.slice(0, 50000)}` : "",
  ].filter(Boolean);
  return parts.join("\n\n");
}

const SIMILARITY_THRESHOLD = 0.70;
const MAX_HISTORY = 10;
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PROJECT_CHAT || "10", 10);

const NO_INFO_RESPONSE =
  "I don't have enough information about that in this project's profile. You can check their GitHub or website for more details.";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`project-chat:${ip}`, RATE_LIMIT, 3600000);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Session rate limit reached. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const input: ProjectChatInput = await request.json();

    if (!input.project_id || !input.message) {
      return new Response(
        JSON.stringify({ error: "project_id and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let context: string;

    if (input.project && (input.project.name || input.project.refined_description || input.project.flattened_codebase)) {
      context = buildKbContext(input.project);
    } else {
      const results = await queryTopK(input.project_id, input.message, 5, 0);
      const aboveThreshold = results.filter((r) => r.score >= SIMILARITY_THRESHOLD);
      if (aboveThreshold.length === 0) {
        return new Response(JSON.stringify({ response: NO_INFO_RESPONSE }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      context = aboveThreshold.map((r) => r.chunk.text).join("\n\n---\n\n");
    }

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
            text: `PROJECT CONTEXT:\n${context}\n\nQUESTION: ${input.message}`,
          },
        ],
      },
    ];

    const systemPrompt = `You are a knowledgeable assistant for this project. Answer questions about this project based only on the provided context. If something isn't covered in the context, say so directly. Do NOT answer general questions unrelated to the project.`;

    const response = await streamContent("pro", contents, {
      systemInstruction: systemPrompt,
      temperature: 0.3,
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
