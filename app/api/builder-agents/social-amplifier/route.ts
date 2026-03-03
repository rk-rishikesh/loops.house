import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { generateJSON } from "../../lib/gemini-client";

interface SocialInput {
  project: {
    name: string;
    tagline: string;
    refined_description: string;
    tech_stack_tags: string[];
    category: string;
    key_features: string[];
    loops_profile_url: string;
  };
  booster?: {
    name: string;
    result?: "winner" | "runner-up" | "finalist" | "participant";
  };
  tone?: "professional" | "casual" | "excited";
}

interface SocialOutput {
  linkedin_post: string;
  twitter_post: string;
  suggested_hashtags: string[];
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["builder", "host", "admin"]);
  if (!auth) return unauthorized();

  try {
    const input: SocialInput = await request.json();

    if (!input.project?.name || !input.project?.tagline) {
      return NextResponse.json(
        { error: "project.name and project.tagline are required" },
        { status: 400 }
      );
    }

    const tone = input.tone || "excited";
    const booster = input.booster;
    const resultLine = booster?.result
      ? `The builder achieved: ${booster.result} at ${booster.name}.`
      : booster
        ? `This was built at ${booster.name}.`
        : "";

    const prompt = `Generate social media posts for a project. Output ONLY plain text (no markdown formatting in the post content).

Project:
- Name: ${input.project.name}
- Tagline: ${input.project.tagline}
- Description: ${input.project.refined_description}
- Tech: ${input.project.tech_stack_tags.join(", ")}
- Category: ${input.project.category}
- Features: ${input.project.key_features.join(", ")}
- Profile URL: ${input.project.loops_profile_url}
${resultLine}

Tone: ${tone}

RULES:
- LinkedIn: 150-250 words, professional tone, what the project does, tech used, link, max 5 hashtags
- Twitter/X: Under 280 characters, punchy, include link and 2-3 hashtags
- NEVER fabricate results or achievements not provided
- All content must be plain text only, no markdown

Return JSON:
{
  "linkedin_post": "the linkedin post text",
  "twitter_post": "the twitter post text",
  "suggested_hashtags": ["hashtag1", "hashtag2"]
}`;

    const result = await generateJSON<SocialOutput>("flash", prompt);

    return NextResponse.json({
      linkedin_post: result.linkedin_post || "",
      twitter_post: result.twitter_post || "",
      suggested_hashtags: result.suggested_hashtags || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";
