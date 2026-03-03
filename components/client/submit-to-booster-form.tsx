"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitProjectSchema, type SubmitProjectSchema } from "@/lib/validations/schemas";
import { submitProjectAction } from "@/lib/actions";
import type { StoredBooster, StoredProject, StoredSubmission } from "@/lib/data-mappers";
import type { BoosterType } from "@/lib/data-mappers";

export function SubmitToBoosterForm({
  booster,
  projects,
  submissions,
  type,
}: {
  booster: StoredBooster;
  projects: StoredProject[];
  submissions: StoredSubmission[];
  type: BoosterType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitProjectSchema>({
    resolver: zodResolver(submitProjectSchema),
  });

  const submittedProjectIds = new Set(submissions.map((s) => s.project_id));

  function onSubmit(data: SubmitProjectSchema) {
    const project = projects.find((p) => p.project_id === data.project_id);
    if (!project?.team_id) return;
    startTransition(async () => {
      const result = await submitProjectAction(booster.id, project.team_id!, data.project_id);
      if (result.success) {
        router.push(`/builder/projects/${data.project_id}`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Link
        href={`/builder/boosters/${type}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to boosters
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Submit project</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Submit one of your projects to{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{booster.name}</span>.
      </p>

      {isPending ? (
        <div className="mt-8 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
          <Check className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-medium">Project submitted</p>
            <p className="text-sm opacity-90">Redirecting to project…</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">You don&apos;t have any projects yet.</p>
          <Link href="/builder/new" className="mt-3 inline-block text-violet-600 dark:text-violet-400 hover:underline text-sm">
            Create a profile first →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Choose a project to submit:</p>
          {errors.project_id && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.project_id.message}</p>
          )}
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.project_id}>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors has-[:checked]:border-violet-500 has-[:checked]:ring-1 has-[:checked]:ring-violet-500">
                  <input
                    type="radio"
                    {...register("project_id")}
                    value={p.project_id}
                    className="rounded-full border-zinc-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-900 dark:text-white">{p.name}</span>
                    {p.tagline && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{p.tagline}</p>
                    )}
                    {submittedProjectIds.has(p.project_id) && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        Already submitted to this booster
                      </span>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit to {booster.name}
          </button>
        </form>
      )}
    </div>
  );
}
