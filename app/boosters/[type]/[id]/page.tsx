"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Send, FileText, CheckCircle, Clock, Trophy, BookOpen, Users, HelpCircle } from "lucide-react";
import { getBoosterWithTracks, getProjects, getBoosterSubmissions } from "@/lib/storage";
import type { StoredBooster, StoredProject, StoredSubmission } from "@/lib/storage";
import { getRole, type AppRole } from "@/lib/auth";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea Booster",
  momentum: "Momentum Booster",
  capital: "Capital Booster",
};

export default function IndividualBoosterPage() {
  const params = useParams();
  const type = (params.type as string) || "idea";
  const id = params.id as string;
  const [booster, setBooster] = useState<StoredBooster | null | undefined>(undefined);
  const [submittedProject, setSubmittedProject] = useState<StoredProject | null>(null);
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    getRole().then(setRole);
    getBoosterWithTracks(id).then(setBooster);
    getBoosterSubmissions(id).then(setSubmissions);
    getProjects().then((projects) => {
      const submitted = projects.find((p) => (p as Record<string, unknown>).booster_id === id) ?? null;
      setSubmittedProject(submitted);
    });
  }, [id]);

  if (booster === undefined) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-12">
          <p className="text-zinc-500">Loading…</p>
        </div>
      </main>
    );
  }

  if (booster === null) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-12">
          <Link href="/boosters" className="text-violet-600 hover:underline">← Explore Boosters</Link>
          <p className="mt-4 text-zinc-500">Booster not found.</p>
        </div>
      </main>
    );
  }

  const typeLabel = TYPE_LABELS[type] || "Booster";

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3">
          <Link
            href={`/boosters/${type}`}
            className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600"
          >
            <ArrowLeft className="w-4 h-4" /> {TYPE_LABELS[type] || type}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{booster.name}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{typeLabel}</p>
        {booster.theme && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Theme: {booster.theme}</p>
        )}
        {booster.problem_statements.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Problem statements
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              {booster.problem_statements.map((ps, i) => (
                <li key={i}>{ps}</li>
              ))}
            </ul>
          </div>
        )}

        {booster.program_goal && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> About
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{booster.program_goal}</p>
          </div>
        )}

        {booster.timeline && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Timeline
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{booster.timeline}</p>
          </div>
        )}

        {booster.bounty_pool_summary && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Prizes
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{booster.bounty_pool_summary}</p>
          </div>
        )}

        {(booster.sponsor_tracks?.length ?? 0) > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Sponsor Tracks
            </p>
            <ul className="mt-2 space-y-2">
              {booster.sponsor_tracks!.map((t, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{t.sponsor}</span>
                  {t.track_description && (
                    <span className="text-zinc-500 dark:text-zinc-400"> — {t.track_description}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {submissions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Link
            href={`/builder/ideate?booster_id=${id}`}
            className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
          >
            <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Ideate Project</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Refine your idea with the AI mentor for this booster.
              </p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium shrink-0">AI</span>
          </Link>

          {mounted && role === "builder" && (booster.sponsor_tracks?.length ?? 0) > 0 && (
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Tech Buddy</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Ask technical questions about sponsor APIs and documentation.
                </p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium shrink-0">AI</span>
            </div>
          )}

          {mounted && role === "builder" && (
            <Link
              href={`/builder/boosters/${id}/submit`}
              className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Apply with project</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Create a new project or select an existing one to submit.
                </p>
              </div>
              <span className="text-violet-600 dark:text-violet-400 text-sm font-medium shrink-0">→</span>
            </Link>
          )}

          {mounted && role !== "builder" && (
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
              <Send className="w-6 h-6 text-zinc-400 shrink-0" />
              <div>
                <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">Apply with project</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline">Login as Builder</Link> to submit a project.
                </p>
              </div>
            </div>
          )}

          {submittedProject && (
            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
              <h2 className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> My submission
              </h2>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{submittedProject.name}</p>
              <Link
                href={`/builder/projects/${submittedProject.project_id}`}
                className="mt-2 inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View project →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
