import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { generateJSON } from "../../lib/gemini-client";
import { checkRateLimit } from "../../lib/rate-limiter";

interface HackathonInput {
  id: string;
  name: string;
  theme?: string;
  problem_statements: string[];
  website_url?: string;
  technical_docs?: string;
  bounty_pool_summary?: string;
  program_goal?: string;
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
  organizer_notes?: string;
}

interface ResourceTrackPlan {
  name: string;
  description: string;
  docs_to_prepare: string[];
  starter_repos_or_templates: string[];
  example_apis_or_endpoints: string[];
}

interface ChallengeResourceMap {
  challenge_title: string;
  recommended_tracks: string[];
  key_docs: string[];
  getting_started_steps: string[];
}

interface ResourcePlan {
  technical_cheatsheet: string;
  tracks: ResourceTrackPlan[];
  challenge_resource_map: ChallengeResourceMap[];
}

interface ResourceProvisionerResponse {
  hackathon_id: string;
  resources: ResourcePlan;
  generated_at: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth((caps) => caps.isAdmin || caps.isEventCreator);
  if (!auth) return unauthorized();

  // Rate limit: 5 requests per day per user
  const rl = await checkRateLimit(`resource-prov:${auth.user.id}`, 5, 86400000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", remaining: rl.remaining, resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const hackathon: HackathonInput | undefined = body?.hackathon;

    if (!hackathon || !hackathon.id || !hackathon.name) {
      return NextResponse.json(
        { error: "hackathon with id and name is required" },
        { status: 400 }
      );
    }

    const hackathonBlock = JSON.stringify(
      {
        id: hackathon.id,
        name: hackathon.name,
        theme: hackathon.theme,
        problem_statements: hackathon.problem_statements,
        website_url: hackathon.website_url,
        technical_docs: hackathon.technical_docs,
        bounty_pool_summary: hackathon.bounty_pool_summary,
        program_goal: hackathon.program_goal,
        start_date: hackathon.start_date,
        submission_deadline: hackathon.submission_deadline,
        judging_deadline: hackathon.judging_deadline,
        results_date: hackathon.results_date,
        organizer_notes: hackathon.organizer_notes,
      },
      null,
      2
    );

    const prompt = `You are the Resource Provisioner AI for a hackathon. A host has filled out an onboarding form and a separate program generator will handle schedule & judging. Your job is to define the technical resources.

HACKATHON INPUT (from host):
${hackathonBlock}

TASK:
- Propose a technical resource plan that makes it very easy for builders to start building serious projects for this hackathon.
- Focus on: a concise technical cheatsheet, a small set of thematic tracks, and a mapping from challenge statements to resources.

ASSUMPTIONS:
- If technical_docs or a website are present, assume those are the canonical sources of truth and build around them.

RULES:
- The technical_cheatsheet should be a single markdown-style string: key APIs/SDKs, auth gotchas, rate limits, typical flows.
- tracks should be opinionated but not overwhelming: 3–6 tracks is ideal.
- For challenge_resource_map, assume challenge titles can be derived from the host's problem_statements. Use those problems as the challenge titles.
- If some information is missing, still produce a best-effort plan and add TODO-style notes where appropriate.

Return STRICT JSON matching this TypeScript type:

{
  "technical_cheatsheet": string;
  "tracks": {
    "name": string;
    "description": string;
    "docs_to_prepare": string[];
    "starter_repos_or_templates": string[];
    "example_apis_or_endpoints": string[];
  }[];
  "challenge_resource_map": {
    "challenge_title": string;
    "recommended_tracks": string[];
    "key_docs": string[];
    "getting_started_steps": string[];
  }[];
}`;

    const resources = await generateJSON<ResourcePlan>("flash", prompt);

    const response: ResourceProvisionerResponse = {
      hackathon_id: hackathon.id,
      resources,
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
