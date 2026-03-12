"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Clock,
  Cpu,
  Layers,
  Loader2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { HackathonStats } from "@/app/host/[hackathon_id]/analytics/page";
import type { StoredHackathon } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Types ──────────────────────────────────────────────────────── */
type AnalyticsResult = {
  narrative?: string;
  highlights?: string[];
  raw_metrics?: unknown;
  generated_at?: string;
};

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: accent ? "#0F2C23" : "rgba(15,44,35,0.04)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: accent ? "rgba(226,254,165,0.12)" : "rgba(15,44,35,0.08)",
        }}
      >
        <Icon size={16} style={{ color: accent ? "#E2FEA5" : "#0F2C23" }} />
      </div>
      <div>
        <p
          className="font-black leading-none"
          style={{
            fontFamily: PX,
            fontSize: "clamp(22px, 2.5vw, 32px)",
            letterSpacing: "-0.02em",
            color: accent ? "#E2FEA5" : "#0F2C23",
          }}
        >
          {value}
        </p>
        <p
          className="text-[9px] tracking-[0.15em] uppercase font-bold mt-1.5"
          style={{
            fontFamily: PX,
            color: accent ? "rgba(226,254,165,0.45)" : "rgba(15,44,35,0.4)",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Bar Chart Row ──────────────────────────────────────────────── */
function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="text-xs font-medium shrink-0 text-right"
        style={{
          fontFamily: FN,
          color: "#0F2C23",
          width: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-6 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: "#0F2C23" }}
        />
      </div>
      <span
        className="text-xs font-bold shrink-0"
        style={{ fontFamily: PX, color: "#0F2C23", width: 28, textAlign: "right" }}
      >
        {count}
      </span>
    </div>
  );
}

/* ─── Phase Badge ────────────────────────────────────────────────── */
function PhaseBadge({ phase }: { phase: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: "rgba(15,44,35,0.08)", text: "#0F2C23" },
    active: { bg: "rgba(34,197,94,0.15)", text: "#166534" },
    judging: { bg: "rgba(234,179,8,0.15)", text: "#854d0e" },
    completed: { bg: "rgba(59,130,246,0.15)", text: "#1e40af" },
    archived: { bg: "rgba(107,114,128,0.15)", text: "#374151" },
  };
  const c = colors[phase] ?? colors.draft;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[10px] tracking-[0.12em] uppercase font-bold"
      style={{ fontFamily: PX, backgroundColor: c.bg, color: c.text }}
    >
      {phase}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export function HackathonAnalytics({
  hackathon,
  stats,
  backHref,
}: {
  hackathon: StoredHackathon;
  stats: HackathonStats;
  backHref: string;
}) {
  const [aiResult, setAiResult] = useState<AnalyticsResult | null>(null);
  const canTriggerAI = stats.currentPhase === "judging";

  const aiMutation = useMutation({
    mutationFn: async (): Promise<AnalyticsResult> => {
      // Build metrics payload from stats
      const metrics = {
        total_submissions: stats.totalSubmissions,
        top_categories: stats.topCategories,
        top_tech_stacks: stats.topTechStacks,
        submissions: [], // AI only needs aggregates
      };
      const res = await fetch("/api/host-agents/metric-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathon_id: hackathon.id,
          report_type: "full",
          hackathon: {
            id: hackathon.id,
            name: hackathon.name,
            theme: hackathon.theme,
            problem_statements: hackathon.problem_statements,
          },
          metrics,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate analysis");
      return json as AnalyticsResult;
    },
    onSuccess: (data) => setAiResult(data),
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      {/* ── Nav ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#F8FFE8" }}>
        <div
          className="flex w-full items-stretch border-t border-b border-[#0F2C23] text-[10px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]"
          style={{ fontFamily: PX }}
        >
          <Link
            href={backHref}
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#0F2C23] no-underline hover:bg-[rgba(15,44,35,0.06)]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Host</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-between px-10">
            <div className="flex items-center gap-3">
              <PhaseBadge phase={stats.currentPhase} />
              {stats.daysToDeadline !== null && (
                <span
                  className="text-[10px] tracking-[0.12em] uppercase font-bold"
                  style={{
                    fontFamily: PX,
                    color: stats.daysToDeadline <= 3 ? "#dc2626" : "rgba(15,44,35,0.45)",
                  }}
                >
                  {stats.daysToDeadline > 0
                    ? `${stats.daysToDeadline}d left`
                    : stats.daysToDeadline === 0
                      ? "Today"
                      : `${Math.abs(stats.daysToDeadline)}d ago`}
                </span>
              )}
            </div>
            <span>{hackathon.name} ANALYTICS</span>
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className="mb-14">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(42px, 7vw, 110px)",
              letterSpacing: "-0.025em",
            }}
          >
            {hackathon.name}
            <br />
            <span style={{ color: "rgba(15,44,35,0.15)" }}>ANALYTICS.</span>
          </h1>
        </div>

        {/* ── Stat Cards Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard label="Submissions" value={stats.totalSubmissions} icon={Layers} accent />
          <StatCard label="Judges" value={stats.judgeCount} icon={Users} />
          <StatCard
            label="AI Evaluated"
            value={`${stats.aiEvaluatedCount}/${stats.totalSubmissions}`}
            icon={Cpu}
          />
          <StatCard label="Judge Reviews" value={stats.humanEvaluationCount} icon={Trophy} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
          <StatCard label="Avg Momentum" value={stats.avgMomentumScore} icon={Zap} />
          <StatCard label="Current Phase" value={stats.currentPhase.toUpperCase()} icon={Clock} />
          {Object.entries(stats.submissionsByStatus).map(([status, count]) => (
            <StatCard key={status} label={status} value={count} icon={BarChart3} />
          ))}
        </div>

        {/* ── Two-column: Categories + Tech Stacks ───────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Categories */}
          <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.03)" }}>
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
              style={{ fontFamily: PX }}
            >
              Top Categories
            </p>
            {stats.topCategories.length > 0 ? (
              <div>
                {stats.topCategories.map((c) => (
                  <BarRow
                    key={c.category}
                    label={c.category}
                    count={c.count}
                    max={stats.topCategories[0].count}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#0F2C23]/40" style={{ fontFamily: FN }}>
                No category data yet
              </p>
            )}
          </div>

          {/* Tech Stacks */}
          <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.03)" }}>
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
              style={{ fontFamily: PX }}
            >
              Top Tech Stacks
            </p>
            {stats.topTechStacks.length > 0 ? (
              <div>
                {stats.topTechStacks.map((t) => (
                  <BarRow
                    key={t.tech}
                    label={t.tech}
                    count={t.count}
                    max={stats.topTechStacks[0].count}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#0F2C23]/40" style={{ fontFamily: FN }}>
                No tech stack data yet
              </p>
            )}
          </div>
        </div>

        {/* ── AI Analysis Section ────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-1"
                style={{ fontFamily: PX }}
              >
                AI Analysis
              </p>
              <p className="text-sm text-[#0F2C23]/55" style={{ fontFamily: FN }}>
                {canTriggerAI
                  ? "Generate a one-time AI narrative before finalizing results."
                  : stats.currentPhase === "completed" || stats.currentPhase === "archived"
                    ? "AI analysis is no longer available after completion."
                    : "AI analysis is available during the judging phase."}
              </p>
            </div>
            {canTriggerAI && !aiResult && (
              <button
                type="button"
                onClick={() => aiMutation.mutate()}
                disabled={aiMutation.isPending}
                className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <span
                  className="pl-4 pr-3 py-2.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#F8FFE8] flex items-center gap-2"
                  style={{ fontFamily: PX }}
                >
                  {aiMutation.isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  {aiMutation.isPending ? "Analyzing…" : "Run Analysis"}
                </span>
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                  style={{ backgroundColor: "#E2FEA5" }}
                >
                  <ArrowUpRight size={13} className="text-[#0F2C23]" />
                </span>
              </button>
            )}
          </div>

          {/* Error */}
          {aiMutation.isError && (
            <div
              className="rounded-2xl px-6 py-4 mb-6"
              style={{
                backgroundColor: "rgba(200,60,60,0.07)",
                border: "1px solid rgba(200,60,60,0.15)",
              }}
            >
              <p className="text-sm text-red-700" style={{ fontFamily: FN }}>
                {aiMutation.error.message}
              </p>
            </div>
          )}

          {/* AI Result */}
          {aiResult && (
            <div className="flex flex-col gap-5">
              {aiResult.narrative && (
                <div className="rounded-3xl p-8" style={{ backgroundColor: "#0F2C23" }}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p
                        className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#F8FFE8]/35 mb-1"
                        style={{ fontFamily: PX }}
                      >
                        AI Narrative
                      </p>
                      <p className="text-[#F8FFE8]/55 text-sm" style={{ fontFamily: FN }}>
                        {hackathon.name}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(226,254,165,0.1)" }}
                    >
                      <Sparkles size={16} style={{ color: "#E2FEA5" }} />
                    </div>
                  </div>
                  <div className="border-t border-[#F8FFE8]/08 mb-6" />
                  <p
                    className="text-[#F8FFE8]/75 leading-relaxed whitespace-pre-wrap"
                    style={{
                      fontFamily: FN,
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      lineHeight: 1.9,
                    }}
                  >
                    {aiResult.narrative}
                  </p>
                  {aiResult.generated_at && (
                    <p
                      className="mt-6 text-[9px] tracking-[0.15em] uppercase text-[#F8FFE8]/22"
                      style={{ fontFamily: PX }}
                    >
                      Generated {aiResult.generated_at}
                    </p>
                  )}
                </div>
              )}

              {aiResult.highlights && aiResult.highlights.length > 0 && (
                <div className="rounded-3xl p-8" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-1"
                    style={{ fontFamily: PX }}
                  >
                    Key Highlights
                  </p>
                  <h3
                    className="font-black text-[#0F2C23] uppercase mb-5"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(18px, 2vw, 24px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {aiResult.highlights.length} Takeaways.
                  </h3>
                  <div className="border-t border-[#0F2C23]/12">
                    {aiResult.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-5 border-b border-[#0F2C23]/08"
                      >
                        <span
                          className="font-black text-[#0F2C23]/18 leading-none shrink-0 pt-0.5"
                          style={{
                            fontFamily: PX,
                            fontSize: 13,
                            letterSpacing: "-0.02em",
                            width: 24,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p
                          className="text-[#0F2C23]/70 leading-relaxed text-sm flex-1"
                          style={{ fontFamily: FN }}
                        >
                          {h}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Ticker ─────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#0F2C23]/10 py-3"
        style={{ backgroundColor: "#F8FFE8" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            ["ANALYTICS", "★", "REAL-TIME STATS", "★", "HOST DASHBOARD", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: PX,
                  color: t === "★" ? "#0F2C23" : "rgba(15,44,35,0.4)",
                }}
              >
                {t}
              </span>
            )),
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
