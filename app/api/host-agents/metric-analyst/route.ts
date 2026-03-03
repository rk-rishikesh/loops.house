import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { generateJSON } from "../../lib/gemini-client";

interface BoosterPayload {
  id: string;
  name: string;
  theme?: string;
  problem_statements: string[];
  sponsor_tracks?: { sponsor: string; track_description: string }[];
}

interface MetricsPayload {
  total_submissions: number;
  submissions: { name: string; category?: string; tech_stack_tags?: string[]; created_at?: string }[];
  top_categories: { category: string; count: number }[];
  top_tech_stacks: { tech: string; count: number }[];
}

interface MetricInput {
  booster_id: string;
  report_type: "overview" | "submissions" | "builder-graph" | "momentum-leaderboard" | "full";
  as_of?: string;
  booster?: BoosterPayload;
  metrics?: MetricsPayload;
}

interface BoosterMetrics {
  total_registrations: number;
  total_teams: number;
  total_submissions: number;
  submission_rate: number;
  avg_momentum_score: number;
  top_categories: { category: string; count: number }[];
  top_tech_stacks: { tech: string; count: number }[];
  submissions_by_score_range: { range: string; count: number }[];
  recent_activity: { event: string; timestamp: string }[];
  builder_graph_data: {
    nodes: { id: string; team_name: string; category: string }[];
    edges: { from: string; to: string; relationship: string }[];
  };
}

interface AnalystOutput {
  narrative: string;
  highlights: string[];
}

async function fetchMetrics(_boosterId: string): Promise<BoosterMetrics> {
  // MVP: Return placeholder structure. In production, this queries the DB.
  // This function is the integration point for your database layer.
  return {
    total_registrations: 0,
    total_teams: 0,
    total_submissions: 0,
    submission_rate: 0,
    avg_momentum_score: 0,
    top_categories: [],
    top_tech_stacks: [],
    submissions_by_score_range: [],
    recent_activity: [],
    builder_graph_data: { nodes: [], edges: [] },
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["host", "admin"]);
  if (!auth) return unauthorized();

  try {
    const input: MetricInput = await request.json();

    const boosterId = input.booster_id ?? (input as { hackathon_id?: string }).hackathon_id;
    if (!boosterId) {
      return NextResponse.json({ error: "booster_id is required" }, { status: 400 });
    }

    const reportType = input.report_type || "full";
    const asOf = input.as_of || new Date().toISOString();
    const booster = input.booster ?? (input as { hackathon?: BoosterPayload }).hackathon ?? null;
    const clientMetrics = input.metrics ?? null;

    const totalSubmissions = clientMetrics ? clientMetrics.total_submissions : (await fetchMetrics(boosterId)).total_submissions;

    if (totalSubmissions === 0) {
      const narrative =
        booster?.name != null
          ? `No submissions have been received yet for **${booster.name}**. Once builders start submitting their projects, this report will include participation health, submission quality distribution, popular tech stacks, and notable patterns.`
          : "No submissions have been received yet for this booster. Once builders start submitting their projects, this report will include participation health, submission quality distribution, popular tech stacks, and notable patterns.";
      return NextResponse.json({
        narrative,
        raw_metrics: clientMetrics ?? { total_submissions: 0, submissions: [], top_categories: [], top_tech_stacks: [] },
        generated_at: asOf,
        highlights: [
          "No submissions received yet",
          booster?.name ? `Booster: ${booster.name}` : "Booster selected",
        ],
      });
    }

    const boosterBlock = booster
      ? JSON.stringify(
          {
            name: booster.name,
            theme: booster.theme,
            problem_statements: booster.problem_statements,
            sponsor_tracks: booster.sponsor_tracks,
          },
          null,
          2
        )
      : "";
    const metricsBlock = clientMetrics
      ? JSON.stringify(
          {
            total_submissions: clientMetrics.total_submissions,
            submissions_summary: clientMetrics.submissions.map((s) => ({
              name: s.name,
              category: s.category,
              tech_stack: s.tech_stack_tags,
            })),
            top_categories: clientMetrics.top_categories,
            top_tech_stacks: clientMetrics.top_tech_stacks,
          },
          null,
          2
        )
      : JSON.stringify(await fetchMetrics(boosterId), null, 2);

    const prompt = `You are an event analytics assistant. Based on this booster and its submission data, produce a concise report for the event host.

${boosterBlock ? `BOOSTER:\n${boosterBlock}\n\n` : ""}METRICS / SUBMISSIONS:
${metricsBlock}

Report type requested: ${reportType}

RULES:
- Cover: participation health, submission quality distribution, most popular tech stacks, and any notable patterns or concerns.
- Keep narrative under 400 words. Be factual and direct.
- Extract 3-5 one-line key takeaways as highlights.
- Never include specific team or builder names.

Return JSON:
{
  "narrative": "the report narrative",
  "highlights": ["takeaway 1", "takeaway 2", "takeaway 3"]
}`;

    const result = await generateJSON<AnalystOutput>("flash", prompt);

    return NextResponse.json({
      narrative: result.narrative,
      raw_metrics: clientMetrics ?? null,
      generated_at: asOf,
      highlights: result.highlights || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 15;
export const dynamic = "force-dynamic";
