"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Send, Check, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitProjectSchema, type SubmitProjectSchema } from "@/lib/validations/schemas";
import { submitProjectAction } from "@/lib/actions";
import type { StoredHackathon, StoredProject, StoredSubmission } from "@/lib/data-mappers";

export function SubmitToHackathonForm({
  hackathon,
  projects,
  submissions,
}: {
  hackathon: StoredHackathon;
  projects: StoredProject[];
  submissions: StoredSubmission[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitProjectSchema>({
    resolver: zodResolver(submitProjectSchema),
  });

  const submittedProjectIds = new Set(submissions.map((s) => s.project_id));

  function onSubmit(data: SubmitProjectSchema) {
    setError(null);
    const project = projects.find((p) => p.project_id === data.project_id);
    if (!project?.team_id) {
      setError("This project has no team. Please create a team for it first.");
      return;
    }
    startTransition(async () => {
      const result = await submitProjectAction(hackathon.id, project.team_id!, data.project_id);
      if (result.success) {
        setSubmitted(true);
        router.push(`/builder/projects/${data.project_id}`);
      } else {
        setError(result.error ?? "Submission failed. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      <div className="px-10 pt-10 pb-16 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to hackathons
          </Link>
          <Link
            href="/builder/new"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] tracking-[0.18em] uppercase font-bold no-underline"
            style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
          >
            <span>Create new project</span>
            <ArrowRight size={11} />
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#2d4a3e]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
          Submit project
        </h1>
        <p className="mt-2 text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
          Submit one of your projects to{" "}
          <span className="font-semibold text-[#2d4a3e]">{hackathon.name}</span>.
        </p>

        {submitted ? (
        <div className="mt-8 p-6 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3">
          <Check className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-medium">Project submitted</p>
            <p className="text-sm opacity-90">Redirecting to project...</p>
          </div>
        </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 p-6 rounded-2xl border border-[#2d4a3e]/15 bg-[#f5f2ea]">
            <p className="text-sm text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
              You don&apos;t have any projects yet. Create one first, then submit it to this hackathon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <p className="text-sm text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
              Choose a project to submit:
            </p>
            {error && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            {errors.project_id && (
              <p className="text-xs text-red-600">{errors.project_id.message}</p>
            )}
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.project_id}>
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#2d4a3e]/12 bg-[#f5f2ea] cursor-pointer hover:border-[#2d4a3e]/40 transition-colors has-[:checked]:border-[#2d4a3e] has-[:checked]:ring-1 has-[:checked]:ring-[#2d4a3e]">
                    <input
                      type="radio"
                      {...register("project_id")}
                      value={p.project_id}
                      className="rounded-full border-[#2d4a3e]/40 text-[#2d4a3e] focus:ring-[#2d4a3e]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#2d4a3e]" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {p.name}
                      </span>
                      {p.tagline && (
                        <p className="text-sm text-[#2d4a3e]/60 truncate" style={{ fontFamily: "Georgia, serif" }}>
                          {p.tagline}
                        </p>
                      )}
                      {submittedProjectIds.has(p.project_id) && (
                        <span className="text-[11px] text-emerald-700">
                          Already submitted to this hackathon
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
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase font-bold border-none cursor-pointer"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#2d4a3e",
                color: "#f0ebe0",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <Send className="w-4 h-4" /> {isPending ? "Submitting..." : `Submit to ${hackathon.name}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
