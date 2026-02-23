import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import type {
  ErrorResponse,
  FileData,
} from "@/types/github-flattener";
import {
  parseGitHubUrl,
  shouldIgnore,
  hasAllowedExtension,
  fetchFileContent,
  generateMarkdownOutput,
} from "@/lib/github-utils";
import { DEFAULT_CONFIG } from "@/types/github-flattener";
import { queryTopK } from "../../lib/vector-store";
import { generateContent, generateJSON } from "../../lib/gemini-client";
import { randomUUID } from "crypto";

function extractDependencies(files: FileData[]): string[] {
  const deps: Set<string> = new Set();

  for (const file of files) {
    if (file.path === "package.json" || file.path.endsWith("/package.json")) {
      try {
        const pkg = JSON.parse(file.content);
        for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
          if (pkg[key]) Object.keys(pkg[key]).forEach((d) => deps.add(d));
        }
      } catch { /* skip malformed */ }
    }
    if (file.path === "requirements.txt" || file.path.endsWith("/requirements.txt")) {
      file.content.split("\n").forEach((line) => {
        const name = line.trim().split(/[=<>!~]/)[0].trim();
        if (name && !name.startsWith("#")) deps.add(name);
      });
    }
    if (file.path === "go.mod" || file.path.endsWith("/go.mod")) {
      const requireBlock = file.content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireBlock) {
        requireBlock[1].split("\n").forEach((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts[0] && !parts[0].startsWith("//")) deps.add(parts[0]);
        });
      }
    }
    if (file.path === "Cargo.toml" || file.path.endsWith("/Cargo.toml")) {
      const depSection = file.content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
      if (depSection) {
        depSection[1].split("\n").forEach((line) => {
          const name = line.split("=")[0]?.trim();
          if (name && !name.startsWith("#") && !name.startsWith("[")) deps.add(name);
        });
      }
    }
  }

  return Array.from(deps);
}

async function getTechStackFromAI(dependencies: string[], filePaths: string[]): Promise<string[]> {
  const prompt = `Given the following dependency names and file paths from a codebase, list the main technologies and frameworks used.

Dependencies: ${dependencies.slice(0, 150).join(", ") || "none detected"}
File paths (sample): ${filePaths.slice(0, 200).join(", ")}

Return a JSON object: { "tech_stack": ["Technology1", "Technology2", ...] }
Use common product names (e.g. React, Next.js, TypeScript, Python, FastAPI, Prisma). Keep the list concise (max 20 items).`;

  try {
    const result = await generateJSON<{ tech_stack: string[] }>("flash", prompt);
    return Array.isArray(result.tech_stack) ? result.tech_stack : [];
  } catch {
    return [];
  }
}

export async function flattenAndIndex(
  githubUrl: string,
  githubToken?: string
): Promise<{
  tech_stack: string[];
  flattened_codebase: string;
  chunk_count: number;
  project_id: string;
  dependencies: string[];
}> {
  const { owner, repo } = parseGitHubUrl(githubUrl);
  if (!owner || !repo) throw new Error("Invalid GitHub URL");

  const token = githubToken || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GitHub token is required to avoid API rate limits (60 req/hr unauthenticated). Set GITHUB_TOKEN in .env or pass github_token in the request."
    );
  }
  const octokit = new Octokit({ auth: token });
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const targetBranch = repoData.default_branch;
  const { data: tree } = await octokit.git.getTree({
    owner, repo, tree_sha: targetBranch, recursive: "1",
  });

  const allowedExts = DEFAULT_CONFIG.allowedExtensions;
  const ignorePatterns = DEFAULT_CONFIG.ignorePatterns;

  const files: FileData[] = [];
  const filePromises: Promise<void>[] = [];

  for (const item of tree.tree) {
    if (item.type !== "blob" || !item.path || !item.sha || !item.size) continue;
    if (shouldIgnore(item.path, ignorePatterns)) continue;
    if (!hasAllowedExtension(item.path, allowedExts)) continue;
    if (item.size > DEFAULT_CONFIG.maxFileSize) continue;

    filePromises.push(
      fetchFileContent(octokit, owner, repo, item.path, item.sha)
        .then((content) => {
          if (content) files.push({ path: item.path!, content, size: item.size! });
        })
        .catch(() => {})
    );
  }

  await Promise.all(filePromises);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const flattenedContent = generateMarkdownOutput(files, owner, repo, targetBranch);
  const dependencies = extractDependencies(files);
  const filePaths = files.map((f) => f.path);
  const techStack = await getTechStackFromAI(dependencies, filePaths);

  const projectId = `${owner}-${repo}-${randomUUID().slice(0, 8)}`;

  return {
    tech_stack: techStack,
    flattened_codebase: flattenedContent,
    chunk_count: 0,
    project_id: projectId,
    dependencies,
  };
}

export async function queryCode(
  projectId: string,
  question: string
): Promise<string> {
  const results = await queryTopK(projectId, question, 5, 0);
  if (results.length === 0) {
    return "No relevant code found for this project. The project may not have been indexed yet.";
  }

  const context = results.map((r) => r.chunk.text).join("\n\n---\n\n");
  const response = await generateContent("pro", [
    {
      role: "user",
      parts: [
        {
          text: `You are a code expert. Answer the following question about this codebase based on the provided context chunks.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, detailed answer grounded in the code context.`,
        },
      ],
    },
  ]);

  return response.text || "Unable to generate an answer.";
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<Record<string, unknown> | ErrorResponse>> {
  try {
    const body = await request.json();
    const { github_url, github_token, action, project_id, question } = body;

    if (action === "query") {
      if (!project_id || !question) {
        return NextResponse.json({ error: "project_id and question are required" }, { status: 400 });
      }
      const answer = await queryCode(project_id, question);
      return NextResponse.json({ answer });
    }

    if (!github_url) {
      return NextResponse.json({ error: "github_url is required" }, { status: 400 });
    }

    const result = await flattenAndIndex(github_url, github_token);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("code-reader error:", message);
    return NextResponse.json({ error: "Failed to process repository", message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
