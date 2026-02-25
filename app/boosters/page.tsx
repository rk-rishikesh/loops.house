"use client";

import Link from "next/link";
import { Lightbulb, Zap, DollarSign, FolderOpen, LogIn, ArrowLeft } from "lucide-react";
import { useRole } from "@/lib/queries";

const BOOSTER_CTAS: { type: "idea" | "momentum" | "capital"; label: string; icon: React.ElementType }[] = [
  { type: "idea", label: "Idea Booster", icon: Lightbulb },
  { type: "momentum", label: "Momentum Booster", icon: Zap },
  { type: "capital", label: "Capital Booster", icon: DollarSign },
];

export default function BoostersLandingPage() {
  const { data: role, isFetched: mounted } = useRole();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-violet-600">
            <ArrowLeft className="w-4 h-4" /> Portal
          </Link>
          {mounted && (
            role === "builder" ? (
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700"
              >
                <FolderOpen className="w-4 h-4" /> Project Hub
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Explore Boosters</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Choose a booster type to see opportunities and apply with your project.
        </p>

        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {BOOSTER_CTAS.map(({ type, label, icon: Icon }) => (
            <Link
              key={type}
              href={`/boosters/${type}`}
              className="flex flex-col items-center p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group"
            >
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="mt-3 font-semibold text-zinc-900 dark:text-white text-center">{label}</h2>
              <span className="mt-1 text-sm text-violet-600 dark:text-violet-400">View list →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
