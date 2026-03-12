"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { editHackathonAction } from "@/lib/actions";
import type { StoredHackathon } from "@/lib/data-mappers";
import type { PhasePermissions } from "@/lib/hackathon-phase";
import { editHackathonSchema } from "@/lib/validations/schemas";

type FormData = z.infer<typeof editHackathonSchema>;

interface Props {
  hackathon: StoredHackathon;
  permissions: PhasePermissions;
}

export function EditHackathonForm({ hackathon, permissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(editHackathonSchema),
    defaultValues: {
      id: hackathon.id,
      name: hackathon.name,
      theme: hackathon.theme ?? "",
      program_goal: hackathon.program_goal ?? "",
      website_url: hackathon.website_url ?? "",
      start_date: hackathon.start_date?.slice(0, 16) ?? "",
      submission_deadline: hackathon.submission_deadline?.slice(0, 16) ?? "",
      judging_deadline: hackathon.judging_deadline?.slice(0, 16) ?? "",
      results_date: hackathon.results_date?.slice(0, 16) ?? "",
      bounty_pool_summary: hackathon.bounty_pool_summary ?? "",
      problem_statements: hackathon.problem_statements ?? [],
    },
  });

  const onSubmit = (data: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await editHackathonAction(data);
      if (result.success) {
        setMessage({ type: "success", text: "Hackathon updated" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const inputStyle = {
    background: "rgba(15,44,35,0.04)",
    border: "1px solid rgba(15,44,35,0.12)",
    color: "#2d4a3e",
  };

  const labelStyle = { color: "#2d4a3e", fontSize: "0.875rem", fontWeight: 500 } as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* === INFO SECTION === */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "rgba(15,44,35,0.1)", background: "white" }}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#2d4a3e" }}>
          Info
        </h2>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Name</label>
            <input
              {...register("name")}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Theme</label>
            <input
              {...register("theme")}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Program Goal</label>
            <textarea
              {...register("program_goal")}
              rows={3}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Website URL</label>
            <input
              {...register("website_url")}
              type="url"
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* === SCHEDULE SECTION === */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "rgba(15,44,35,0.1)", background: "white" }}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#2d4a3e" }}>
          Schedule
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              {...register("start_date")}
              type="datetime-local"
              disabled={!permissions.canEditTimeline}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Submission Deadline</label>
            <input
              {...register("submission_deadline")}
              type="datetime-local"
              disabled={!permissions.canEditTimeline}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Judging Deadline</label>
            <input
              {...register("judging_deadline")}
              type="datetime-local"
              disabled={!permissions.canEditTimeline}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Results Date</label>
            <input
              {...register("results_date")}
              type="datetime-local"
              disabled={!permissions.canEditTimeline}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* === PRIZES SECTION === */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "rgba(15,44,35,0.1)", background: "white" }}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#2d4a3e" }}>
          Prizes & Judging
        </h2>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Prize Pool Summary</label>
            <textarea
              {...register("bounty_pool_summary")}
              rows={2}
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      {message && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="rounded-xl px-6 py-2.5 text-sm font-medium transition-opacity disabled:opacity-40"
        style={{ background: "#2d4a3e", color: "#f0ebe0" }}
      >
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
