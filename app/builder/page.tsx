"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Lightbulb,
  PlusCircle,
  Users,
  Share2,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useProjects, useTeams } from "@/lib/queries";

function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        <div className="h-7 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectHubPage() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingProjects || loadingTeams;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Project Hub</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create projects, manage profiles, and share. Apply to boosters from Explore Boosters.
        </p>
      </div>

      <section className="mb-10">
        <Link
          href="/builder/new"
          className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              Create new project
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                Project Creator AI
              </span>
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">AI-powered Loops profile from GitHub, demo, theme.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 shrink-0" />
        </Link>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">List of projects</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-10 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-zinc-400" />
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">No projects yet.</p>
            <Link href="/builder/new" className="mt-2 inline-block text-violet-600 dark:text-violet-400 hover:underline text-sm">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const profileUrl = `/viewer/projects/${p.project_id}`;
              return (
                <div
                  key={p.project_id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-start gap-3">
                    {p.logo_url ? (
                      <Image src={p.logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{p.name}</h3>
                      {p.tagline && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{p.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/builder/projects/${p.project_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <FileText className="w-3.5 h-3.5" /> Bento profile
                    </Link>
                    <Link
                      href={`/builder/share?project_id=${p.project_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Social Amplifier AI
                    </Link>
                    <Link
                      href={profileUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 dark:border-violet-700 px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Get profile link
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Manage teams</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/builder/teams"
            className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group"
          >
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">My teams</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {teams.length === 0 ? "No teams yet" : `${teams.length} team${teams.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 shrink-0" />
          </Link>
          <Link
            href="/builder/teams"
            className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group"
          >
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Create new team</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Add a team, then create projects under it.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 shrink-0" />
          </Link>
        </div>
      </section>

      <section className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/boosters"
          className="inline-flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          <Lightbulb className="w-4 h-4" /> Explore Boosters
        </Link>
      </section>
    </div>
  );
}
