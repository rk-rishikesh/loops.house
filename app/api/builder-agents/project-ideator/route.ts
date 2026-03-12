import type { NextRequest } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { streamContent } from "../../lib/gemini-client";

interface IdeatorInput {
  message: string;
  conversation_history: { role: "user" | "assistant"; content: string }[];
  hackathon_context?: {
    problem_statements: string[];
    sponsor_tracks?: { sponsor: string; track_description: string }[];
    theme?: string;
  };
  booster_context?: IdeatorInput["hackathon_context"];
  project_snapshot?: {
    name?: string;
    description?: string;
    tech_stack?: string[];
  };
}

const SYSTEM_PROMPT = `You are a product-focused hackathon mentor. Your job is to help the builder discover and refine a project idea that fits the hackathon's problem statements and their own interests.

RULES:
- Ask clarifying questions about the builder's skills, interests, and what problem they personally want to solve.
- Always tie suggestions back to one or more of the provided problem statements.
- Help the builder think about: uniqueness, feasibility, wow-factor for judges, and whether the idea fits a sponsor track.
- Do NOT write code. Do NOT solve bugs. Do NOT suggest specific libraries unless asked.
- When an idea is becoming solid, prompt the builder to define: the core problem, the target user, the MVP scope, and one key differentiator.
- If asked to write code or debug, politely redirect: "I'm here to help with direction and ideas — for technical questions, try Tech Buddy!"
- Keep responses concise and actionable.`;

const MAX_HISTORY = 15;

function summarizeHistory(
  history: { role: string; content: string }[],
): { role: string; content: string }[] {
  if (history.length <= MAX_HISTORY) return history;
  const older = history.slice(0, history.length - MAX_HISTORY);
  const recent = history.slice(history.length - MAX_HISTORY);
  const summary = older.map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join("\n");
  return [{ role: "user", content: `[Earlier conversation summary]\n${summary}` }, ...recent];
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const input: IdeatorInput = await request.json();

    if (!input.message) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ctx = input.hackathon_context ?? input.booster_context;
    if (!ctx) {
      return new Response(JSON.stringify({ error: "hackathon_context is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const contextBlock = [
      `HACKATHON CONTEXT:`,
      ctx.theme ? `Theme: ${ctx.theme}` : "",
      `Problem Statements:\n${ctx.problem_statements.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
      ctx.sponsor_tracks?.length
        ? `Sponsor Tracks:\n${ctx.sponsor_tracks.map((t) => `- ${t.sponsor}: ${t.track_description}`).join("\n")}`
        : "",
      input.project_snapshot
        ? `BUILDER'S CURRENT IDEA:\nName: ${input.project_snapshot.name || "TBD"}\nDescription: ${input.project_snapshot.description || "TBD"}\nTech: ${input.project_snapshot.tech_stack?.join(", ") || "TBD"}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const history = summarizeHistory(input.conversation_history || []);

    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      })),
      {
        role: "user" as const,
        parts: [{ text: input.message }],
      },
    ];

    const response = await streamContent("flash", contents, {
      systemInstruction: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
      temperature: 0.7,
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
