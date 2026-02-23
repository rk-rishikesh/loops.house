"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FolderOpen, PlusCircle } from "lucide-react";
import { getProjects } from "@/lib/storage";

export default function BuilderProjectsPage() {
  const [projects, setProjects] = useState<ReturnType<typeof getProjects>>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My projects</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        All Loops profiles you've created. Open a project to view, share, or apply to boosters.
      </p>

      <Link
        href="/builder/new"
        className="mt-6 flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors w-full sm:w-auto sm:max-w-md"
      >
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div className="min-w-0 text-left">
          <span className="font-semibold text-zinc-900 dark:text-white">Create new project</span>
          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
            Profile Creator
          </span>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">AI-powered profile from GitHub, demo, theme.</p>
        </div>
      </Link>

      {projects.length === 0 ? (
        <div className="mt-8 p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-zinc-400" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">No projects yet.</p>
          <Link href="/builder/new" className="mt-2 inline-block text-violet-600 dark:text-violet-400 hover:underline">
            Create your first profile
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.project_id}>
              <Link
                href={`/builder/projects/${p.project_id}`}
                className="block p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/20 dark:hover:bg-violet-900/10 transition-colors"
              >
                <h2 className="font-semibold text-zinc-900 dark:text-white">{p.name}</h2>
                {p.tagline && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{p.tagline}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.category && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {p.category}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-medium">
                    Social
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
