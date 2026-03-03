import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { ai, MODELS } from "../../lib/gemini-client";

export interface DemoReaderOutput {
  summary: string;
  key_features: string[];
  problem_addressed: string;
  tech_mentioned: string[];
  timestamps: { label: string; time_seconds: number }[];
  problem_alignment?: "high" | "medium" | "low";
  problem_alignment_reason?: string;
  raw_transcript: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function analyzeYoutube(
  url: string,
  problemStatement?: string
): Promise<DemoReaderOutput> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const alignmentClause = problemStatement
    ? `6. Compare the project against this problem statement and assess alignment (high/medium/low with reason): "${problemStatement}"`
    : "";

  const extractionPrompt = `You are a YouTube Demo Analyst for booster project submissions.
Analyze the provided YouTube video and extract structured information.

TASKS:
1. Write a 2-3 sentence summary of what the project does.
2. Extract key features mentioned (as bullet points).
3. Identify the core problem being solved.
4. List any technologies mentioned verbally.
5. Extract timestamps for key moments.
${alignmentClause}

Return a STRICT JSON object:
{
  "summary": "2-3 sentence summary",
  "key_features": ["feature1", "feature2"],
  "problem_addressed": "the core problem",
  "tech_mentioned": ["React", "Firebase"],
  "timestamps": [{"label": "Introduction", "time_seconds": 0}, {"label": "Demo", "time_seconds": 60}],
  ${problemStatement ? '"problem_alignment": "high|medium|low",' : ""}
  ${problemStatement ? '"problem_alignment_reason": "one-line reason",' : ""}
  "raw_transcript": "Full synthesized transcript of the video content"
}`;

  const contents = [
    {
      fileData: {
        fileUri: url,
        mimeType: "video/mp4" as const,
      },
    },
    { text: extractionPrompt },
  ];

  const response = await ai.models.generateContent({
    model: MODELS.pro,
    contents,
    config: { responseMimeType: "application/json", temperature: 0.1 },
  });

  if (!response.text) throw new Error("Failed to get response from Gemini");
  const result = JSON.parse(response.text);

  return {
    summary: result.summary || "",
    key_features: result.key_features || [],
    problem_addressed: result.problem_addressed || "",
    tech_mentioned: result.tech_mentioned || [],
    timestamps: result.timestamps || [],
    ...(result.problem_alignment ? { problem_alignment: result.problem_alignment } : {}),
    ...(result.problem_alignment_reason ? { problem_alignment_reason: result.problem_alignment_reason } : {}),
    raw_transcript: result.raw_transcript || "",
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  try {
    const { youtube_url, problem_statement } = await request.json();

    if (!youtube_url) {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const result = await analyzeYoutube(youtube_url, problem_statement);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("demo-reader error:", message);
    return NextResponse.json({ error: "Failed to analyze video", message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
