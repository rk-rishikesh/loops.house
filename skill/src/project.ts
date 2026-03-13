import { Cli, z } from "incur";
import { getAuthClient } from "./client.js";

export const project = Cli.create("project", {
  description: "Manage projects on Loops House",
});

project.command("create", {
  description: "Create a new project on Loops House",
  options: z.object({
    name: z.string().describe("Project name"),
    description: z.string().describe("Project description"),
    tagline: z.string().optional().describe("Short tagline for the project"),
    category: z
      .string()
      .optional()
      .describe("Project category (e.g. DeFi, NFT, DAO, Infrastructure)"),
    githubUrl: z.string().optional().describe("GitHub repository URL"),
    youtubeUrl: z.string().optional().describe("YouTube demo URL"),
    websiteUrl: z.string().optional().describe("Project website URL"),
    logoUrl: z.string().optional().describe("Logo image URL"),
    techStack: z
      .string()
      .optional()
      .describe("Comma-separated tech stack (e.g. 'React,Solidity,IPFS')"),
    keyFeatures: z
      .string()
      .optional()
      .describe("Comma-separated key features (e.g. 'On-chain analytics,Real-time alerts')"),
    screenshotUrls: z.string().optional().describe("Comma-separated screenshot URLs"),
    additionalLinks: z
      .string()
      .optional()
      .describe("JSON array of {label,url} objects for additional links"),
    socialLinks: z
      .string()
      .optional()
      .describe("JSON array of {label,url} objects for social links"),
    teamId: z.string().optional().describe("Team ID to associate"),
    hackathonId: z.string().optional().describe("Hackathon ID to associate"),
  }),
  alias: { name: "n", description: "d", githubUrl: "g" },
  output: z.object({
    project_id: z.string(),
    name: z.string(),
    message: z.string(),
  }),
  examples: [
    {
      options: { name: "My App", description: "A cool project" },
      description: "Create a basic project",
    },
    {
      options: {
        name: "DeFi Tool",
        description: "On-chain analytics",
        githubUrl: "https://github.com/user/repo",
      },
      description: "Create with GitHub link",
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

    // Resolve or create a team for this project
    let teamId = options.teamId;
    if (!teamId) {
      // Check if user already has a personal team
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id, teams(name)")
        .eq("user_id", user!.id);

      const membershipCount = memberships?.length ?? 0;
      const personalTeam = memberships?.find((m) => {
        const team = m.teams as unknown as { name: string } | null;
        const teamName = team?.name;
        return teamName?.endsWith("'s Team") || membershipCount === 1;
      });

      if (personalTeam) {
        teamId = personalTeam.team_id;
      } else {
        // Create a new team for the user
        const { data: team, error: teamErr } = await supabase
          .from("teams")
          .insert({ name: `${options.name} Team`, owner_id: user!.id })
          .select("id")
          .single();

        if (teamErr) {
          return err({
            code: "CREATE_FAILED",
            message: `Failed to create team: ${teamErr.message}`,
            retryable: false,
          });
        }

        teamId = team.id;

        // Add user as team member
        const { error: memberErr } = await supabase
          .from("team_members")
          .insert({ team_id: teamId, user_id: user!.id, role: "owner" });

        if (memberErr) {
          return err({
            code: "CREATE_FAILED",
            message: `Failed to add team member: ${memberErr.message}`,
            retryable: false,
          });
        }
      }
    }

    // Parse comma-separated arrays
    const techStack = options.techStack
      ? options.techStack.split(",").map((s: string) => s.trim())
      : [];
    const keyFeatures = options.keyFeatures
      ? options.keyFeatures.split(",").map((s: string) => s.trim())
      : [];
    const screenshotUrls = options.screenshotUrls
      ? options.screenshotUrls.split(",").map((s: string) => s.trim())
      : [];

    // Parse JSON fields
    let additionalLinks: { label: string; url: string }[] = [];
    if (options.additionalLinks) {
      try {
        additionalLinks = JSON.parse(options.additionalLinks);
      } catch {
        return err({
          code: "INVALID_INPUT",
          message: "additionalLinks must be valid JSON array of {label,url} objects",
          retryable: false,
        });
      }
    }

    let socialLinks: { label: string; url: string }[] = [];
    if (options.socialLinks) {
      try {
        socialLinks = JSON.parse(options.socialLinks);
      } catch {
        return err({
          code: "INVALID_INPUT",
          message: "socialLinks must be valid JSON array of {label,url} objects",
          retryable: false,
        });
      }
    }

    // Insert into loops_profiles (same table the platform uses)
    const { data, error: dbError } = await supabase
      .from("loops_profiles")
      .insert({
        name: options.name,
        description: options.description,
        tagline: options.tagline || null,
        category: options.category || null,
        github_url: options.githubUrl || null,
        youtube_url: options.youtubeUrl || null,
        website_url: options.websiteUrl || null,
        logo_url: options.logoUrl || null,
        tech_stack: techStack,
        key_features: keyFeatures,
        screenshot_urls: screenshotUrls,
        additional_links: additionalLinks,
        social_links: socialLinks,
        team_id: teamId,
      })
      .select("id, name")
      .single();

    if (dbError) {
      return err({
        code: "CREATE_FAILED",
        message: dbError.message,
        retryable: false,
      });
    }

    return {
      project_id: data.id,
      name: data.name,
      message: `Project "${data.name}" created successfully.`,
    };
  },
});

project.command("update", {
  description: "Update an existing project's details",
  options: z.object({
    id: z.string().describe("Project ID to update"),
    name: z.string().optional().describe("New project name"),
    description: z.string().optional().describe("New description"),
    tagline: z.string().optional().describe("Short tagline"),
    category: z.string().optional().describe("Project category"),
    githubUrl: z.string().optional().describe("GitHub repository URL"),
    youtubeUrl: z.string().optional().describe("YouTube demo URL"),
    websiteUrl: z.string().optional().describe("Project website URL"),
    logoUrl: z.string().optional().describe("Logo image URL"),
    techStack: z.string().optional().describe("Comma-separated tech stack"),
    keyFeatures: z.string().optional().describe("Comma-separated key features"),
    screenshotUrls: z.string().optional().describe("Comma-separated screenshot URLs"),
    additionalLinks: z.string().optional().describe("JSON array of {label,url} objects"),
    socialLinks: z.string().optional().describe("JSON array of {label,url} objects"),
  }),
  alias: { id: "i", name: "n", description: "d", githubUrl: "g" },
  output: z.object({
    project_id: z.string(),
    name: z.string(),
    message: z.string(),
    updated_fields: z.array(z.string()),
  }),
  examples: [
    {
      options: { id: "abc-123", name: "New Name" },
      description: "Rename a project",
    },
    {
      options: {
        id: "abc-123",
        description: "Updated description",
        githubUrl: "https://github.com/user/repo",
      },
      description: "Update description and GitHub link",
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

    // Build update payload from provided fields
    const updates: Record<string, string | string[] | undefined> = {};
    const updatedFields: string[] = [];

    const simpleFields: Array<[string, string, string | undefined]> = [
      ["name", "name", options.name],
      ["description", "description", options.description],
      ["tagline", "tagline", options.tagline],
      ["category", "category", options.category],
      ["githubUrl", "github_url", options.githubUrl],
      ["youtubeUrl", "youtube_url", options.youtubeUrl],
      ["websiteUrl", "website_url", options.websiteUrl],
      ["logoUrl", "logo_url", options.logoUrl],
    ];

    for (const [, dbField, value] of simpleFields) {
      if (value !== undefined) {
        updates[dbField] = value;
        updatedFields.push(dbField);
      }
    }

    if (options.techStack !== undefined) {
      updates.tech_stack = options.techStack.split(",").map((s: string) => s.trim());
      updatedFields.push("tech_stack");
    }
    if (options.keyFeatures !== undefined) {
      updates.key_features = options.keyFeatures.split(",").map((s: string) => s.trim());
      updatedFields.push("key_features");
    }
    if (options.screenshotUrls !== undefined) {
      updates.screenshot_urls = options.screenshotUrls.split(",").map((s: string) => s.trim());
      updatedFields.push("screenshot_urls");
    }
    if (options.additionalLinks !== undefined) {
      try {
        updates.additional_links = JSON.parse(options.additionalLinks);
      } catch {
        return err({
          code: "INVALID_INPUT",
          message: "additionalLinks must be valid JSON array of {label,url} objects",
          retryable: false,
        });
      }
      updatedFields.push("additional_links");
    }
    if (options.socialLinks !== undefined) {
      try {
        updates.social_links = JSON.parse(options.socialLinks);
      } catch {
        return err({
          code: "INVALID_INPUT",
          message: "socialLinks must be valid JSON array of {label,url} objects",
          retryable: false,
        });
      }
      updatedFields.push("social_links");
    }

    if (updatedFields.length === 0) {
      return err({
        code: "NO_CHANGES",
        message:
          "No fields to update. Provide at least one of: --name, --description, --tagline, --category, --githubUrl, --youtubeUrl, --websiteUrl, --logoUrl, --techStack, --keyFeatures, --screenshotUrls, --additionalLinks, --socialLinks",
        retryable: false,
      });
    }

    // Verify the user owns this project (via team membership)
    const { data: project, error: fetchErr } = await supabase
      .from("loops_profiles")
      .select("id, name, team_id")
      .eq("id", options.id)
      .single();

    if (fetchErr || !project) {
      return err({
        code: "NOT_FOUND",
        message: `Project not found: ${fetchErr?.message || options.id}`,
        retryable: false,
      });
    }

    if (project.team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("team_id", project.team_id)
        .eq("user_id", user!.id)
        .single();

      if (!membership) {
        return err({
          code: "FORBIDDEN",
          message: "You are not a member of this project's team.",
          retryable: false,
        });
      }
    }

    const { data, error: dbError } = await supabase
      .from("loops_profiles")
      .update(updates)
      .eq("id", options.id)
      .select("id, name")
      .single();

    if (dbError) {
      return err({
        code: "UPDATE_FAILED",
        message: dbError.message,
        retryable: false,
      });
    }

    return {
      project_id: data.id,
      name: data.name,
      message: `Project updated successfully. Changed: ${updatedFields.join(", ")}`,
      updated_fields: updatedFields,
    };
  },
});

project.command("list", {
  description: "List your projects",
  output: z.object({
    projects: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        tagline: z.string().nullable(),
        category: z.string().nullable(),
        github_url: z.string().nullable(),
        youtube_url: z.string().nullable(),
        website_url: z.string().nullable(),
        logo_url: z.string().nullable(),
        tech_stack: z.array(z.string()).nullable(),
        key_features: z.array(z.string()).nullable(),
        screenshot_urls: z.array(z.string()).nullable(),
        additional_links: z.array(z.object({ label: z.string(), url: z.string() })).nullable(),
        social_links: z.array(z.object({ label: z.string(), url: z.string() })).nullable(),
        created_at: z.string().nullable(),
      }),
    ),
    count: z.number(),
  }),
  async run({ error }) {
    let client: Awaited<ReturnType<typeof getAuthClient>> | null = null;
    try {
      client = await getAuthClient();
    } catch {}

    if (!client) {
      return error({
        code: "NOT_AUTHENTICATED",
        message: "Not authenticated",
        retryable: true,
      });
    }

    const { supabase, user } = client;

    // Get team IDs the user belongs to
    const { data: memberships, error: memberErr } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user!.id);

    if (memberErr) {
      return error({
        code: "FETCH_FAILED",
        message: memberErr.message,
        retryable: true,
      });
    }

    if (!memberships || memberships.length === 0) {
      return error({
        code: "FETCH_FAILED",
        message: "No teams found",
        retryable: false,
      });
    }

    const teamIds = memberships.map((m) => m.team_id);
    const { data, error: dbError } = await supabase
      .from("loops_profiles")
      .select(
        "id, name, description, tagline, category, github_url, youtube_url, website_url, logo_url, tech_stack, key_features, screenshot_urls, additional_links, social_links, created_at",
      )
      .in("team_id", teamIds)
      .order("created_at", { ascending: false });

    if (dbError) {
      return error({
        code: "FETCH_FAILED",
        message: dbError.message,
        retryable: true,
      });
    }

    const coerceStringArray = (value: unknown): string[] | null => {
      if (!Array.isArray(value)) return null;
      const strings = value.filter((v): v is string => typeof v === "string");
      return strings.length === value.length ? strings : null;
    };

    const coerceLinkArray = (value: unknown): { label: string; url: string }[] | null => {
      if (!Array.isArray(value)) return null;
      const links = value.filter(
        (v): v is { label: string; url: string } =>
          !!v &&
          typeof v === "object" &&
          "label" in v &&
          "url" in v &&
          typeof (v as { label: unknown }).label === "string" &&
          typeof (v as { url: unknown }).url === "string",
      );
      return links.length === value.length ? links : null;
    };

    const projects = data.map((projectRow) => ({
      id: projectRow.id,
      name: projectRow.name,
      description: projectRow.description,
      tagline: projectRow.tagline,
      category: projectRow.category,
      github_url: projectRow.github_url,
      youtube_url: projectRow.youtube_url,
      website_url: projectRow.website_url,
      logo_url: projectRow.logo_url,
      tech_stack: coerceStringArray(projectRow.tech_stack),
      key_features: coerceStringArray(projectRow.key_features),
      screenshot_urls: coerceStringArray(projectRow.screenshot_urls),
      additional_links: coerceLinkArray(projectRow.additional_links),
      social_links: coerceLinkArray(projectRow.social_links),
      created_at: projectRow.created_at,
    }));

    return {
      projects,
      count: projects.length,
    };
  },
});
