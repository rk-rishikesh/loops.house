"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Code2, MessageSquare, ArrowLeft } from "lucide-react";
import { getProjects } from "@/lib/storage";

export default function ViewerPage() {
  const [projects, setProjects] = useState<ReturnType<typeof getProjects>>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600">
            <ArrowLeft className="w-4 h-4" /> Portal
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Explore Projects</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          All projects. Open one to chat and ask questions about the code.
        </p>

        {projects.length === 0 ? (
          <div className="mt-12 p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <Code2 className="w-12 h-12 mx-auto text-zinc-400" />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">No projects listed yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Create a project as a <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline">Builder</Link> to see it here.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.project_id}>
                <Link
                  href={`/viewer/projects/${p.project_id}`}
                  className="block p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors"
                >
                  {p.logo_url ? (
                    <img src={p.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover mb-3" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <Code2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <h2 className="font-semibold text-zinc-900 dark:text-white">{p.name}</h2>
                  {p.tagline && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{p.tagline}</p>
                  )}
                  {p.category && (
                    <span className="mt-2 inline-block text-xs px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {p.category}
                    </span>
                  )}
                  <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <MessageSquare className="w-3 h-3" /> Chat & ask code
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
