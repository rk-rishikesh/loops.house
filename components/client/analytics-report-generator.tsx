"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BarChart3, Loader2, Sparkles, TrendingUp, Layers } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getProjects, getBoosterSubmissions } from "@/lib/storage";
import type { StoredBooster } from "@/lib/data-mappers";
import { type AnalyticsFilterSchema } from "@/lib/validations/schemas";

/* ─── Types ──────────────────────────────────────────────────────── */
type AnalyticsResult = {
  narrative?: string;
  highlights?: string[];
  raw_metrics?: unknown;
  generated_at?: string;
};
type ReportType = AnalyticsFilterSchema["report_type"];

/* ─── Helpers ────────────────────────────────────────────────────── */
async function buildMetricsForBooster(boosterId: string) {
  const [allProjects, boosterSubs] = await Promise.all([getProjects(), getBoosterSubmissions(boosterId)]);
  const submittedProjectIds = new Set(boosterSubs.map((s) => s.project_id));
  const projects = allProjects.filter((p) => submittedProjectIds.has(p.project_id));
  const submissions = projects.map((p) => ({
    name: p.name, category: p.category,
    tech_stack_tags: p.tech_stack_tags ?? [], created_at: p.created_at,
  }));
  const categoryCounts = new Map<string, number>();
  const techCounts     = new Map<string, number>();
  for (const s of submissions) {
    if (s.category) categoryCounts.set(s.category, (categoryCounts.get(s.category) ?? 0) + 1);
    for (const t of s.tech_stack_tags ?? []) {
      if (t) techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
    }
  }
  const top_categories  = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const top_tech_stacks = Array.from(techCounts.entries()).map(([tech, count]) => ({ tech, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  return { total_submissions: submissions.length, submissions, top_categories, top_tech_stacks };
}

/* ─── Report type config ─────────────────────────────────────────── */
const REPORT_TYPES: { value: ReportType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "overview",    label: "Overview",    desc: "High-level snapshot of participation and themes",        icon: BarChart3  },
  { value: "submissions", label: "Submissions", desc: "Deep dive into project quality and category breakdown",  icon: Layers     },
  { value: "full",        label: "Full Report", desc: "Complete narrative covering all metrics and highlights", icon: TrendingUp },
];

/* ─── Highlight bar ──────────────────────────────────────────────── */
function HighlightBar({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-[#2d4a3e]/08">
      <span
        className="font-black text-[#2d4a3e]/18 leading-none shrink-0 pt-0.5"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "-0.02em", width: 24 }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="text-[#2d4a3e]/70 leading-relaxed text-sm flex-1" style={{ fontFamily: "Georgia, serif" }}>
        {text}
      </p>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export function AnalyticsReportGenerator({
  booster,
  backHref,
}: {
  booster: StoredBooster;
  backHref: string;
}) {
  const [reportType,      setReportType]      = useState<ReportType>("full");

  const mutation = useMutation({
    mutationFn: async (data: AnalyticsFilterSchema): Promise<AnalyticsResult> => {
      const metrics = await buildMetricsForBooster(data.booster_id);
      const res = await fetch("/api/host-agents/metric-analyst", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booster_id: data.booster_id, report_type: data.report_type,
          booster: { id: booster.id, name: booster.name, theme: booster.theme, problem_statements: booster.problem_statements },
          metrics,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate report");
      return json as AnalyticsResult;
    },
  });

  const result        = mutation.data;
  const isRunning = mutation.isPending;

  const handleGenerate = () => {
    mutation.mutate(
      { booster_id: booster.id, report_type: reportType } satisfies AnalyticsFilterSchema,
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div className="pt-0">
          <div
            className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <Link
              href={backHref}
              className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft size={11} />
                <span>Host</span>
              </span>
            </Link>
            <div className="flex-1 min-w-0 py-8 flex items-center justify-end px-10">
              <span>{booster.name} ANALYTICS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-14">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(52px, 9vw, 138px)",
              letterSpacing: "-0.025em",
            }}
          >
            ANALYTICS
            <br />
            REPORT.
          </h1>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.5vw, 18px)" }}
            >
              Generate an AI narrative from your booster data. Choose a report type, pick a booster, and run.
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 360px" }}>

          {/* ═══ LEFT ════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-10">

            {/* Step 1 — Report type card tiles */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/18"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                >
                  01
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Choose Report Type
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {REPORT_TYPES.map(({ value, label, desc, icon: Icon }) => {
                  const isActive = reportType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReportType(value)}
                      className="text-left rounded-2xl p-5 border-none cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      style={{ backgroundColor: isActive ? "#2d4a3e" : "#d6cfc0" }}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isActive ? "rgba(214,207,192,0.15)" : "rgba(45,74,62,0.1)" }}
                        >
                          <Icon size={16} style={{ color: isActive ? "#d6cfc0" : "#2d4a3e" }} />
                        </div>
                        {isActive && (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#d6cfc0" }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#2d4a3e" }} />
                          </span>
                        )}
                      </div>
                      <p
                        className="font-black uppercase leading-tight mb-1.5"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "-0.01em", color: isActive ? "#f0ebe0" : "#2d4a3e" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ fontFamily: "Georgia, serif", color: isActive ? "rgba(240,235,224,0.5)" : "rgba(45,74,62,0.55)" }}
                      >
                        {desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — Generate for selected booster */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/18"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                >
                  02
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Generate
                </p>
              </div>

              <div className="rounded-3xl p-7 flex items-center justify-between gap-6" style={{ backgroundColor: "#f5f2ea" }}>
                <div className="min-w-0">
                  <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Selected booster
                  </p>
                  <p className="font-semibold text-[#2d4a3e] leading-snug" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}>
                    {booster.name}
                  </p>
                  {booster.theme && (
                    <p className="text-[#2d4a3e]/55 text-sm mt-1" style={{ fontFamily: "Georgia, serif" }}>
                      {booster.theme}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={mutation.isPending}
                  className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <span
                    className="pl-4 pr-3 py-2.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {isRunning ? "Running…" : "Generate"}
                  </span>
                  <span className="w-8 h-8 flex items-center justify-center rounded-full m-1" style={{ backgroundColor: "#d6cfc0" }}>
                    <ArrowUpRight size={13} className="text-[#2d4a3e]" />
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="rounded-2xl px-6 py-4" style={{ backgroundColor: "rgba(200,60,60,0.07)", border: "1px solid rgba(200,60,60,0.15)" }}>
                <p className="text-sm text-red-700" style={{ fontFamily: "Georgia, serif" }}>
                  {mutation.error.message}
                </p>
              </div>
            )}

            {/* Step 3 — Results */}
            {result && (
              <div className="flex flex-col gap-5">
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-black text-[#2d4a3e]/18"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                  >
                    03
                  </span>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Report — {booster.name}
                  </p>
                </div>

                {result.narrative && (
                  <div className="rounded-3xl p-8" style={{ backgroundColor: "#2d4a3e" }}>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p
                          className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/35 mb-1"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {REPORT_TYPES.find((r) => r.value === reportType)?.label} — AI Narrative
                        </p>
                        <p className="text-[#f0ebe0]/55 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                          {booster.name}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(214,207,192,0.1)" }}
                      >
                        <Sparkles size={16} style={{ color: "#d6cfc0" }} />
                      </div>
                    </div>
                    <div className="border-t border-[#f0ebe0]/08 mb-6" />
                    <p
                      className="text-[#f0ebe0]/75 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.4vw, 16px)", lineHeight: 1.9 }}
                    >
                      {result.narrative}
                    </p>
                    {result.generated_at && (
                      <p
                        className="mt-6 text-[9px] tracking-[0.15em] uppercase text-[#f0ebe0]/22"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Generated {result.generated_at}
                      </p>
                    )}
                  </div>
                )}

                {result.highlights && result.highlights.length > 0 && (
                  <div className="rounded-3xl p-8" style={{ backgroundColor: "#f5f2ea" }}>
                    <p
                      className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Key Highlights
                    </p>
                    <h3
                      className="font-black text-[#2d4a3e] uppercase mb-5"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.02em" }}
                    >
                      {result.highlights.length} Takeaways.
                    </h3>
                    <div className="border-t border-[#2d4a3e]/12">
                      {result.highlights.map((h, i) => (
                        <HighlightBar key={i} text={h} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ RIGHT sidebar ════════════════════════════════════════════ */}
          <aside className="sticky top-[81px] flex flex-col gap-4">

            <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                How it works
              </p>
              <div className="border-t border-[#2d4a3e]/12">
                {[
                  { step: "01", title: "Choose a type",    body: "Overview, Submissions, or Full — each surfaces different layers of insight." },
                  { step: "02", title: "Select a booster", body: "Each booster has its own pool of submitted projects and event metadata." },
                  { step: "03", title: "Read the report",  body: "AI reads your booster details and submissions, then writes a structured narrative with highlights." },
                ].map(({ step, title, body }) => (
                  <div key={step} className="flex items-start gap-4 py-5 border-b border-[#2d4a3e]/08">
                    <span
                      className="font-black text-[#2d4a3e]/18 leading-none shrink-0"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "-0.02em", width: 24 }}
                    >
                      {step}
                    </span>
                    <div>
                      <p className="font-semibold text-[#2d4a3e] text-sm mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {title}
                      </p>
                      <p className="text-xs text-[#2d4a3e]/50 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#2d4a3e" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-3"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Current Config
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="font-black text-[#f0ebe0] uppercase"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "-0.01em" }}
                  >
                    {REPORT_TYPES.find((r) => r.value === reportType)?.label}
                  </p>
                  <p className="text-[#f0ebe0]/42 text-xs mt-1 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                    {REPORT_TYPES.find((r) => r.value === reportType)?.desc}
                  </p>
                </div>
                {(() => {
                  const Icon = REPORT_TYPES.find((r) => r.value === reportType)?.icon ?? BarChart3;
                  return <Icon size={20} style={{ color: "rgba(214,207,192,0.35)", flexShrink: 0 }} />;
                })()}
              </div>
            </div>

            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#d6cfc0" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/38 mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                At a glance
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Booster", value: booster.booster_type ?? "—" },
                  { label: "Report Type", value: REPORT_TYPES.find((r) => r.value === reportType)?.label ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-4" style={{ backgroundColor: "rgba(45,74,62,0.08)" }}>
                    <p
                      className="font-black text-[#2d4a3e] leading-none"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: value.length > 4 ? 14 : 22, letterSpacing: "-0.02em" }}
                    >
                      {value}
                    </p>
                    <p
                      className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/42 mt-1.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {mutation.isPending && (
              <div
                className="rounded-2xl px-6 py-5 flex items-center gap-3"
                style={{ backgroundColor: "rgba(45,74,62,0.07)", border: "1px solid rgba(45,74,62,0.12)" }}
              >
                <Loader2 size={15} className="animate-spin shrink-0" style={{ color: "#2d4a3e" }} />
                <div>
                  <p className="text-[11px] font-semibold text-[#2d4a3e]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Generating report…
                  </p>
                  <p className="text-[11px] text-[#2d4a3e]/45 mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                    Analysing submissions and building narrative
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["ANALYTICS REPORT", "★", "AI NARRATIVE", "★", "HOST DASHBOARD", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
