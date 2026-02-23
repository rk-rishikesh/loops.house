"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Loader2, Copy, Check } from "lucide-react";
import { getProjects, getProject, getBooster, getBoosters } from "@/lib/storage";
import type { StoredProject, StoredBooster } from "@/lib/storage";

type Tone = "professional" | "casual" | "excited";
type BoosterResult = "winner" | "runner-up" | "finalist" | "participant" | "";

export default function BuilderSharePage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project_id") ?? "";
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [projectId, setProjectId] = useState(projectIdFromUrl);
  const [boosterId, setBoosterId] = useState("");
  const [boosterResult, setBoosterResult] = useState<BoosterResult>("");
  const [tone, setTone] = useState<Tone>("excited");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    linkedin_post?: string;
    twitter_post?: string;
    suggested_hashtags?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setProjects(getProjects());
    setBoosters(getBoosters());
  }, []);

  useEffect(() => {
    if (projectIdFromUrl) setProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  useEffect(() => {
    const list = getProjects();
    if (list.length > 0 && !projectId) setProjectId(list[0].project_id);
  }, [projects.length]);

  const handleGenerate = async () => {
    if (!projectId) {
      setError("Select a project.");
      return;
    }
    const project = getProject(projectId);
    if (!project) {
      setError("Project not found.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const payload = {
        project: {
          name: project.name,
          tagline: project.tagline ?? "",
          refined_description: project.refined_description ?? project.description ?? "",
          tech_stack_tags: project.tech_stack_tags ?? [],
          category: project.category ?? "Other",
          key_features: project.key_features ?? [],
          loops_profile_url: `${origin}/viewer/projects/${projectId}`,
        },
        tone,
      };
      const booster = boosterId ? getBooster(boosterId) : null;
      if (booster) {
        (payload as Record<string, unknown>).booster = {
          name: booster.name,
          ...(boosterResult ? { result: boosterResult } : {}),
        };
      }
      const res = await fetch("/api/builder-agents/social-amplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate posts");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Social amplifier</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Generate LinkedIn and Twitter posts for your project. Pick a project and optional booster context.
      </p>

      <div className="mt-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster (optional)</label>
          <select
            value={boosterId}
            onChange={(e) => setBoosterId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">None</option>
            {boosters.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        {boosterId && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster result (optional)</label>
            <select
              value={boosterResult}
              onChange={(e) => setBoosterResult(e.target.value as BoosterResult)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              <option value="">Participant</option>
              <option value="winner">Winner</option>
              <option value="runner-up">Runner-up</option>
              <option value="finalist">Finalist</option>
              <option value="participant">Participant</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="excited">Excited</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !projectId}
          className="flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Generate posts
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="mt-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Generated posts</h2>
          {result.linkedin_post && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">LinkedIn</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.linkedin_post!, "linkedin")}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {copied === "linkedin" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "linkedin" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result.linkedin_post}</p>
            </div>
          )}
          {result.twitter_post && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Twitter / X</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.twitter_post!, "twitter")}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {copied === "twitter" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "twitter" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.twitter_post}</p>
              <p className="mt-1 text-xs text-zinc-500">{result.twitter_post.length} characters</p>
            </div>
          )}
          {result.suggested_hashtags && result.suggested_hashtags.length > 0 && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Suggested hashtags</span>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{result.suggested_hashtags.join(" ")}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.suggested_hashtags!.join(" "), "hashtags")}
                className="mt-2 flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                {copied === "hashtags" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "hashtags" ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {projects.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          No projects yet. <Link href="/builder/new" className="text-violet-600 dark:text-violet-400 hover:underline">Create a profile</Link> first.
        </p>
      )}
    </div>
  );
}
