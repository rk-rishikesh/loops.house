"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Check, Clock, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { editHackathonAction } from "@/lib/actions";
import type { StoredHackathon } from "@/lib/data-mappers";
import type { PhasePermissions } from "@/lib/hackathon-phase";
import { editHackathonSchema } from "@/lib/validations/schemas";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

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
    watch,
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
    backgroundColor: "#E2FEA5",
    border: "none",
    color: "#0F2C23",
    fontFamily: FN,
  } as const;

  const labelStyle = {
    color: "rgba(15,44,35,0.4)",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: PX,
  } as const;

  const watchedValues = watch();

  return (
    <div className="pt-6 pb-24">
      {/* ── Hero heading ─────────────────────────────────────────────── */}
      <div className="mb-14">
        <h1
          className="font-black text-[#0F2C23] leading-[0.88] uppercase"
          style={{
            fontFamily: PX,
            fontSize: "clamp(52px, 9vw, 138px)",
            letterSpacing: "-0.025em",
          }}
        >
          PROGRAM
          <br />
          DETAILS.
        </h1>
        <div className="flex justify-end mt-8">
          <p
            className="text-[#0F2C23]/55 max-w-[380px] text-right leading-relaxed"
            style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
          >
            Configure the core information, timeline, and prize structure for your program. This data
            is public once the program is launched.
          </p>
        </div>
      </div>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* LEFT COLUMN */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-12">
          {/* Section 01 - Info */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{ fontFamily: PX, fontSize: 32, letterSpacing: "-0.025em" }}
              >
                01
              </span>
              <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                Core Information
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label style={labelStyle} className="mb-2 block">Program Name</label>
                <input
                  {...register("name")}
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
                {errors.name && (
                  <p className="mt-2 text-xs text-red-600" style={{ fontFamily: FN }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">Theme / Tagline</label>
                <input
                  {...register("theme")}
                  placeholder="e.g. Building the future of decentralization"
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">Program Goal</label>
                <textarea
                  {...register("program_goal")}
                  rows={4}
                  placeholder="What is the objective of this program?"
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30 resize-none"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">Website URL (optional)</label>
                <input
                  {...register("website_url")}
                  type="url"
                  placeholder="https://your-program.com"
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>
            </div>
          </div>

          {/* Section 02 - Schedule */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{ fontFamily: PX, fontSize: 32, letterSpacing: "-0.025em" }}
              >
                02
              </span>
              <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                Timeline & Deadlines
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label style={labelStyle} className="mb-2 block">Start Date</label>
                <input
                  {...register("start_date")}
                  type="datetime-local"
                  disabled={!permissions.canEditTimeline}
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors disabled:opacity-40"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>
              <div>
                <label style={labelStyle} className="mb-2 block">Submission Deadline</label>
                <input
                  {...register("submission_deadline")}
                  type="datetime-local"
                  disabled={!permissions.canEditTimeline}
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors disabled:opacity-40"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>
              <div>
                <label style={labelStyle} className="mb-2 block">Judging Deadline</label>
                <input
                  {...register("judging_deadline")}
                  type="datetime-local"
                  disabled={!permissions.canEditTimeline}
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors disabled:opacity-40"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>
              <div>
                <label style={labelStyle} className="mb-2 block">Results Announcement</label>
                <input
                  {...register("results_date")}
                  type="datetime-local"
                  disabled={!permissions.canEditTimeline}
                  className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors disabled:opacity-40"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                />
              </div>
            </div>
            {!permissions.canEditTimeline && (
              <p className="mt-3 text-[10px] text-[#0F2C23]/40 italic" style={{ fontFamily: FN }}>
                Timeline is locked as the program has already started or concluded.
              </p>
            )}
          </div>

          {/* Section 03 - Prizes */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{ fontFamily: PX, fontSize: 32, letterSpacing: "-0.025em" }}
              >
                03
              </span>
              <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                Prizes & Judging
              </p>
            </div>

            <div>
              <label style={labelStyle} className="mb-2 block">Prize Pool Summary</label>
              <textarea
                {...register("bounty_pool_summary")}
                rows={3}
                placeholder="Describe the prizes, tracks, and judging criteria..."
                className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30 resize-none"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-[#0F2C23]/10">
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
              style={{ backgroundColor: "#0F2C23" }}
            >
              <span
                className="pl-5 pr-3 py-3.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#F8FFE8] flex items-center gap-2"
                style={{ fontFamily: PX }}
              >
                {isPending ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Save size={11} />
                )}
                {isPending ? "Saving..." : "Save Changes"}
              </span>
              <span
                className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                style={{ backgroundColor: "#E2FEA5" }}
              >
                <ArrowUpRight size={13} className="text-[#0F2C23]" />
              </span>
            </button>

            {message && (
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-2 text-xs"
                style={{
                  fontFamily: FN,
                  backgroundColor: message.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  color: message.type === "success" ? "#166534" : "#B91C1C",
                  border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}
              >
                {message.type === "success" ? <Check size={12} /> : <Clock size={12} />}
                {message.text}
              </div>
            )}
          </div>
        </form>

        {/* RIGHT SIDEBAR */}
        <aside className="sticky top-[81px] flex flex-col gap-4">
          {/* Status card */}
          <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
            <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5" style={{ fontFamily: PX }}>
              Profile Completion
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Core Info",
                  done: !!watchedValues.name && !!watchedValues.theme,
                  value: watchedValues.name ? "Complete" : "Incomplete",
                },
                {
                  label: "Timeline",
                  done: !!watchedValues.start_date && !!watchedValues.submission_deadline,
                  value: watchedValues.start_date ? "Set" : "Not set",
                },
                {
                  label: "Prizes",
                  done: !!watchedValues.bounty_pool_summary,
                  value: watchedValues.bounty_pool_summary ? "Defined" : "Empty",
                },
              ].map(({ label, done, value }) => (
                <div key={label} className="flex items-center gap-3 py-3 border-b border-[#0F2C23]/08">
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: done ? "#0F2C23" : "rgba(15,44,35,0.1)" }}
                  >
                    {done && <Check size={10} style={{ color: "#F8FFE8" }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#0F2C23]/38" style={{ fontFamily: PX }}>
                      {label}
                    </p>
                    <p className="text-sm text-[#0F2C23]/65 truncate" style={{ fontFamily: FN }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide card */}
          <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#E2FEA5" }}>
            <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-4" style={{ fontFamily: PX }}>
              Configuration Guide
            </p>
            <div className="flex flex-col gap-3">
              {[
                { n: "01", t: "Keep your program name and theme concise to attract more builders." },
                { n: "02", t: "Double-check dates — they affect when submissions and judging are open." },
                { n: "03", t: "A clear prize summary helps participants understand the stakes." },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-start gap-3">
                  <span
                    className="font-black text-[#0F2C23]/20 leading-none shrink-0 mt-0.5"
                    style={{ fontFamily: PX, fontSize: 11, width: 20 }}
                  >
                    {n}
                  </span>
                  <p className="text-xs text-[#0F2C23]/60 leading-relaxed" style={{ fontFamily: FN }}>
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Unsaved changes warning */}
          {isDirty && !isPending && (
            <div className="rounded-2xl px-6 py-4 flex items-center gap-3" style={{ backgroundColor: "#0F2C23" }}>
              <Clock size={16} className="text-[#E2FEA5] shrink-0" />
              <p className="text-[10px] tracking-wide uppercase font-bold text-white/80" style={{ fontFamily: PX }}>
                Unsaved Changes
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
