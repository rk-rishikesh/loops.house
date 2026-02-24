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
  booster_id: string;
  resources: ResourcePlan;
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

    const prompt = `You are the Resource Provisioner AI for a builder booster (idea / momentum / capital). A host has filled out an onboarding form and a separate program generator will handle schedule & judging. Your job is to define the technical resources.

BOOSTER INPUT (from host):
${boosterBlock}

TASK:
- Propose a technical resource plan that makes it very easy for builders to start building serious projects for this booster.
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
      booster_id: booster.id,
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

