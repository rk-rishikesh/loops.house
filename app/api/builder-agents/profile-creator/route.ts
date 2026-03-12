import { NextRequest } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { flattenAndIndex } from "../../sub-agents/code-reader/route";
import { analyzeYoutube } from "../../sub-agents/demo-reader/route";
import { analyzeTheme } from "../../sub-agents/theme-reader/route";
import { buildKnowledgeBase } from "../../lib/knowledge-base";
import { createSSEStream, sseResponse } from "../../lib/sse";
import { generateJSON } from "../../lib/gemini-client";

interface ProfileInput {
  project_id?: string;
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
  hackathon_id?: string;
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
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const input: ProfileInput = await request.json();

  if (!input.team_id || !input.name || !input.description) {
    return new Response(
      JSON.stringify({ error: "team_id, name, and description are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Input size validation
  if (input.name.length > 500) {
    return new Response(
      JSON.stringify({ error: "name must be 500 characters or fewer" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (input.description.length > 50_000) {
    return new Response(
      JSON.stringify({ error: "description must be 50,000 characters or fewer" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (input.screenshot_urls && input.screenshot_urls.length > 10) {
    return new Response(
      JSON.stringify({ error: "screenshot_urls must have 10 items or fewer" }),
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

      // Create or update the loops_profiles row with all user-provided fields upfront.
      // AI-enriched fields (tagline, colors, tech_stack, etc.) are added via update later.
      let projectId = input.project_id;
      if (projectId) {
        const { error: baseUpdateError } = await supabaseAdmin
          .from("loops_profiles")
          .update({
            team_id: input.team_id,
            name: input.name,
            description: input.description,
            github_url: input.github_url ?? null,
            youtube_url: input.youtube_url ?? null,
            logo_url: input.logo_url ?? null,
            website_url: input.website_url ?? null,
            screenshot_urls: input.screenshot_urls ?? [],
            additional_links: (input.additional_links ?? []) as unknown as import("@/lib/supabase/types").Json,
            social_links: (input.social_links ?? []) as unknown as import("@/lib/supabase/types").Json,
          })
          .eq("id", projectId);
        if (baseUpdateError) {
          throw new Error("Failed to update project profile");
        }
      } else {
        const { data: profileRow, error: insertError } = await supabaseAdmin
          .from("loops_profiles")
          .insert({
            team_id: input.team_id,
            name: input.name,
            description: input.description,
            github_url: input.github_url ?? null,
            youtube_url: input.youtube_url ?? null,
            logo_url: input.logo_url ?? null,
            website_url: input.website_url ?? null,
            screenshot_urls: input.screenshot_urls ?? [],
            additional_links: (input.additional_links ?? []) as unknown as import("@/lib/supabase/types").Json,
            social_links: (input.social_links ?? []) as unknown as import("@/lib/supabase/types").Json,
          })
          .select("id")
          .single();

        if (insertError || !profileRow) throw new Error("Failed to create project profile");
        projectId = profileRow.id;
      }

      if (!projectId) throw new Error("Missing project id after profile creation");

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

      const { chunkCount } = await buildKnowledgeBase({
        projectId,
        sections: kbSections,
      });

      send("progress", { step: "knowledge-base", status: "done" });

      const techStackTags = mergeTechStack(
        codeResult?.tech_stack || [],
        demoResult?.tech_mentioned
      );

      send("progress", { step: "enrichment", status: "started", message: "Synthesizing enriched profile" });

      const allContext = [
        `Project name: ${input.name}`,
        `User-provided description:\n${input.description.slice(0, 3000)}`,
        techStackTags.length ? `Detected tech stack: ${techStackTags.join(", ")}` : "",
        demoResult?.summary ? `Demo video summary: ${demoResult.summary}` : "",
        demoResult?.problem_addressed ? `Problem addressed (from demo): ${demoResult.problem_addressed}` : "",
        demoResult?.key_features?.length ? `Demo key points: ${demoResult.key_features.join("; ")}` : "",
        codeResult?.flattened_codebase ? `Codebase context (first 4000 chars):\n${codeResult.flattened_codebase.slice(0, 4000)}` : "",
        themeResult ? `Visual theme: ${themeResult.theme_label}, primary ${themeResult.primary_color}` : "",
      ].filter(Boolean).join("\n\n");

      interface EnrichmentResult {
        refined_description: string;
        tagline: string;
        category: string;
        problem_statement: string;
        key_features: { heading: string; detail: string }[];
      }

      let enrichment: EnrichmentResult | null = null;
      try {
        enrichment = await generateJSON<EnrichmentResult>(
          "pro",
          `You are an expert technical writer creating a comprehensive developer project profile. You have access to multiple data sources — user description, codebase analysis, demo video transcript, and visual theme data. Synthesize ALL of these into a polished profile.

${allContext}

Generate the following fields as JSON:

1. "refined_description": A detailed, well-structured description (200-500 words). Go BEYOND the user's raw description — incorporate insights from the codebase, demo video, and technical analysis. Explain what the project does, its architecture, how it works under the hood, and why it matters. Use paragraph breaks (\\n\\n). Write in third person.

2. "tagline": A single punchy tagline (max 120 characters). Compelling and descriptive.

3. "category": Best-fit category from EXACTLY one of: AI/ML, Web3/Blockchain, Developer Tools, SaaS, Mobile, Data/Analytics, IoT/Hardware, Social/Community, Education, Health, Finance, Gaming, Infrastructure, Security, Other.

4. "problem_statement": A clear, concise statement (1-3 sentences) of the core problem this project solves. Extract or infer this from all available context.

5. "key_features": An array of 4-8 key features. Each MUST have:
   - "heading": A short label (1-4 words, e.g. "Real-time Sync", "AI Orchestration")
   - "detail": A 1-2 sentence explanation of the feature

Return JSON only. No markdown.`
        );
      } catch (e) {
        console.error("[profile-creator] Enrichment failed:", e);
      }

      const refinedDescription = enrichment?.refined_description || input.description;
      const tagline = enrichment?.tagline?.trim().slice(0, 120)
        || input.description.replace(/\n.*/s, "").trim().slice(0, 137) || input.name;
      const category = enrichment?.category?.trim() || "Other";
      const problemStatement = enrichment?.problem_statement || "";
      const keyFeatures: { heading: string; detail: string }[] =
        enrichment?.key_features?.length
          ? enrichment.key_features
          : (demoResult?.key_features ?? []).map((f) => ({ heading: f.split(/[:.–—]/)[0].trim().slice(0, 40), detail: f }));

      send("progress", { step: "enrichment", status: "done" });

      const MAX_FLATTENED_DISPLAY = 80_000;
      const flattened_codebase = codeResult?.flattened_codebase
        ? codeResult.flattened_codebase.length > MAX_FLATTENED_DISPLAY
          ? codeResult.flattened_codebase.slice(0, MAX_FLATTENED_DISPLAY) + "\n\n... (truncated for storage)"
          : codeResult.flattened_codebase
        : undefined;

      const profileResponse = {
        project_id: projectId,
        tagline,
        category,
        refined_description: refinedDescription,
        problem_statement: problemStatement,
        tech_stack_tags: techStackTags,
        primary_color: themeResult?.primary_color ?? "#1A1A2E",
        accent_color: themeResult?.accent_color ?? "#6C3BF5",
        secondary_color: themeResult?.secondary_color ?? "#FFFFFF",
        theme_label: themeResult?.theme_label ?? "dark-minimal",
        key_features: keyFeatures.map((f) => `${f.heading}: ${f.detail}`),
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
        hackathon_id: input.hackathon_id,
      };

      // Persist all enriched data server-side (bypasses RLS via admin client)
      const { error: updateError } = await supabaseAdmin
        .from("loops_profiles")
        .update({
          tagline,
          category,
          refined_description: refinedDescription,
          tech_stack: techStackTags,
          colors: {
            primary_color: profileResponse.primary_color,
            secondary_color: profileResponse.secondary_color,
            accent_color: profileResponse.accent_color,
            theme_label: profileResponse.theme_label,
          },
          key_features: keyFeatures.map((f) => `${f.heading}: ${f.detail}`),
          logo_url: input.logo_url ?? null,
          website_url: input.website_url ?? null,
          github_url: input.github_url ?? null,
          youtube_url: input.youtube_url ?? null,
          screenshot_urls: input.screenshot_urls ?? [],
          additional_links: (input.additional_links ?? []) as unknown as import("@/lib/supabase/types").Json,
          social_links: (input.social_links ?? []) as unknown as import("@/lib/supabase/types").Json,
          flattened_codebase: flattened_codebase ?? null,
          knowledge_base_id: projectId,
          knowledge_base_chunks: chunkCount,
          kb_sections: kbSections.map((s) => s.source),
        })
        .eq("id", projectId);

      if (updateError) {
        console.error("[profile-creator] Failed to persist enriched data:", updateError.message);
      }

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
