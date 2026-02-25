"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Code2, MessageSquare, ArrowLeft, Search } from "lucide-react";
import { useProjects } from "@/lib/queries";

export default function ViewerPage() {
  const { data: projects = [], isLoading: loading } = useProjects();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.tagline ?? "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }
    return result;
  }, [projects, search, categoryFilter]);

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

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {(search || categoryFilter) && (
            <span className="text-xs text-zinc-500">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <li key={i} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 mb-3" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded mt-2" />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="mt-12 p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <Code2 className="w-12 h-12 mx-auto text-zinc-400" />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">No projects listed yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Create a project as a <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline">Builder</Link> to see it here.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.project_id}>
                <Link
                  href={`/viewer/projects/${p.project_id}`}
                  className="block p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors"
                >
                  {p.logo_url ? (
                    <Image src={p.logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-xl object-cover mb-3" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <Code2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <h2 className="font-semibold text-zinc-900 dark:text-white">{p.name}</h2>
                  {p.tagline && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{p.tagline}</p>
                  )}
                  {((p.tech_stack_tags?.length ?? 0) > 0 || p.category) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.category && (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {p.category}
                        </span>
                      )}
                      {(p.tech_stack_tags ?? []).slice(0, 3).map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                          {t}
                        </span>
                      ))}
                    </div>
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
