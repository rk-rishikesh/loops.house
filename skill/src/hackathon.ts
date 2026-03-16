import { Cli, z } from "incur";
import { platformFetch } from "./api.js";
import { getAuthClient } from "./client.js";

export const hackathon = Cli.create("hackathon", {
  description: "Browse hackathons, ideate, and submit projects",
});

// ── hackathon list ──────────────────────────────────────────────

hackathon.command("list", {
  description: "List hackathons open for submissions (building phase)",
  options: z.object({
    all: z.boolean().default(false).describe("Show all hackathons, not just open ones"),
  }),
  output: z.object({
    hackathons: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        theme: z.string().optional(),
        phase: z.string(),
        problem_statements: z.array(z.string()).optional(),
        start_date: z.string().optional(),
        submission_deadline: z.string().optional(),
        results_date: z.string().optional(),
      }),
    ),
    count: z.number(),
  }),
  examples: [
    { description: "List hackathons accepting submissions" },
    {
      options: { all: true },
      description: "List all hackathons including past ones",
    },
  ],
  async run({ options, error: err }) {
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    try {
      client = await getAuthClient();
    } catch (e) {
      return err({
        code: "NOT_AUTHENTICATED",
        message: (e as Error).message,
        retryable: true,
        cta: {
          description: "Authenticate first:",
          commands: [{ command: "auth login", description: "Log in to Loops House" }],
        },
      });
    }

    const { supabase } = client;

    const { data, error: dbError } = await supabase
      .from("hackathons")
      .select(
        "id, name, theme, problem_statements, start_date, submission_deadline, results_date, finalized_at, is_exclusive",
      )
      .eq("is_exclusive", false)
      .order("start_date", { ascending: false });

    if (dbError || !data) {
      return err({
        code: "FETCH_FAILED",
        message: dbError.message,
        retryable: true,
      });
    }

    const now = new Date();
    const hackathons = (data || [])
      .map((h) => {
        const start = h.start_date ? new Date(h.start_date) : null;
        const deadline = h.submission_deadline ? new Date(h.submission_deadline) : null;
        const results = h.results_date ? new Date(h.results_date) : null;

        let phase: string;
        if (h.finalized_at && results && now >= results) phase = "finalized";
        else if (results && now >= results) phase = "completed";
        else if (deadline && now >= deadline) phase = "judging";
        else if (start && now >= start) phase = "building";
        else phase = "upcoming";

        return {
          id: h.id,
          name: h.name,
          theme: h.theme || undefined,
          phase,
          problem_statements: h.problem_statements || undefined,
          start_date: h.start_date || undefined,
          submission_deadline: h.submission_deadline || undefined,
          results_date: h.results_date || undefined,
        };
      })
      .filter((h) => {
        if (options.all) return true;
        return h.phase === "building" || h.phase === "upcoming";
      });

    return { hackathons, count: hackathons.length };
  },
});

// ── hackathon ideate ────────────────────────────────────────────

hackathon.command("ideate", {
  description:
    "Brainstorm project ideas with an AI mentor for a specific hackathon. Pass --projectId to include your project details for contextual feedback.",
  options: z.object({
    hackathonId: z.string().describe("Hackathon ID to ideate for"),
    message: z.string().describe("Your message or idea to discuss"),
    projectId: z
      .string()
      .optional()
      .describe("Project ID — auto-fetches project details for context"),
    history: z.string().optional().describe("JSON array of prior conversation [{role,content}]"),
  }),
  alias: { hackathonId: "h", message: "m", projectId: "p" },
  output: z.object({
    response: z.string(),
    hackathon_name: z.string().optional(),
    project_name: z.string().optional(),
  }),
  examples: [
    {
      options: {
        hackathonId: "abc-123",
        message: "I want to build something with AI and blockchain",
      },
      description: "Start an ideation conversation",
    },
    {
      options: {
        hackathonId: "abc-123",
        projectId: "def-456",
        message: "How does my project align with this hackathon?",
      },
      description: "Get feedback on an existing project's fit",
    },
  ],
  async run({ options, error: err }) {
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    try {
      client = await getAuthClient();
    } catch (e) {
      return err({
        code: "NOT_AUTHENTICATED",
        message: (e as Error).message,
        retryable: true,
        cta: {
          description: "Authenticate first:",
          commands: [{ command: "auth login", description: "Log in to Loops House" }],
        },
      });
    }

    const { supabase } = client;

    // Fetch hackathon context
    const { data: hackathonData, error: hErr } = await supabase
      .from("hackathons")
      .select("id, name, theme, problem_statements")
      .eq("id", options.hackathonId)
      .single();

    if (hErr || !hackathonData) {
      return err({
        code: "NOT_FOUND",
        message: `Hackathon not found: ${hErr?.message || options.hackathonId}`,
        retryable: false,
      });
    }

    // Fetch sponsor tracks if available
    const { data: tracks } = await supabase
      .from("hackathon_tracks")
      .select("sponsor_name, track_description")
      .eq("hackathon_id", options.hackathonId);

    // Optionally fetch project details for contextual feedback
    let projectSnapshot: { name?: string; description?: string; tech_stack?: string[] } | undefined;
    let projectName: string | undefined;

    if (options.projectId) {
      const { data: project, error: pErr } = await supabase
        .from("loops_profiles")
        .select(
          "name, tagline, description, refined_description, key_features, tech_stack, category, github_url, website_url",
        )
        .eq("id", options.projectId)
        .single();

      if (pErr || !project) {
        return err({
          code: "NOT_FOUND",
          message: `Project not found: ${pErr?.message || options.projectId}`,
          retryable: false,
        });
      }

      const p = project;
      projectName = p.name;

      // Build a rich description for the mentor
      const descParts = [
        p.refined_description || p.description || "",
        p.tagline ? `Tagline: ${p.tagline}` : "",
        p.category ? `Category: ${p.category}` : "",
        p.key_features?.length ? `Key features: ${p.key_features.join(", ")}` : "",
        p.github_url ? `GitHub: ${p.github_url}` : "",
        p.website_url ? `Website: ${p.website_url}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      projectSnapshot = {
        name: p.name,
        description: descParts,
        tech_stack: p.tech_stack || [],
      };
    }

    const conversationHistory = options.history ? JSON.parse(options.history) : [];

    const body: {
      message: string;
      conversation_history: { role: string; content: string }[];
      hackathon_context: {
        theme: string;
        problem_statements: string[];
        sponsor_tracks: { sponsor: string; track_description: string }[];
      };
      project_snapshot?: { name: string; description: string; tech_stack: string[] };
    } = {
      message: options.message,
      conversation_history: conversationHistory,
      hackathon_context: {
        theme: hackathonData.theme ?? "",
        problem_statements: hackathonData.problem_statements || [],
        sponsor_tracks:
          tracks?.map((t) => ({
            sponsor: t.sponsor_name,
            track_description: t.track_description ?? "",
          })) || [],
      },
    };

    if (projectSnapshot) {
      body.project_snapshot = {
        name: projectSnapshot.name ?? "",
        description: projectSnapshot.description ?? "",
        tech_stack: projectSnapshot.tech_stack ?? [],
      };
    }

    const res = await platformFetch("/api/builder-agents/project-ideator", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return err({
        code: "API_ERROR",
        message: (errBody as { error: string }).error || `API returned ${res.status}`,
        retryable: res.status >= 500,
      });
    }

    // Read SSE stream and collect full response
    const text = await res.text();
    const lines = text.split("\n");
    let fullResponse = "";
    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const chunk = JSON.parse(line.slice(6));
          if (chunk.text) fullResponse += chunk.text;
        } catch {
          // skip malformed chunks
        }
      }
    }

    return {
      response: fullResponse || "No response from mentor.",
      hackathon_name: hackathonData.name,
      project_name: projectName,
    };
  },
});

// ── hackathon submit ────────────────────────────────────────────

hackathon.command("submit", {
  description: "Submit a project to a hackathon",
  options: z.object({
    hackathonId: z.string().describe("Hackathon ID to submit to"),
    projectId: z.string().describe("Project ID to submit"),
    teamId: z.string().optional().describe("Team ID (auto-resolved if omitted)"),
  }),
  alias: { hackathonId: "h", projectId: "p", teamId: "t" },
  output: z.object({
    submission_id: z.string().optional(),
    message: z.string(),
    hackathon_name: z.string().optional(),
    project_name: z.string().optional(),
  }),
  examples: [
    {
      options: { hackathonId: "abc-123", projectId: "def-456" },
      description: "Submit your project to a hackathon",
    },
  ],
  async run({ options, error: err }) {
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    try {
      client = await getAuthClient();
    } catch (e) {
      return err({
        code: "NOT_AUTHENTICATED",
        message: (e as Error).message,
        retryable: true,
        cta: {
          description: "Authenticate first:",
          commands: [{ command: "auth login", description: "Log in to Loops House" }],
        },
      });
    }

    const { supabase, user } = client;

    // Validate hackathon exists and is in building phase
    const { data: hackathonData, error: hErr } = await supabase
      .from("hackathons")
      .select("id, name, start_date, submission_deadline, results_date, finalized_at")
      .eq("id", options.hackathonId)
      .single();

    if (hErr || !hackathonData) {
      return err({
        code: "NOT_FOUND",
        message: `Hackathon not found: ${hErr?.message || options.hackathonId}`,
        retryable: false,
      });
    }

    // Phase check
    const now = new Date();
    const start = hackathonData.start_date ? new Date(hackathonData.start_date) : null;
    const deadline = hackathonData.submission_deadline
      ? new Date(hackathonData.submission_deadline)
      : null;

    if (!start || now < start) {
      return err({
        code: "PHASE_ERROR",
        message: "Hackathon hasn't started yet. Submissions open after the start date.",
        retryable: false,
      });
    }
    if (deadline && now >= deadline) {
      return err({
        code: "PHASE_ERROR",
        message: "Submission deadline has passed.",
        retryable: false,
      });
    }

    // Validate project exists
    const { data: project, error: pErr } = await supabase
      .from("loops_profiles")
      .select("id, name, team_id")
      .eq("id", options.projectId)
      .single();

    if (pErr || !project) {
      return err({
        code: "NOT_FOUND",
        message: `Project not found: ${pErr?.message || options.projectId}`,
        retryable: false,
      });
    }

    // Resolve team ID
    const teamId = options.teamId || project.team_id;
    if (!teamId) {
      return err({
        code: "MISSING_TEAM",
        message:
          "Could not resolve team ID. Pass --teamId explicitly or ensure the project has a team.",
        retryable: false,
      });
    }

    // Verify user is a member of the team
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("team_id", teamId)
      .eq("user_id", user!.id)
      .single();

    if (!membership) {
      return err({
        code: "FORBIDDEN",
        message: "You are not a member of this project's team.",
        retryable: false,
      });
    }

    // Submit
    const { data: submission, error: subErr } = await supabase
      .from("submissions")
      .upsert(
        {
          hackathon_id: options.hackathonId,
          team_id: teamId,
          project_id: options.projectId,
          status: "submitted",
        },
        { onConflict: "hackathon_id,project_id" },
      )
      .select("id")
      .single();

    if (subErr) {
      return err({
        code: "SUBMIT_FAILED",
        message: subErr.message,
        retryable: false,
      });
    }

    return {
      submission_id: submission?.id,
      message: `Project "${project.name}" submitted to "${hackathonData.name}" successfully.`,
      hackathon_name: hackathonData.name,
      project_name: project.name,
    };
  },
});
