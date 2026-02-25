"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BarChart3, Gavel, Plus, FileText, ArrowRight } from "lucide-react";
import { useBoosters, useProjects, useSubmissionsForBoosters } from "@/lib/queries";

export default function HostPage() {
  const { data: boosters = [], isLoading: loadingBoosters } = useBoosters();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const boosterIds = useMemo(() => boosters.map((b) => b.id), [boosters]);
  const { data: submissions = [], isLoading: loadingSubs } = useSubmissionsForBoosters(boosterIds);
  const projectMap = useMemo(() => {
    const map: Record<string, (typeof projects)[0]> = {};
    projects.forEach((p) => { map[p.project_id] = p; });
    return map;
  }, [projects]);
  const loading = loadingBoosters || loadingProjects || loadingSubs;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Host</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Manage boosters, view analytics, and grade submissions.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Prev Boosters
        </h2>
        <div className="space-y-4">
          <Link
            href="/host/analytics"
            className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400 hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors group"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                Analytics
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">AI</span>
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Generate report from event data and submissions.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 shrink-0" />
          </Link>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-500" />
              Project submitted list
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Projects submitted to your boosters. View and grade each.
            </p>
            {loading ? (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No submissions yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {submissions.map((sub) => {
                  const project = projectMap[sub.project_id];
                  const booster = boosters.find((b) => b.id === sub.booster_id);
                  return (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white">{project?.name ?? "Unknown project"}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {booster ? `Submitted to ${booster.name}` : "—"}
                        </p>
                      </div>
                      <Link
                        href={`/host/judging?project_id=${sub.project_id}&booster_id=${sub.booster_id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-amber-700 shrink-0"
                      >
                        <Gavel className="w-4 h-4" /> Grade project
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          New Booster
        </h2>
        <Link
          href="/host/boosters"
          className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors group"
        >
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
            <Plus className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Booster onboarding form</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Create idea, momentum, or capital boosters: name, theme, problem statements, sponsor tracks.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 shrink-0" />
        </Link>
      </section>
    </div>
  );
}
