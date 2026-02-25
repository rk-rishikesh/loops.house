import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { generateJSON } from "../../lib/gemini-client";
import { getChunks } from "../../lib/vector-store";

interface JudgingCriterion {
  name: string;
  description: string;
  weight: number;
  max_score: number;
}

interface ProjectPayload {
  name: string;
  tagline?: string;
  refined_description?: string;
  description?: string;
  key_features?: string[];
  tech_stack_tags?: string[];
  category?: string;
  flattened_codebase?: string;
}

interface BoosterPayload {
  id: string;
  name: string;
  theme?: string;
  problem_statements: string[];
  sponsor_tracks?: { sponsor: string; track_description: string }[];
}

interface EvaluatorInput {
  project_id: string;
  booster_id: string;
  judging_rubric?: {
    criteria: JudgingCriterion[];
  };
  judge_mode: "preview" | "official";
  project?: ProjectPayload;
  booster?: BoosterPayload;
}

interface CriterionScore {
  criterion_name: string;
  score: number;
  max_score: number;
  justification: string;
  strength: string;
  improvement: string;
}

const DEFAULT_CRITERIA: JudgingCriterion[] = [
  {
    name: "Code Integration & Technical Depth",
    description: "Is the code substantive? Are APIs/SDKs used meaningfully?",
    weight: 0.25,
    max_score: 100,
  },
  {
    name: "Ideation & Problem Definition",
    description: "Is there a clear problem? Is the solution well-reasoned?",
    weight: 0.20,
    max_score: 100,
  },
  {
    name: "Uniqueness & Innovation",
    description: "Is this differentiated? Does it bring a fresh angle?",
    weight: 0.20,
    max_score: 100,
  },
  {
    name: "Product Readiness",
    description: "Does the demo work? Is there a UI? Is it documented?",
    weight: 0.20,
    max_score: 100,
  },
  {
    name: "Track/Sponsor Fit",
    description: "Does it align with the booster theme or sponsor tracks?",
    weight: 0.15,
    max_score: 100,
  },
];

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["host", "judge", "admin"]);
  if (!auth) return unauthorized();

  try {
    const input: EvaluatorInput = await request.json();

    const boosterId = input.booster_id ?? (input as { hackathon_id?: string }).hackathon_id;
    if (!input.project_id || !boosterId) {
      return NextResponse.json(
        { error: "project_id and booster_id are required" },
        { status: 400 }
      );
    }

    let kbSummary: string;
    let kbSize: number;
    let kbChunks: number;

    if (input.project) {
      const p = input.project;
      const parts = [
        `Project: ${p.name}`,
        p.tagline ? `Tagline: ${p.tagline}` : "",
        p.refined_description || p.description ? `Description:\n${p.refined_description || p.description}` : "",
        p.key_features?.length ? `Key features:\n${p.key_features.map((f) => `- ${f}`).join("\n")}` : "",
        p.tech_stack_tags?.length ? `Tech stack: ${p.tech_stack_tags.join(", ")}` : "",
        p.category ? `Category: ${p.category}` : "",
        p.flattened_codebase ? `\n--- Code (excerpt) ---\n${p.flattened_codebase.slice(0, 50000)}` : "",
      ].filter(Boolean);
      kbSummary = parts.join("\n\n");
      kbSize = kbSummary.length;
      kbChunks = 1;
    } else {
      const chunks = await getChunks(input.project_id);
      if (!chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: "No knowledge base found for this project. Send project data from the Host Judging page or run profile-creator first." },
          { status: 404 }
        );
      }
      kbSummary = chunks.map((c) => c.text).join("\n\n---\n\n");
      kbSize = kbSummary.length;
      kbChunks = chunks.length;
    }
    const criteria = input.judging_rubric?.criteria?.length
      ? input.judging_rubric.criteria
      : DEFAULT_CRITERIA;

    const criteriaScores: CriterionScore[] = [];

    const booster = input.booster ?? (input as { hackathon?: BoosterPayload }).hackathon;
    const boosterBlock = booster
      ? `\nBOOSTER CONTEXT (use for Track/Sponsor Fit):\nName: ${booster.name}\nTheme: ${booster.theme ?? "N/A"}\nProblem statements: ${(booster.problem_statements ?? []).join("; ")}\nSponsor tracks: ${(booster.sponsor_tracks ?? []).map((t) => `${t.sponsor}: ${t.track_description}`).join("; ") || "N/A"}`
      : "";

    // Evaluate all criteria in parallel for ~5x speedup
    const criteriaResults = await Promise.all(
      criteria.map(async (criterion) => {
        const prompt = `You are an AI judge for a booster (idea/momentum/capital). Evaluate this project on a single criterion.

PROJECT KNOWLEDGE BASE:
${kbSummary.slice(0, 100000)}
${boosterBlock}

CRITERION: ${criterion.name}
DESCRIPTION: ${criterion.description}
MAX SCORE: ${criterion.max_score}

RULES:
- Score ONLY based on evidence in the knowledge base above.
- If the knowledge base doesn't have enough data for this criterion, score conservatively (40/${criterion.max_score}) and state the reason.
- Be specific in justification — reference actual evidence from the knowledge base.

Return JSON:
{
  "score": number (0-${criterion.max_score}),
  "justification": "2-3 sentence justification with specific evidence",
  "strength": "one specific strength",
  "improvement": "one specific improvement suggestion"
}`;

        const result = await generateJSON<{
          score: number;
          justification: string;
          strength: string;
          improvement: string;
        }>("pro", prompt);

        return {
          criterion_name: criterion.name,
          score: Math.min(Math.max(result.score || 40, 0), criterion.max_score),
          max_score: criterion.max_score,
          justification: result.justification || "Insufficient data for evaluation.",
          strength: result.strength || "N/A",
          improvement: result.improvement || "N/A",
        } satisfies CriterionScore;
      })
    );
    criteriaScores.push(...criteriaResults);

    const overallScore = criteria.reduce((sum, criterion, i) => {
      const normalized = criteriaScores[i].score / criterion.max_score;
      return sum + normalized * criterion.weight * 100;
    }, 0);

    const summaryPrompt = `Based on these criterion scores for a booster project, write a 1-paragraph holistic assessment (3-4 sentences).

Scores:
${criteriaScores.map((c) => `- ${c.criterion_name}: ${c.score}/${c.max_score} — ${c.justification}`).join("\n")}

Overall: ${Math.round(overallScore)}/100

Return JSON: { "summary": "the paragraph" }`;

    const summaryResult = await generateJSON<{ summary: string }>("pro", summaryPrompt);

    return NextResponse.json({
      project_id: input.project_id,
      booster_id: boosterId,
      overall_score: Math.round(overallScore),
      overall_summary: summaryResult.summary || "",
      criteria_scores: criteriaScores,
      judge_mode: input.judge_mode,
      generated_at: new Date().toISOString(),
      model_version: "gemini-2.5-pro",
      _audit: {
        kb_size: kbSize,
        kb_chunks: kbChunks,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("project-evaluator error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
