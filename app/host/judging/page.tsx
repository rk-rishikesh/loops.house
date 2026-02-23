"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gavel, Loader2 } from "lucide-react";
import { getProjects, getProject, getBoosters, getBooster } from "@/lib/storage";
import type { StoredProject, StoredBooster } from "@/lib/storage";

export default function HostJudgingPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("project_id") ?? "");
  const [boosterId, setBoosterId] = useState(searchParams.get("booster_id") ?? "");
  const [mode, setMode] = useState<"preview" | "official">("preview");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    overall_score?: number;
    overall_summary?: string;
    criteria_scores?: { criterion_name: string; score: number; max_score: number; justification: string; strength: string; improvement: string }[];
    generated_at?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProjects(getProjects());
    const b = getBoosters();
    setBoosters(b);
    const fromUrl = searchParams.get("booster_id");
    if (fromUrl) setBoosterId(fromUrl);
    else if (b.length > 0 && !boosterId) setBoosterId((id) => id || b[0].id);
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("project_id");
    if (fromUrl) setProjectId(fromUrl);
    else {
      const list = getProjects();
      if (list.length > 0 && !projectId) setProjectId(list[0].project_id);
    }
  }, [projects.length]);

  const handleEvaluate = async () => {
    if (!projectId || !boosterId) {
      setError("Select a project and a booster.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const project = getProject(projectId);
      const booster = getBooster(boosterId);
      const payload = {
        project_id: projectId,
        booster_id: boosterId,
        judge_mode: mode,
        project: project
          ? {
              name: project.name,
              tagline: project.tagline,
              refined_description: project.refined_description,
              description: project.description,
              key_features: project.key_features,
              tech_stack_tags: project.tech_stack_tags,
              category: project.category,
              flattened_codebase: project.flattened_codebase?.slice(0, 50000),
            }
          : undefined,
        booster: booster
          ? {
              id: booster.id,
              name: booster.name,
              theme: booster.theme,
              problem_statements: booster.problem_statements,
              sponsor_tracks: booster.sponsor_tracks,
            }
          : undefined,
      };
      const res = await fetch("/api/host-agents/project-evaluator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/host"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">AI Judging</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Evaluate a project against the rubric. Project and booster data are sent from this browser so the AI has full context.
      </p>

      <div className="mt-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white min-w-[200px]"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster</label>
          <select
            value={boosterId}
            onChange={(e) => setBoosterId(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select booster</option>
            {boosters.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "preview" | "official")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="preview">Preview (builder can see)</option>
            <option value="official">Official (host only)</option>
          </select>
        </div>
        <button
          onClick={handleEvaluate}
          disabled={loading || !projectId || !boosterId}
          className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
          Run evaluation
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Overall score</h2>
              <span className="text-2xl font-bold text-amber-600">{result.overall_score ?? 0}/100</span>
            </div>
            {result.overall_summary && (
              <p className="mt-3 text-zinc-700 dark:text-zinc-300">{result.overall_summary}</p>
            )}
            {result.generated_at && (
              <p className="mt-2 text-xs text-zinc-500">Generated at {result.generated_at}</p>
            )}
          </div>
          {result.criteria_scores && result.criteria_scores.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Criteria</h2>
              {result.criteria_scores.map((c, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-zinc-900 dark:text-white">{c.criterion_name}</span>
                    <span className="text-amber-600 font-semibold">{c.score}/{c.max_score}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{c.justification}</p>
                  <p className="mt-1 text-xs text-zinc-500"><strong>Strength:</strong> {c.strength}</p>
                  <p className="text-xs text-zinc-500"><strong>Improvement:</strong> {c.improvement}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
