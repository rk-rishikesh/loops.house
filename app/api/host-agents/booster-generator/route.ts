import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "../../lib/gemini-client";

interface BoosterInput {
  id: string;
  name: string;
  theme?: string;
  booster_type?: "idea" | "momentum" | "capital";
  problem_statements: string[];
  website_url?: string;
  technical_docs?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  timeline?: string;
  organizer_notes?: string;
}

interface ProgramDraft {
  /** AI-suggested public name for the booster/program */
  booster_name: string;
  /** AI-suggested stable ID/slug (e.g. "ai-copilot-bootcamp-2025") */
  booster_id_suggestion: string;
  overview: string;
  target_audience: string;
  goals: string[];
  challenge_statements: {
    title: string;
    summary: string;
    primary_problem?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
  }[];
  schedule: {
    phase: string;
    description: string;
  }[];
  submission_requirements: string[];
  judging_criteria: {
    name: string;
    description: string;
  }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface BoosterProgramResponse {
  booster_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booster: BoosterInput | undefined = body?.booster;

    if (!booster || !booster.id || !booster.name) {
      return NextResponse.json(
        { error: "booster with id and name is required" },
        { status: 400 }
      );
    }

    const boosterBlock = JSON.stringify(
      {
        id: booster.id,
        name: booster.name,
        theme: booster.theme,
        booster_type: booster.booster_type,
        problem_statements: booster.problem_statements,
        website_url: booster.website_url,
        technical_docs: booster.technical_docs,
        bounty_pool_summary: booster.bounty_pool_summary,
        program_goal: booster.program_goal,
        timeline: booster.timeline,
        organizer_notes: booster.organizer_notes,
      },
      null,
      2
    );

    const prompt = `You are a program designer for a builder booster (idea / momentum / capital). A host has filled out an onboarding form. Using ONLY that information, draft a complete but editable program.

BOOSTER INPUT (from host):
${boosterBlock}

TASK:
- Turn this host brief into a clear program draft that a human organizer can lightly edit before publishing.
- Propose a strong public-facing booster name and a stable ID/slug.
- Focus on: overview, audience, goals, challenge statements, timeline/schedule, submission requirements, judging criteria, and documentation outline.
- Assume this is a remote-first, async-friendly program unless the input explicitly suggests otherwise.

RULES:
- Be concrete but keep everything editable — avoid hard-coding dates/times if they are not provided, use relative language instead (e.g., "Week 1").
- Derive challenge statements from the problem_statements and program_goal.
- Make judging criteria aligned with the stated goals and (if present) any bounty pool or sponsor tracks.
- If some fields are missing (e.g., technical_docs), still produce a best-effort draft and leave explicit TODO-style notes for the organizer.
- Keep language concise and builder-friendly.
- The booster_id_suggestion should be a URL-safe slug: lowercase, words separated by hyphens, no spaces.

Return STRICT JSON matching this TypeScript type:

{
  "booster_name": string; // AI-suggested marketing name for the booster
  "booster_id_suggestion": string; // URL-safe slug, e.g. "ai-copilot-bootcamp-2025"
  "overview": string; // 2-3 sentence summary of the program
  "target_audience": string; // who this is for
  "goals": string[]; // 3-6 bullet goals
  "challenge_statements": {
    "title": string;
    "summary": string;
    "primary_problem"?: string;
    "difficulty"?: "beginner" | "intermediate" | "advanced";
  }[];
  "schedule": {
    "phase": string; // e.g. "Week 1: Onboarding & Ideation"
    "description": string;
  }[];
  "submission_requirements": string[]; // checklist style
  "judging_criteria": {
    "name": string;
    "description": string;
  }[];
  "documentation_plan": string[]; // which docs/pages to prepare
  "organizer_notes": string[]; // explicit TODOs or caveats for the human organizer
}`;

    const draft = await generateJSON<ProgramDraft>("flash", prompt);

    const response: BoosterProgramResponse = {
      booster_id: booster.id,
      draft,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

