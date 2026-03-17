import { upsertHackathonResources } from "@/lib/db/hackathon-resources";
import type { StoredHackathon } from "@/lib/data-mappers";
import type { Json } from "@/lib/supabase/types";

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

export interface ResourcePlan {
  technical_cheatsheet: string;
  tracks: ResourceTrackPlan[];
  challenge_resource_map: ChallengeResourceMap[];
}

export async function generateAndPersistResources(hackathon: StoredHackathon): Promise<ResourcePlan> {
  // Dynamic import to avoid pulling gemini-client into server action bundles
  const { generateJSON } = await import("@/app/api/lib/gemini-client");

  const sourceUrls: string[] = [];
  if (hackathon.website_url) sourceUrls.push(hackathon.website_url);
  for (const r of hackathon.technical_resources ?? []) {
    if (r.url) sourceUrls.push(r.url);
  }

  const hackathonBlock = JSON.stringify(
    {
      name: hackathon.name,
      theme: hackathon.theme,
      description: hackathon.description,
      problem_statements: hackathon.problem_statements,
      website_url: hackathon.website_url,
      technical_resources: hackathon.technical_resources,
      bounty_pool_summary: hackathon.bounty_pool_summary,
      program_goal: hackathon.program_goal,
      start_date: hackathon.start_date,
      submission_deadline: hackathon.submission_deadline,
      judging_deadline: hackathon.judging_deadline,
      results_date: hackathon.results_date,
      organizer_notes: hackathon.organizer_notes,
      judging_criteria: hackathon.judging_criteria,
    },
    null,
    2,
  );

  const prompt = `You are the Resource Provisioner AI for a hackathon platform. Your job is to compile comprehensive technical resources that help builders start building serious projects.

HACKATHON DATA:
${hackathonBlock}

SOURCE URLS TO CONSIDER:
${sourceUrls.length > 0 ? sourceUrls.map((u) => `- ${u}`).join("\n") : "None provided"}

TASK:
1. Create a concise technical cheatsheet (markdown): key APIs/SDKs, auth patterns, rate limits, typical flows.
2. Propose 3-6 thematic tracks with descriptions, docs to prepare, starter repos, and example endpoints.
3. Map each problem statement to recommended tracks, key docs, and getting-started steps.

RULES:
- If a website URL is present, treat it as the canonical source and build around it.
- If technical_resources are provided, incorporate their descriptions and URLs.
- If information is missing, produce a best-effort plan with TODO notes.
- Be opinionated and practical — builders need to start coding within hours.

Return STRICT JSON:
{
  "technical_cheatsheet": string,
  "tracks": [{ "name": string, "description": string, "docs_to_prepare": string[], "starter_repos_or_templates": string[], "example_apis_or_endpoints": string[] }],
  "challenge_resource_map": [{ "challenge_title": string, "recommended_tracks": string[], "key_docs": string[], "getting_started_steps": string[] }]
}`;

  const resources = await generateJSON<ResourcePlan>("flash", prompt);

  await upsertHackathonResources(hackathon.id, resources as unknown as Json, sourceUrls);

  return resources;
}
