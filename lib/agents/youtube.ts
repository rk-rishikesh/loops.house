import { GoogleGenAI } from "@google/genai";
import { YoutubeTranscript } from "youtube-transcript";

export interface YoutubeAnalysisResult {
  title: string;
  transcript: string;
  keyMoments: { time: string; description: string }[];
  insights: { summary?: string; coreTakeaway?: string; techStack?: string[] };
  fullContent: string;
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

function isPermissionDenied(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("403") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("caller does not have permission")
  );
}

const EXTRACTION_PROMPT = `
You are a YouTube Content Analyst.
Analyze the provided YouTube video content and extract the most important information.

TASK:
1. Identify the main topic/content.
2. Extract Key Moments or major points (use approximate timestamps if the transcript has timing cues, else use "0:00" or estimate from context).
3. Provide deep technical/narrative insights.
4. Create a comprehensive synthesis of the content.

Return a STRICT JSON object:
{
    "title": "Clean, descriptive title of the video",
    "transcript": "A deep-dive technical synthesis of the video content.",
    "keyMoments": [
        { "time": "MM:SS", "description": "Short description" }
    ],
    "insights": {
        "summary": "2-3 sentence overview",
        "coreTakeaway": "The fundamental lesson",
        "techStack": ["Relevant technologies if mentioned"]
    }
}
`;

function buildResult(aiResult: Record<string, unknown>, url: string): YoutubeAnalysisResult {
  const insights = (aiResult.insights as YoutubeAnalysisResult["insights"]) || {
    summary: aiResult.transcript as string,
  };
  return {
    title: (aiResult.title as string) || "YouTube Video",
    transcript:
      (aiResult.transcript as string) || insights.summary || "Synthesis provided by Gemini.",
    keyMoments: (aiResult.keyMoments as YoutubeAnalysisResult["keyMoments"]) || [],
    insights,
    fullContent: `YouTube Video: ${url}\n\nSynthesis: ${(aiResult.transcript as string) || ""}`,
  };
}

export async function analyzeYoutube(url: string): Promise<YoutubeAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

  const ai = new GoogleGenAI({ apiKey });
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const directContents = [
    { fileData: { fileUri: url, mimeType: "video/mp4" as const } },
    { text: EXTRACTION_PROMPT },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: directContents,
      config: { responseMimeType: "application/json", temperature: 0.1 },
    });
    if (!response.text) throw new Error("Failed to get response from Gemini");
    const aiResult = JSON.parse(response.text) as Record<string, unknown>;
    return buildResult(aiResult, url);
  } catch (directError) {
    if (!isPermissionDenied(directError)) throw directError;
  }

  const chunks = await YoutubeTranscript.fetchTranscript(url);
  const transcriptText = chunks.map((c) => c.text).join(" ");
  if (!transcriptText.trim()) throw new Error("No transcript available for this video");

  const transcriptContents = [
    {
      text: `YouTube video transcript (URL: ${url}):\n\n${transcriptText}`,
    },
    { text: EXTRACTION_PROMPT },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: transcriptContents,
    config: { responseMimeType: "application/json", temperature: 0.1 },
  });
  if (!response.text) throw new Error("Failed to get response from Gemini");
  const aiResult = JSON.parse(response.text) as Record<string, unknown>;
  return buildResult(aiResult, url);
}
