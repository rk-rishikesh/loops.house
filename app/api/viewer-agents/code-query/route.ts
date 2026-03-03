import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { queryCode } from "../../sub-agents/code-reader/route";
import { checkRateLimit } from "../../lib/rate-limiter";
import { generateContent } from "../../lib/gemini-client";

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_CODE_QUERY || "20", 10);

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

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { allowed, remaining, resetAt } = await checkRateLimit(`code-query:${auth.user.id}`, RATE_LIMIT);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(resetAt).toISOString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { project_id, question, project } = body as {
      project_id: string;
      question: string;
      project?: ProjectContext;
    };

    if (!project_id || !question) {
      return NextResponse.json(
        { error: "project_id and question are required" },
        { status: 400 }
      );
    }

    let answer: string;

    if (project && (project.name || project.refined_description || project.flattened_codebase)) {
      const context = buildKbContext(project);
      const response = await generateContent("pro", [
        {
          role: "user",
          parts: [
            {
              text: `You are a code expert. Answer the following question about this project/codebase based on the provided context.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, detailed answer grounded in the context.`,
            },
          ],
        },
      ]);
      answer = response.text || "Unable to generate an answer.";
    } else {
      answer = await queryCode(project_id, question);
    }

    return NextResponse.json(
      { answer },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": new Date(resetAt).toISOString(),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
