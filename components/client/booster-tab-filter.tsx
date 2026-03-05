"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Trophy, Send, FileText, Lightbulb, Zap, DollarSign } from "lucide-react";
import type { StoredBooster, BoosterType } from "@/lib/data-mappers";

const BOOSTER_TABS: { id: BoosterType; label: string; icon: React.ElementType }[] = [
  { id: "idea", label: "Idea Boosters", icon: Lightbulb },
  { id: "momentum", label: "Momentum Boosters", icon: Zap },
  { id: "capital", label: "Capital Boosters", icon: DollarSign },
];

export function BoosterTabFilter({ boosters }: { boosters: StoredBooster[] }) {
  const [activeTab, setActiveTab] = useState<BoosterType>("idea");

  const list = useMemo(
    () => boosters.filter((b) => (b.booster_type ?? "idea") === activeTab),
    [boosters, activeTab],
  );

  return (
    <>
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

      {list.length === 0 ? (
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
                  {b.theme && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theme: {b.theme}</p>}
                  {b.problem_statements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Problem statements
                      </p>
                      <ul className="mt-1.5 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
                        {b.problem_statements.slice(0, 3).map((ps, i) => (
                          <li key={i} className="truncate max-w-full" title={ps}>{ps}</li>
                        ))}
                        {b.problem_statements.length > 3 && (
                          <li className="text-zinc-500">+{b.problem_statements.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <Link
                  href={`/boosters/${activeTab}/${b.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 shrink-0"
                >
                  <Send className="w-4 h-4" /> View Details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
