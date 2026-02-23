"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { getBoosters, getBooster, getProjects } from "@/lib/storage";
import type { StoredBooster, StoredProject } from "@/lib/storage";

function buildMetricsForBooster(boosterId: string) {
  const projects = getProjects().filter((p) => p.booster_id === boosterId) as StoredProject[];
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
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [boosterId, setBoosterId] = useState("");
  const [reportType, setReportType] = useState<"overview" | "submissions" | "full">("full");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    narrative?: string;
    highlights?: string[];
    raw_metrics?: unknown;
    generated_at?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const list = getBoosters();
    setBoosters(list);
    if (list.length > 0 && !boosterId) setBoosterId(list[0].id);
  }, []);

  const handleGenerate = async () => {
    if (!boosterId) {
      setError("Select a booster first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const booster = getBooster(boosterId);
      const metrics = buildMetricsForBooster(boosterId);
      const payload = {
        booster_id: boosterId,
        report_type: reportType,
        booster: booster
          ? {
              id: booster.id,
              name: booster.name,
              theme: booster.theme,
              problem_statements: booster.problem_statements,
              sponsor_tracks: booster.sponsor_tracks,
            }
          : undefined,
        metrics,
      };
      const res = await fetch("/api/host-agents/metric-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytics report</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Generate an AI narrative from booster details and submitted projects (from this browser).
      </p>

      <div className="mt-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster</label>
          <select
            value={boosterId}
            onChange={(e) => setBoosterId(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select a booster</option>
            {boosters.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Report type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="overview">Overview</option>
            <option value="submissions">Submissions</option>
            <option value="full">Full</option>
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !boosterId}
          className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Generate report
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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
