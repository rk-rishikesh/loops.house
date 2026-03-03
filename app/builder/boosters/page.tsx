"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Send, FileText, Lightbulb, Zap, DollarSign } from "lucide-react";
import { useBoosters } from "@/lib/queries";
import type { BoosterType } from "@/lib/storage";

const BOOSTER_TABS: { id: BoosterType; label: string; icon: React.ElementType }[] = [
  { id: "idea", label: "Idea Boosters", icon: Lightbulb },
  { id: "momentum", label: "Momentum Boosters", icon: Zap },
  { id: "capital", label: "Capital Boosters", icon: DollarSign },
];

export default function BuilderBoostersPage() {
  const [activeTab, setActiveTab] = useState<BoosterType>("idea");
  const { data: list = [], isLoading: loading } = useBoosters(activeTab);

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Explore Boosters</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Find opportunities and apply with a project. Idea, momentum, and capital boosters.
      </p>

      <div className="mt-6 flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 w-fit">
        {BOOSTER_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-56 bg-zinc-100 dark:bg-zinc-800 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-8 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
          <Trophy className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">No boosters in this category yet.</p>
          <p className="text-sm text-zinc-500 mt-1">
            Hosts create boosters and choose the type (Idea, Momentum, or Capital). Check back later or ask your host to add one.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((b) => (
            <li
              key={b.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-zinc-900 dark:text-white">{b.name}</h2>
                  {b.theme && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theme: {b.theme}</p>
                  )}
                  {b.problem_statements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Problem statements
                      </p>
                      <ul className="mt-1.5 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
                        {b.problem_statements.slice(0, 3).map((ps, i) => (
                          <li key={i} className="truncate max-w-full" title={ps}>
                            {ps}
                          </li>
                        ))}
                        {b.problem_statements.length > 3 && (
                          <li className="text-zinc-500">+{b.problem_statements.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {b.sponsor_tracks && b.sponsor_tracks.length > 0 && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {b.sponsor_tracks.length} sponsor track{b.sponsor_tracks.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Link
                  href={`/builder/boosters/${activeTab}/${b.id}/submit`}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 shrink-0"
                >
                  <Send className="w-4 h-4" /> Apply with project
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
