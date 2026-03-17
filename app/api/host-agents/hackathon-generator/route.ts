import { type NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { generateJSON } from "../../lib/gemini-client";
import { checkRateLimit } from "../../lib/rate-limiter";

interface HackathonInput {
  id: string;
  name: string;
  theme?: string;
  problem_statements: string[];
  website_url?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
  organizer_notes?: string;
}

interface ProgramDraft {
  /** AI-suggested public name for the hackathon/program */
  hackathon_name: string;
  /** AI-suggested stable ID/slug (e.g. "ai-copilot-bootcamp-2025") */
  hackathon_id_suggestion: string;
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
  prizes: {
    /** e.g. "1st Prize", "2nd Prize", "Best Design" */
    title: string;
    /** ISO currency code when possible, e.g. "USD" */
    currency: string;
    /** Numeric amount in main units (e.g. dollars, not cents) */
    amount: number;
    /** Optional details (cash, credits, swag, etc.) */
    description?: string;
  }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface HackathonProgramResponse {
  hackathon_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  // Rate limit: 5 requests per day per user
  const rl = await checkRateLimit(`hackathon-gen:${auth.user.id}`, 5, 86400000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Try again later.",
        remaining: rl.remaining,
        resetAt: rl.resetAt,
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const hackathon: HackathonInput | undefined = body?.hackathon;

    if (!hackathon || !hackathon.id || !hackathon.name) {
      return NextResponse.json(
        { error: "hackathon with id and name is required" },
        { status: 400 },
      );
    }

    const hackathonBlock = JSON.stringify(
      {
        id: hackathon.id,
        name: hackathon.name,
        theme: hackathon.theme,
        problem_statements: hackathon.problem_statements,
        website_url: hackathon.website_url,
        bounty_pool_summary: hackathon.bounty_pool_summary,
        program_goal: hackathon.program_goal,
        start_date: hackathon.start_date,
        submission_deadline: hackathon.submission_deadline,
        judging_deadline: hackathon.judging_deadline,
        results_date: hackathon.results_date,
        organizer_notes: hackathon.organizer_notes,
      },
      null,
      2,
    );

    const prompt = `You are a program designer for a hackathon. A host has filled out an onboarding form. Using ONLY that information, draft a complete but editable program.

HACKATHON INPUT (from host):
${hackathonBlock}

TASK:
- Turn this host brief into a clear program draft that a human organizer can lightly edit before publishing.
- Propose a strong public-facing hackathon name and a stable ID/slug.
- Focus on: overview, audience, goals, challenge statements, timeline/schedule, submission requirements, judging criteria, and documentation outline.
- Assume this is a remote-first, async-friendly program unless the input explicitly suggests otherwise.

RULES:
- Be concrete but keep everything editable.
- Always express schedule phases using ACTUAL DATES derived from the input (do not use "Day 1", "Week 1", "Month 1").
  - Use the host-provided ISO datetimes (start_date, submission_deadline, judging_deadline, results_date) to label phases like:
    - "Mar 13–Mar 15: Build"
    - "Mar 16: Submissions due"
    - "Mar 16–Mar 18: Judging"
    - "Mar 19: Results"
  - If a date is missing, use the closest available date(s) and note the missing date in organizer_notes.
- Derive challenge statements from the problem_statements and program_goal.
- Make judging criteria aligned with the stated goals and (if present) any bounty pool or sponsor tracks.
- If bounty_pool_summary is present, translate it into a structured prize breakdown in "prizes":
  - Parse total pool and any constraints from bounty_pool_summary (currency + amount).
  - If the host specifies an explicit split (e.g. "50/30/20" or exact amounts), follow it.
  - If the host specifies only "split in N projects" (or "top N"), create "1st Prize"..."Nth Prize".
    - If no ratio is specified, DO NOT split equally by default. Use a descending allocation:
      - For N=3, default to 50%, 30%, 20%.
      - For N=2, default to 60%, 40%.
      - For N>3, use a smoothly decreasing curve that sums to 100% (top-heavy), and round to sensible amounts.
  - If the host only provides a total pool with no N, choose a reasonable prize set (e.g. top 3) and explain the choice in organizer_notes.
  - If prizes are non-cash ("credits", "swag"), include them in prizes with amount 0 and a description.
- If some fields are missing, still produce a best-effort draft and leave explicit TODO-style notes for the organizer.
- Keep language concise and builder-friendly.
- The hackathon_id_suggestion should be a URL-safe slug: lowercase, words separated by hyphens, no spaces.
- In organizer_notes, include a brief explanation of why you chose the specific temporal units for the schedule (e.g., "Schedule based on a 48-hour sprint duration").

Return STRICT JSON matching this TypeScript type:

{
  "hackathon_name": string; // AI-suggested marketing name for the hackathon
  "hackathon_id_suggestion": string; // URL-safe slug, e.g. "ai-copilot-bootcamp-2025"
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
    "phase": string; // include actual dates, e.g. "Mar 13–Mar 15: Build"
    "description": string;
  }[];
  "submission_requirements": string[]; // checklist style
  "judging_criteria": {
    "name": string;
    "description": string;
  }[];
  "prizes": {
    "title": string;
    "currency": string;
    "amount": number;
    "description"?: string;
  }[];
  "documentation_plan": string[]; // which docs/pages to prepare
  "organizer_notes": string[]; // explicit TODOs or caveats for the human organizer
}`;

    const draft = await generateJSON<ProgramDraft>("flash", prompt);

    const response: HackathonProgramResponse = {
      hackathon_id: hackathon.id,
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
