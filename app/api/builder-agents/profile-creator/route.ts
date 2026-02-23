import { NextRequest } from "next/server";
import { flattenAndIndex } from "../../sub-agents/code-reader/route";
import { analyzeYoutube } from "../../sub-agents/demo-reader/route";
import { analyzeTheme } from "../../sub-agents/theme-reader/route";
import { buildKnowledgeBase } from "../../lib/knowledge-base";
import { createSSEStream, sseResponse } from "../../lib/sse";
import { generateJSON } from "../../lib/gemini-client";

interface ProfileInput {
  project_id: string;
  team_id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  github_url?: string;
  youtube_url?: string;
  screenshot_urls?: string[];
  additional_links?: { label: string; url: string }[];
  social_links?: { label: string; url: string }[];
  booster_id?: string;
}

function mergeTechStack(
  fromCode: string[],
  fromDemo: string[] | undefined
): string[] {
  const set = new Set<string>();
  fromCode.forEach((t) => set.add(t.trim()));
  fromDemo?.forEach((t) => set.add(t.trim()));
  return Array.from(set).filter(Boolean);
}

export async function POST(request: NextRequest) {
  const input: ProfileInput = await request.json();

  if (!input.project_id || !input.name || !input.description) {
    return new Response(
      JSON.stringify({ error: "project_id, name, and description are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { stream, send, close } = createSSEStream();

  (async () => {
    try {
      send("progress", { step: "started", message: "Profile generation started" });

      if (!input.github_url) {
        send("progress", { step: "code-reader", status: "skipped", message: "No GitHub URL provided" });
      }
      if (!input.youtube_url) {
        send("progress", { step: "demo-reader", status: "skipped", message: "No YouTube URL provided" });
      }
      if (!input.screenshot_urls?.length && !input.logo_url) {
        send("progress", { step: "theme-reader", status: "skipped", message: "No logo or screenshots provided" });
      }

      const codePromise = input.github_url
        ? (async () => {
            send("progress", { step: "code-reader", status: "started" });
            try {
              const result = await flattenAndIndex(input.github_url!);
              send("progress", { step: "code-reader", status: "done" });
              return result;
            } catch (e) {
              send("progress", { step: "code-reader", status: "failed", error: String(e) });
              return null;
            }
          })()
        : Promise.resolve(null);

      const demoPromise = input.youtube_url
        ? (async () => {
            send("progress", { step: "demo-reader", status: "started" });
            try {
              const result = await analyzeYoutube(input.youtube_url!);
              send("progress", { step: "demo-reader", status: "done" });
              return result;
            } catch (e) {
              send("progress", { step: "demo-reader", status: "failed", error: String(e) });
              return null;
            }
          })()
        : Promise.resolve(null);

      const themePromise = (input.screenshot_urls?.length || input.logo_url)
        ? (async () => {
            send("progress", { step: "theme-reader", status: "started" });
            try {
              const result = await analyzeTheme(input.screenshot_urls || [], input.logo_url);
              send("progress", { step: "theme-reader", status: "done" });
              return result;
            } catch (e) {
              send("progress", { step: "theme-reader", status: "failed", error: String(e) });
              return null;
            }
          })()
        : Promise.resolve(null);

      const [codeResult, demoResult, themeResult] = await Promise.all([
        codePromise,
        demoPromise,
        themePromise,
      ]);

      send("progress", { step: "knowledge-base", status: "started" });

      const kbSections: { source: "code" | "demo" | "theme" | "profile"; content: string }[] = [
        { source: "profile", content: `${input.name}\n\n${input.description}` },
      ];

      if (codeResult) {
        kbSections.push({ source: "code", content: codeResult.flattened_codebase });
      }
      if (demoResult) {
        kbSections.push({
          source: "demo",
          content: [
            `Summary: ${demoResult.summary}`,
            `Problem addressed: ${demoResult.problem_addressed}`,
            `Key features:\n${demoResult.key_features.map((f) => `- ${f}`).join("\n")}`,
            demoResult.tech_mentioned.length ? `Tech mentioned: ${demoResult.tech_mentioned.join(", ")}` : "",
            demoResult.timestamps.length
              ? `Key moments:\n${demoResult.timestamps.map((t) => `[${t.time_seconds}s] ${t.label}`).join("\n")}`
              : "",
            `Transcript:\n${demoResult.raw_transcript}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        });
      }
      if (themeResult) {
        kbSections.push({
          source: "theme",
          content: `Color palette: primary ${themeResult.primary_color}, accent ${themeResult.accent_color}, secondary ${themeResult.secondary_color}. Theme: ${themeResult.theme_label}. ${themeResult.design_description}`,
        });
      }

      const projectId = codeResult?.project_id || input.project_id;
      const { chunkCount } = await buildKnowledgeBase({
        projectId,
        sections: kbSections,
      });

      send("progress", { step: "knowledge-base", status: "done" });

      const techStackTags = mergeTechStack(
        codeResult?.tech_stack || [],
        demoResult?.tech_mentioned
      );

      let tagline: string;
      try {
        const taglineResult = await generateJSON<{ tagline: string }>(
          "flash",
          `Generate a single, punchy tagline for this project (max 120 characters). It should be compelling and descriptive.

Project name: ${input.name}
Description: ${input.description.slice(0, 800)}
${techStackTags.length ? `Tech stack: ${techStackTags.slice(0, 15).join(", ")}` : ""}
${demoResult?.key_features?.length ? `Key points: ${demoResult.key_features.slice(0, 5).join("; ")}` : ""}

Return JSON only: { "tagline": "Your tagline here" }`
        );
        tagline = typeof taglineResult?.tagline === "string" && taglineResult.tagline.trim().length > 0
          ? taglineResult.tagline.trim().slice(0, 120)
          : "";
      } catch {
        tagline = "";
      }
      if (!tagline) {
        const firstSentence = input.description.replace(/\n.*/s, "").trim().slice(0, 140);
        tagline = firstSentence ? (firstSentence.length < 140 ? firstSentence : firstSentence.slice(0, 137) + "...") : input.name;
      }

      const MAX_FLATTENED_DISPLAY = 80_000;
      const flattened_codebase = codeResult?.flattened_codebase
        ? codeResult.flattened_codebase.length > MAX_FLATTENED_DISPLAY
          ? codeResult.flattened_codebase.slice(0, MAX_FLATTENED_DISPLAY) + "\n\n... (truncated for storage)"
          : codeResult.flattened_codebase
        : undefined;

      const profileResponse = {
        project_id: projectId,
        tagline,
        category: "Other",
        refined_description: input.description,
        tech_stack_tags: techStackTags,
        primary_color: themeResult?.primary_color ?? "#1A1A2E",
        accent_color: themeResult?.accent_color ?? "#6C3BF5",
        secondary_color: themeResult?.secondary_color ?? "#FFFFFF",
        theme_label: themeResult?.theme_label ?? "dark-minimal",
        key_features: demoResult?.key_features ?? [],
        tech_from_code: codeResult?.tech_stack ?? [],
        knowledge_base_id: projectId,
        knowledge_base_chunks: chunkCount,
        kb_sections: kbSections.map((s) => s.source),
        name: input.name,
        description: input.description,
        logo_url: input.logo_url,
        website_url: input.website_url,
        github_url: input.github_url,
        youtube_url: input.youtube_url,
        screenshot_urls: input.screenshot_urls,
        additional_links: input.additional_links,
        social_links: input.social_links,
        booster_id: input.booster_id,
      };

      send("complete", profileResponse);
      if (flattened_codebase) {
        send("flattened_codebase", { project_id: projectId, flattened_codebase });
      }
    } catch (error) {
      send("error", { message: error instanceof Error ? error.message : "Profile generation failed" });
    } finally {
      close();
    }
  })();

  return sseResponse(stream);
}

export const runtime = "nodejs";
export const maxDuration = 90;
export const dynamic = "force-dynamic";
