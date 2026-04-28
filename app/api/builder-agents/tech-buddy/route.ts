import type { NextRequest } from "next/server";
import { getHackathonResources } from "@/lib/db/hackathon-resources";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { streamContent } from "../../lib/gemini-client";
import { summarizeConversationHistory } from "../../lib/summarize-conversation-history";

interface TechBuddyInput {
  message: string;
  conversation_history: { role: "user" | "assistant"; content: string }[];
  hackathon_id?: string;
  hackathon_context?: {
    problem_statements: string[];
    sponsor_tracks?: { sponsor: string; track_description: string }[];
    theme?: string;
    technical_resources?: { url: string; description?: string }[];
  };
}

const SYSTEM_PROMPT = `You are Tech Buddy — a combined ideation + engineering mentor for hackathon builders.

YOU CAN HELP WITH:
- Ideation: refining concepts, selecting the best challenge, scoping an MVP, defining differentiation.
- Engineering: architecture, implementation steps, debugging, trade-offs, and integration decisions.

RULES:
- Be concise and actionable.
- Tie suggestions back to the hackathon theme/problem statements/tracks when relevant.
- Use provided technical resources when useful.
- If asked for code, keep snippets short and focused. Prefer a plan first.`;

const MAX_HISTORY = 15;
const MAX_RESOURCE_BLOCK_CHARS = 8000;
const MAX_CONTEXT_BLOCK_CHARS = 12000;
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGE_CHARS = 600;

function isGeminiRateLimitError(message: string): boolean {
  return (
    message.includes('"code": 429') ||
    message.includes('"status":"Too Many Requests"') ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[truncated for length]`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const input: TechBuddyInput = await request.json();

    if (!input.message) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!input.hackathon_context) {
      return new Response(JSON.stringify({ error: "hackathon_context is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch AI-generated resources for this hackathon if available
    let resourceBlock = "";
    if (input.hackathon_id) {
      const resources = await getHackathonResources(input.hackathon_id);
      if (resources?.content) {
        const content = resources.content as Record<string, unknown>;
        resourceBlock = truncateText(
          `\n\nTECHNICAL RESOURCES (AI-compiled for this hackathon):\n${JSON.stringify(content, null, 2)}`,
          MAX_RESOURCE_BLOCK_CHARS,
        );
      }
    }

    const ctx = input.hackathon_context;
    const problemStatements = Array.isArray(ctx.problem_statements) ? ctx.problem_statements : [];
    const sponsorTracks = Array.isArray(ctx.sponsor_tracks) ? ctx.sponsor_tracks : [];
    const hostTechnicalResources = Array.isArray(ctx.technical_resources)
      ? ctx.technical_resources
      : [];

    const technicalResources =
      hostTechnicalResources.length > 0
        ? `Technical Resources (host-provided):\n${hostTechnicalResources
            .map((r) => `- ${r.description ? `${r.description}: ` : ""}${r.url}`)
            .join("\n")}`
        : "";

    const contextBlock = truncateText(
      [
      `HACKATHON CONTEXT:`,
      ctx.theme ? `Theme: ${ctx.theme}` : "",
      `Problem Statements:\n${problemStatements.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
      sponsorTracks.length > 0
        ? `Sponsor Tracks:\n${sponsorTracks.map((t) => `- ${t.sponsor}: ${t.track_description}`).join("\n")}`
        : "",
      technicalResources,
      resourceBlock,
      ]
        .filter(Boolean)
        .join("\n\n"),
      MAX_CONTEXT_BLOCK_CHARS,
    );

    const history = summarizeConversationHistory(input.conversation_history || [], MAX_HISTORY);
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: truncateText(m.content, MAX_HISTORY_MESSAGE_CHARS) }],
      })),
      { role: "user" as const, parts: [{ text: truncateText(input.message, MAX_MESSAGE_CHARS) }] },
    ];

    const response = await streamContent("flash", contents, {
      systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
      temperature: 0.6,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
    if (isGeminiRateLimitError(message)) {
      return new Response(
        JSON.stringify({
          error: "Tech Buddy is temporarily busy. Please wait a bit and try again.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
