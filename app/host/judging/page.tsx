"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gavel, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getProject, getBooster } from "@/lib/storage";
import { useProjects, useBoosters } from "@/lib/queries";
import { judgingEvalSchema, type JudgingEvalSchema } from "@/lib/validations/schemas";

type EvalResult = {
  overall_score?: number;
  overall_summary?: string;
  criteria_scores?: {
    criterion_name: string;
    score: number;
    max_score: number;
    justification: string;
    strength: string;
    improvement: string;
  }[];
  generated_at?: string;
};

export default function HostJudgingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <HostJudgingPageContent />
    </Suspense>
  );
}

function HostJudgingPageContent() {
  const searchParams = useSearchParams();
  const { data: projects = [] } = useProjects();
  const { data: boosters = [] } = useBoosters();

  const [humanScores, setHumanScores] = useState<Record<string, number>>({});
  const [humanRemarks, setHumanRemarks] = useState<Record<string, string>>({});
  const [humanSaved, setHumanSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<JudgingEvalSchema>({
    resolver: zodResolver(judgingEvalSchema),
    defaultValues: {
      project_id: searchParams.get("project_id") ?? "",
      booster_id: searchParams.get("booster_id") ?? "",
      mode: "preview",
    },
  });

  // Apply first-item fallbacks once data loads
  useEffect(() => {
    reset((prev) => ({
      ...prev,
      project_id: prev.project_id || projects[0]?.project_id || "",
      booster_id: prev.booster_id || boosters[0]?.id || "",
    }));
  }, [projects, boosters, reset]);

  const projectId = watch("project_id");
  const boosterId = watch("booster_id");

  const evalMutation = useMutation({
    mutationFn: async (data: JudgingEvalSchema): Promise<EvalResult> => {
      const project = await getProject(data.project_id);
      const booster = await getBooster(data.booster_id);
      const payload = {
        project_id: data.project_id,
        booster_id: data.booster_id,
        judge_mode: data.mode,
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Evaluation failed");
      return json as EvalResult;
    },
    onSuccess: () => {
      setHumanScores({});
      setHumanRemarks({});
      setHumanSaved(false);
    },
  });

  const humanScoreMutation = useMutation({
    mutationFn: async () => {
      const humanScorePayload = {
        scores: humanScores,
        remarks: humanRemarks,
        overall: Object.keys(humanScores).length > 0
          ? Math.round(Object.values(humanScores).reduce((a, b) => a + b, 0) / Object.keys(humanScores).length)
          : 0,
        judged_at: new Date().toISOString(),
      };
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("submissions")
        .update({ human_score: humanScorePayload })
        .eq("project_id", projectId)
        .eq("booster_id", boosterId);
    },
    onSuccess: () => setHumanSaved(true),
  });

  const result = evalMutation.data;

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

      <form
        onSubmit={handleSubmit((data) => evalMutation.mutate(data))}
        className="mt-6 flex flex-wrap gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project</label>
          <select
            {...register("project_id")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white min-w-[200px]"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.name}</option>
            ))}
          </select>
          {errors.project_id && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.project_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster</label>
          <select
            {...register("booster_id")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select booster</option>
            {boosters.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {errors.booster_id && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.booster_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mode</label>
          <select
            {...register("mode")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="preview">Preview (builder can see)</option>
            <option value="official">Official (host only)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={evalMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {evalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
          Run evaluation
        </button>
      </form>

      {evalMutation.error && (
        <p className="mt-4 text-sm text-red-600">{evalMutation.error.message}</p>
      )}

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

          {/* Human Judge Scoring */}
          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Human Judge Scores</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Enter your scores (0-100) and remarks for each criterion. Your scores override the AI scores.
            </p>
            <div className="space-y-4">
              {(result.criteria_scores ?? []).map((c, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {c.criterion_name} <span className="text-zinc-400 font-normal">(AI: {c.score}/{c.max_score})</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0-100"
                      value={humanScores[c.criterion_name] ?? ""}
                      onChange={(e) => setHumanScores((prev) => ({ ...prev, [c.criterion_name]: parseInt(e.target.value) || 0 }))}
                      className="w-24 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={humanRemarks[c.criterion_name] ?? ""}
                      onChange={(e) => setHumanRemarks((prev) => ({ ...prev, [c.criterion_name]: e.target.value }))}
                      className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => humanScoreMutation.mutate()}
                disabled={humanScoreMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {humanScoreMutation.isPending ? "Saving..." : "Save Human Scores"}
              </button>
              {humanSaved && (
                <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
              )}
              {humanScoreMutation.error && (
                <span className="text-sm text-red-600">Failed to save human scores</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
