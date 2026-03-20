"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  Check,
  Clock,
  Eye,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";
import { editHackathonAction } from "@/lib/actions";
import type { StoredHackathon } from "@/lib/data-mappers";
import type { PhasePermissions } from "@/lib/hackathon-phase";
import { editHackathonSchema } from "@/lib/validations/schemas";
import { HackathonPreviewModal } from "./hackathon-preview-modal";
import { ImageUpload } from "./image-upload";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

type FormData = z.infer<typeof editHackathonSchema>;

interface Props {
  hackathon: StoredHackathon;
  permissions: PhasePermissions;
}

const inputCls =
  "w-full rounded-2xl px-5 py-3 text-sm leading-[1.2] outline-none transition-colors placeholder-[#0F2C23]/30";
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
  fontFamily: FN,
} as const;

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.backgroundColor = "#CBE595";
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.backgroundColor = "#E2FEA5";
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span
        className="font-black text-[#0F2C23]/18"
        style={{ fontFamily: FN, fontSize: 32, letterSpacing: "-0.025em" }}
      >
        {num}
      </span>
      <p
        className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
        style={{ fontFamily: FN }}
      >
        {title}
      </p>
    </div>
  );
}

function parsePrizeSummary(
  text: string,
): {
  title: string;
  currency?: string;
  amount?: number;
  description?: string;
}[] {
  const blocks = text
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const [firstLineRaw, ...rest] = block.split("\n");
    const firstLine = (firstLineRaw ?? "").trim();
    const description = rest.join("\n").trim() || undefined;

    // Expected AI format: "1st Prize — USD 2500" (but be tolerant)
    const parts = firstLine
      .split("—")
      .map((p) => p.trim())
      .filter(Boolean);
    const title = parts[0] ?? firstLine;
    const rhs = parts[1] ?? "";
    const m = rhs.match(/\b([A-Z]{3})\b\s+([\d,]+(?:\.\d+)?)/);
    const currency = m?.[1];
    const amount = m?.[2] ? Number(m[2].replace(/,/g, "")) : undefined;

    return { title, currency, amount, description };
  });
}

function serializePrizeSummary(
  prizes: {
    title: string;
    currency?: string;
    amount?: number;
    description?: string;
  }[],
): string {
  return prizes
    .map((p) => {
      const title = (p.title ?? "").trim();
      const currency = (p.currency ?? "").trim().toUpperCase();
      const amount =
        typeof p.amount === "number" && Number.isFinite(p.amount)
          ? p.amount
          : undefined;
      const firstLine =
        title && currency && typeof amount === "number"
          ? `${title} — ${currency} ${amount.toLocaleString()}`
          : title
            ? title
            : "";

      const desc = (p.description ?? "").trim();
      return [firstLine, desc].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function EditHackathonForm({ hackathon, permissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(editHackathonSchema),
    defaultValues: {
      id: hackathon.id,
      name: hackathon.name,
      description: hackathon.description ?? "",
      theme: hackathon.theme ?? "",
      program_goal: hackathon.program_goal ?? "",
      website_url: hackathon.website_url ?? "",
      logo_url: hackathon.logo_url ?? "",
      banner_url: hackathon.banner_url ?? "",
      start_date: hackathon.start_date?.slice(0, 16) ?? "",
      submission_deadline: hackathon.submission_deadline?.slice(0, 16) ?? "",
      judging_deadline: hackathon.judging_deadline?.slice(0, 16) ?? "",
      results_date: hackathon.results_date?.slice(0, 16) ?? "",
      bounty_pool_summary: hackathon.bounty_pool_summary ?? "",
      problem_statements: hackathon.problem_statements ?? [],
      judging_criteria: hackathon.judging_criteria ?? [],

      technical_resources: hackathon.technical_resources ?? [],
      organizer_notes: hackathon.organizer_notes ?? "",
    },
  });

  const {
    fields: problemFields,
    append: appendProblem,
    remove: removeProblem,
  } = useFieldArray({ control, name: "problem_statements" as never });

  const {
    fields: criteriaFields,
    append: appendCriterion,
    remove: removeCriterion,
  } = useFieldArray({ control, name: "judging_criteria" });

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({ control, name: "technical_resources" });

  const onSubmit = (data: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await editHackathonAction(data);
      if (result.success) {
        setMessage({ type: "success", text: "Hackathon updated" });
        reset(data);
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const watchedValues = watch();
  const [prizeRows, setPrizeRows] = useState(() =>
    parsePrizeSummary(hackathon.bounty_pool_summary ?? ""),
  );
  const [lastSyncedSummary, setLastSyncedSummary] = useState(
    hackathon.bounty_pool_summary ?? "",
  );

  useEffect(() => {
    const nextSummary = watchedValues.bounty_pool_summary ?? "";
    if (nextSummary === lastSyncedSummary) return;
    setPrizeRows(parsePrizeSummary(nextSummary));
    setLastSyncedSummary(nextSummary);
  }, [lastSyncedSummary, watchedValues.bounty_pool_summary]);

  return (
    <div className="pt-6 pb-24">
      {/* Hero */}
      <div className="mb-14 flex flex-row justify-between">
        <div>
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
        </div>

        <div className="flex justify-end mt-8">
          <p
            className="text-[#0F2C23]/55 max-w-[380px] text-right leading-relaxed"
            style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
          >
            Configure the core information, timeline, and prize structure for
            your program. This data is public once the program is launched.
          </p>
        </div>
      </div>

      <div
        className="grid gap-8 items-start"
        style={{ gridTemplateColumns: "1fr 320px" }}
      >
        {/* LEFT COLUMN */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-12"
        >
          {/* Section 01 - Core Information */}
          <div>
            <SectionHeader num="01" title="Core Information" />
            <div className="grid gap-5">
              <div
                className="grid gap-4 items-start"
                style={{ gridTemplateColumns: "180px 1fr" }}
              >
                <div>
                  <label style={labelStyle} className="mb-2 block text-lg">
                    Logo (required)
                  </label>
                  <ImageUpload
                    value={watchedValues.logo_url}
                    onChange={(url) =>
                      setValue("logo_url", url, { shouldDirty: true })
                    }
                    placeholder="Upload logo"
                    variant="square"
                  />
                </div>
                <div>
                  <label style={labelStyle} className="mb-2 block">
                    Banner (optional)
                  </label>
                  <ImageUpload
                    value={watchedValues.banner_url}
                    onChange={(url) =>
                      setValue("banner_url", url, { shouldDirty: true })
                    }
                    placeholder="Upload banner"
                    variant="rect"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Program Name
                </label>
                <input
                  {...register("name")}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
                {errors.name && (
                  <p
                    className="mt-2 text-xs text-red-600"
                    style={{ fontFamily: FN }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">
                  Theme / Tagline
                </label>
                <input
                  {...register("theme")}
                  placeholder="e.g. Building the future of decentralization"
                  className={inputCls}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Detailed description of your program"
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">
                  Program Goal
                </label>
                <textarea
                  {...register("program_goal")}
                  rows={4}
                  placeholder="What is the objective of this program?"
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              <div>
                <label style={labelStyle} className="mb-2 block">
                  Website URL (optional)
                </label>
                <input
                  {...register("website_url")}
                  type="url"
                  placeholder="https://your-program.com"
                  className={inputCls}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>
            </div>
          </div>

          {/* Section 02 - Timeline */}
          <div>
            <SectionHeader num="02" title="Timeline & Deadlines" />
            <div className="grid grid-cols-2 gap-5">
              {(
                [
                  ["start_date", "Start Date"],
                  ["submission_deadline", "Submission Deadline"],
                  ["judging_deadline", "Judging Deadline"],
                  ["results_date", "Results Announcement"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label style={labelStyle} className="mb-2 block">
                    {label}
                  </label>
                  <input
                    {...register(field)}
                    type="datetime-local"
                    disabled={!permissions.canEditTimeline}
                    className={`${inputCls} disabled:opacity-40`}
                    style={inputStyle}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>
              ))}
            </div>
            {!permissions.canEditTimeline && (
              <p
                className="mt-3 text-[10px] text-[#0F2C23]/40 italic"
                style={{ fontFamily: FN }}
              >
                Timeline is locked as the program has already started or
                concluded.
              </p>
            )}
          </div>

          {/* Section 03 - Prizes & Judging */}
          <div>
            <SectionHeader num="03" title="Prizes & Judging" />
            <div className="grid gap-6">
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Prize Pool Summary
                </label>

                <input type="hidden" {...register("bounty_pool_summary")} />

                <div
                  className="rounded-3xl p-6"
                  style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/35"
                      style={{ fontFamily: FN }}
                    >
                      Prize breakdown
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-black border-none cursor-pointer transition-colors hover:bg-[#0F2C23]/8"
                      style={{
                        backgroundColor: "rgba(15,44,35,0.06)",
                        color: "#0F2C23",
                        fontFamily: FN,
                      }}
                      onClick={() => {
                        const next = [
                          ...prizeRows,
                          {
                            title: "Prize",
                            currency: "USD",
                            amount: 0,
                            description: "",
                          },
                        ];
                        setPrizeRows(next);
                        const summary = serializePrizeSummary(next);
                        setLastSyncedSummary(summary);
                        setValue("bounty_pool_summary", summary, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <Plus size={12} /> Add prize
                    </button>
                  </div>

                  {prizeRows.length === 0 ? (
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{ backgroundColor: "rgba(226,254,165,0.35)" }}
                    >
                      <p
                        className="text-sm text-[#0F2C23]/60 leading-relaxed"
                        style={{ fontFamily: FN }}
                      >
                        Add prizes here. This will be saved as the program’s
                        prize summary.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prizeRows.map((p, i) => (
                        <div
                          key={`${p.title}-${i}`}
                          className="rounded-2xl px-4 py-4 border border-[#0F2C23]/10"
                          style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <input
                                value={p.title}
                                placeholder="Prize title (e.g. 1st Prize)"
                                className="w-full rounded-xl px-4 py-2 text-sm outline-none"
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                                onChange={(e) => {
                                  const next = prizeRows.map((row, idx) =>
                                    idx === i
                                      ? { ...row, title: e.target.value }
                                      : row,
                                  );
                                  setPrizeRows(next);
                                  const summary = serializePrizeSummary(next);
                                  setLastSyncedSummary(summary);
                                  setValue("bounty_pool_summary", summary, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                value={p.currency ?? ""}
                                placeholder="USD"
                                className="w-[70px] rounded-xl px-3 py-2 text-sm outline-none uppercase"
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                                onChange={(e) => {
                                  const next = prizeRows.map((row, idx) =>
                                    idx === i
                                      ? {
                                          ...row,
                                          currency: e.target.value
                                            .toUpperCase()
                                            .slice(0, 3),
                                        }
                                      : row,
                                  );
                                  setPrizeRows(next);
                                  const summary = serializePrizeSummary(next);
                                  setLastSyncedSummary(summary);
                                  setValue("bounty_pool_summary", summary, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                              <input
                                value={
                                  typeof p.amount === "number" &&
                                  Number.isFinite(p.amount)
                                    ? String(p.amount)
                                    : ""
                                }
                                inputMode="numeric"
                                placeholder="0"
                                className="w-[110px] rounded-xl px-3 py-2 text-sm outline-none text-right"
                                style={inputStyle}
                                onFocus={focusIn}
                                onBlur={focusOut}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const parsed =
                                    raw.trim() === ""
                                      ? undefined
                                      : Number(raw.replace(/,/g, ""));
                                  const next = prizeRows.map((row, idx) =>
                                    idx === i
                                      ? {
                                          ...row,
                                          amount:
                                            typeof parsed === "number" &&
                                            !Number.isNaN(parsed)
                                              ? parsed
                                              : undefined,
                                        }
                                      : row,
                                  );
                                  setPrizeRows(next);
                                  const summary = serializePrizeSummary(next);
                                  setLastSyncedSummary(summary);
                                  setValue("bounty_pool_summary", summary, {
                                    shouldDirty: true,
                                  });
                                }}
                              />
                              <button
                                type="button"
                                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-red-50"
                                style={{
                                  backgroundColor: "rgba(15,44,35,0.06)",
                                }}
                                onClick={() => {
                                  const next = prizeRows.filter(
                                    (_, idx) => idx !== i,
                                  );
                                  setPrizeRows(next);
                                  const summary = serializePrizeSummary(next);
                                  setLastSyncedSummary(summary);
                                  setValue("bounty_pool_summary", summary, {
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                <Trash2
                                  size={14}
                                  className="text-[#0F2C23]/40"
                                />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <textarea
                              value={p.description ?? ""}
                              rows={2}
                              placeholder="Optional description (eligibility, track notes, etc.)"
                              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none leading-relaxed"
                              style={inputStyle}
                              onFocus={focusIn}
                              onBlur={focusOut}
                              onChange={(e) => {
                                const next = prizeRows.map((row, idx) =>
                                  idx === i
                                    ? { ...row, description: e.target.value }
                                    : row,
                                );
                                setPrizeRows(next);
                                const summary = serializePrizeSummary(next);
                                setLastSyncedSummary(summary);
                                setValue("bounty_pool_summary", summary, {
                                  shouldDirty: true,
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Problem Statements */}
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Problem Statements / Challenges
                </label>
                <div className="flex flex-col gap-2">
                  {problemFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`problem_statements.${idx}` as const)}
                        placeholder={`Challenge ${idx + 1}`}
                        className={`${inputCls} flex-1`}
                        style={inputStyle}
                        onFocus={focusIn}
                        onBlur={focusOut}
                      />
                      <button
                        type="button"
                        onClick={() => removeProblem(idx)}
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-red-50"
                        style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                      >
                        <Trash2 size={14} className="text-[#0F2C23]/40" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendProblem("" as never)}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold border-none cursor-pointer transition-colors hover:bg-[#0F2C23]/8"
                    style={{
                      backgroundColor: "rgba(15,44,35,0.04)",
                      color: "#0F2C23",
                      fontFamily: FN,
                    }}
                  >
                    <Plus size={12} /> Add Challenge
                  </button>
                </div>
              </div>

              {/* Judging Criteria */}
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Judging Criteria
                </label>
                <div className="flex flex-col gap-3">
                  {criteriaFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          {...register(`judging_criteria.${idx}.name` as const)}
                          placeholder="Criterion name"
                          className={inputCls}
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                        <input
                          {...register(
                            `judging_criteria.${idx}.description` as const,
                          )}
                          placeholder="Description"
                          className={inputCls}
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-red-50"
                        style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                      >
                        <Trash2 size={14} className="text-[#0F2C23]/40" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      appendCriterion({ name: "", description: "" })
                    }
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold border-none cursor-pointer transition-colors hover:bg-[#0F2C23]/8"
                    style={{
                      backgroundColor: "rgba(15,44,35,0.04)",
                      color: "#0F2C23",
                      fontFamily: FN,
                    }}
                  >
                    <Plus size={12} /> Add Criterion
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 04 - Resources */}
          <div>
            <SectionHeader num="04" title="Resources" />
            <div className="grid gap-6">
              {/* Technical Resources */}
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Technical Resources
                </label>
                <div className="flex flex-col gap-3">
                  {resourceFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          {...register(
                            `technical_resources.${idx}.url` as const,
                          )}
                          placeholder="Resource URL"
                          className={inputCls}
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                        <input
                          {...register(
                            `technical_resources.${idx}.description` as const,
                          )}
                          placeholder="Description"
                          className={inputCls}
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(idx)}
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-red-50"
                        style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                      >
                        <Trash2 size={14} className="text-[#0F2C23]/40" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendResource({ url: "", description: "" })}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold border-none cursor-pointer transition-colors hover:bg-[#0F2C23]/8"
                    style={{
                      backgroundColor: "rgba(15,44,35,0.04)",
                      color: "#0F2C23",
                      fontFamily: FN,
                    }}
                  >
                    <Plus size={12} /> Add Resource
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 05 - Internal */}
          <div>
            <SectionHeader num="05" title="Internal Notes" />
            <div className="grid gap-5">
              <div>
                <label style={labelStyle} className="mb-2 block">
                  Organizer Notes (Internal)
                </label>
                <textarea
                  {...register("organizer_notes")}
                  rows={4}
                  placeholder="Internal notes for organizers — not visible to participants"
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
                <p
                  className="mt-2 text-[10px] text-[#0F2C23]/40 italic"
                  style={{ fontFamily: FN }}
                >
                  These notes are only visible to hosts and cohosts.
                </p>
              </div>
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
                style={{ fontFamily: FN }}
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
                  backgroundColor:
                    message.type === "success"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(239,68,68,0.08)",
                  color: message.type === "success" ? "#166534" : "#B91C1C",
                  border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}
              >
                {message.type === "success" ? (
                  <Check size={12} />
                ) : (
                  <Clock size={12} />
                )}
                {message.text}
              </div>
            )}
          </div>
        </form>

        {/* RIGHT SIDEBAR */}
        <aside className="sticky top-[81px] flex flex-col gap-4">
          {/* Profile Completion */}
          <div
            className="rounded-3xl p-7"
            style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
          >
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
              style={{ fontFamily: FN }}
            >
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
                  done:
                    !!watchedValues.start_date &&
                    !!watchedValues.submission_deadline,
                  value: watchedValues.start_date ? "Set" : "Not set",
                },
                {
                  label: "Prizes",
                  done: !!watchedValues.bounty_pool_summary,
                  value: watchedValues.bounty_pool_summary
                    ? "Defined"
                    : "Empty",
                },
                {
                  label: "Resources",
                  done: (watchedValues.technical_resources?.length ?? 0) > 0,
                  value:
                    (watchedValues.technical_resources?.length ?? 0) > 0
                      ? "Linked"
                      : "Not set",
                },
              ].map(({ label, done, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 py-3 border-b border-[#0F2C23]/08"
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: done ? "#0F2C23" : "rgba(15,44,35,0.1)",
                    }}
                  >
                    {done && <Check size={10} style={{ color: "#F8FFE8" }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#0F2C23]/38"
                      style={{ fontFamily: FN }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-sm text-[#0F2C23]/65 truncate"
                      style={{ fontFamily: FN }}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview button */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="rounded-2xl px-6 py-4 flex items-center gap-3 border-none cursor-pointer transition-all w-full text-left hover:scale-[1.01]"
            style={{ backgroundColor: "#E2FEA5" }}
          >
            <Eye size={16} style={{ color: "#0F2C23" }} />
            <p
              className="text-[10px] tracking-wide uppercase font-bold"
              style={{ fontFamily: FN, color: "#0F2C23" }}
            >
              Preview Hackathon Information
            </p>
          </button>

          {/* Unsaved changes warning */}
          {isDirty && !isPending && (
            <div
              className="rounded-2xl px-6 py-4 flex items-center gap-3"
              style={{ backgroundColor: "#0F2C23" }}
            >
              <Clock size={16} className="text-[#E2FEA5] shrink-0" />
              <p
                className="text-[10px] tracking-wide uppercase font-bold text-white/80"
                style={{ fontFamily: FN }}
              >
                Unsaved Changes
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Preview modal */}
      {showPreviewModal && (
        <HackathonPreviewModal
          hackathon={{
            id: hackathon.id,
            name: watchedValues.name ?? "",
            description: watchedValues.description,
            theme: watchedValues.theme,
            program_goal: watchedValues.program_goal,
            website_url: watchedValues.website_url,
            logo_url: watchedValues.logo_url,
            banner_url: watchedValues.banner_url,
            start_date: watchedValues.start_date,
            submission_deadline: watchedValues.submission_deadline,
            judging_deadline: watchedValues.judging_deadline,
            results_date: watchedValues.results_date,
            bounty_pool_summary: watchedValues.bounty_pool_summary,
            problem_statements:
              watchedValues.problem_statements?.filter(Boolean) ?? [],
            judging_criteria: watchedValues.judging_criteria,
            technical_resources: watchedValues.technical_resources,
            created_at: hackathon.created_at,
            phase: hackathon.phase,
          }}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
