"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { useBoosters } from "@/lib/queries";
import type { BoosterType } from "@/lib/storage";

const TYPES: BoosterType[] = ["idea", "momentum", "capital"];
const TYPE_LABELS: Record<BoosterType, string> = {
  idea: "Idea Boosters",
  momentum: "Momentum Boosters",
  capital: "Capital Boosters",
};

export default function BoosterTypePage() {
  const params = useParams();
  const type = (params.type as string)?.toLowerCase() || "idea";
  const validType = TYPES.includes(type as BoosterType) ? (type as BoosterType) : "idea";
  const { data: list = [], isLoading: loading } = useBoosters(validType);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/boosters"
            className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600"
          >
            <ArrowLeft className="w-4 h-4" /> Explore Boosters
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{TYPE_LABELS[validType]}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Select a booster to ideate, apply with a project, or view your submission.
        </p>

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
          <div className="mt-10 p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No boosters in this category yet.</p>
            <p className="text-sm text-zinc-500 mt-1">Hosts can add boosters from the Host dashboard.</p>
            <Link href="/boosters" className="mt-4 inline-block text-violet-600 dark:text-violet-400 hover:underline">
              ← Back to Explore Boosters
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {list.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/boosters/${validType}/${b.id}`}
                  className="block p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/20 dark:hover:bg-violet-900/10 transition-colors"
                >
                  <h2 className="font-semibold text-zinc-900 dark:text-white">{b.name}</h2>
                  {b.theme && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theme: {b.theme}</p>
                  )}
                  {b.problem_statements.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <FileText className="w-3.5 h-3.5" />
                      {b.problem_statements.length} problem statement{b.problem_statements.length !== 1 ? "s" : ""}
                    </div>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium">
                    Open booster <Send className="w-4 h-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
