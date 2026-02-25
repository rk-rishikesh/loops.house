"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getBooster, getProjects } from "@/lib/storage";
import type { StoredProject } from "@/lib/storage";
import { useBoosters } from "@/lib/queries";
import { analyticsFilterSchema, type AnalyticsFilterSchema } from "@/lib/validations/schemas";

type AnalyticsResult = {
  narrative?: string;
  highlights?: string[];
  raw_metrics?: unknown;
  generated_at?: string;
};

async function buildMetricsForBooster(boosterId: string) {
  const allProjects = await getProjects();
  const projects = allProjects.filter((p) => p.booster_id === boosterId) as StoredProject[];
  const submissions = projects.map((p) => ({
    name: p.name,
    category: p.category,
    tech_stack_tags: p.tech_stack_tags ?? [],
    created_at: p.created_at,
  }));

  const categoryCounts = new Map<string, number>();
  const techCounts = new Map<string, number>();
  for (const s of submissions) {
    if (s.category) categoryCounts.set(s.category, (categoryCounts.get(s.category) ?? 0) + 1);
    for (const t of s.tech_stack_tags ?? []) {
      if (t) techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
    }
  }
  const top_categories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const top_tech_stacks = Array.from(techCounts.entries())
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    total_submissions: submissions.length,
    submissions,
    top_categories,
    top_tech_stacks,
  };
}

export default function HostAnalyticsPage() {
  const { data: boosters = [] } = useBoosters();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnalyticsFilterSchema>({
    resolver: zodResolver(analyticsFilterSchema),
    defaultValues: {
      booster_id: "",
      report_type: "full",
    },
  });

  // Set default booster once data loads
  useEffect(() => {
    if (boosters.length > 0) {
      reset((prev) => ({
        ...prev,
        booster_id: prev.booster_id || boosters[0].id,
      }));
    }
  }, [boosters, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AnalyticsFilterSchema): Promise<AnalyticsResult> => {
      const booster = await getBooster(data.booster_id);
      const metrics = await buildMetricsForBooster(data.booster_id);
      const payload = {
        booster_id: data.booster_id,
        report_type: data.report_type,
        booster: booster
          ? {
              id: booster.id,
              name: booster.name,
              theme: booster.theme,
              problem_statements: booster.problem_statements,
            }
          : undefined,
        metrics,
      };
      const res = await fetch("/api/host-agents/metric-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate report");
      return json as AnalyticsResult;
    },
  });

  const result = mutation.data;

  return (
    <div>
      <Link
        href="/host"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytics report</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Generate an AI narrative from booster details and submitted projects (from this browser).
      </p>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="mt-6 flex flex-wrap gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster</label>
          <select
            {...register("booster_id")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select a booster</option>
            {boosters.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {errors.booster_id && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.booster_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Report type</label>
          <select
            {...register("report_type")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="overview">Overview</option>
            <option value="submissions">Submissions</option>
            <option value="full">Full</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Generate report
        </button>
      </form>

      {mutation.error && (
        <p className="mt-4 text-sm text-red-600">{mutation.error.message}</p>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Report</h2>
            <p className="mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result.narrative}</p>
            {result.generated_at && (
              <p className="mt-4 text-xs text-zinc-500">Generated at {result.generated_at}</p>
            )}
          </div>
          {result.highlights && result.highlights.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Highlights</h2>
              <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-300 space-y-1">
                {result.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
