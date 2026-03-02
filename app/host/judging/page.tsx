"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Gavel, Loader2, Sparkles,
  Check, ChevronRight, Star,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getProject, getBooster } from "@/lib/storage";
import { useProjects, useBoosters } from "@/lib/queries";
import { judgingEvalSchema, type JudgingEvalSchema } from "@/lib/validations/schemas";

/* ─── Types ──────────────────────────────────────────────────────── */
type EvalResult = {
  overall_score?: number;
  overall_summary?: string;
  criteria_scores?: {
    criterion_name: string;
    score: number;
    max_score: number;
    justification: string;
    strength: string;
    improvement: string;
  }[];
  generated_at?: string;
};

/* ─── Score ring ─────────────────────────────────────────────────── */
function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(score / max, 1);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const dash = pct * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={104} height={104} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(214,207,192,0.2)" strokeWidth={7} />
        <circle
          cx={52} cy={52} r={r} fill="none"
          stroke="#d6cfc0"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-black text-[#f0ebe0] leading-none"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, letterSpacing: "-0.03em" }}
        >
          {score}
        </span>
        <span
          className="text-[#f0ebe0]/38 text-[9px] tracking-[0.12em] uppercase font-bold mt-0.5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          /{max}
        </span>
      </div>
    </div>
  );
}

/* ─── Score bar ──────────────────────────────────────────────────── */
function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 70 ? "#2d4a3e" : pct >= 45 ? "rgba(45,74,62,0.6)" : "rgba(45,74,62,0.3)";
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(45,74,62,0.1)" }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}

/* ─── Criteria card ──────────────────────────────────────────────── */
function CriteriaCard({
  criterion, index, humanScore, humanRemark,
  onScoreChange, onRemarkChange,
}: {
  criterion: NonNullable<EvalResult["criteria_scores"]>[0];
  index: number;
  humanScore: number | undefined;
  humanRemark: string | undefined;
  onScoreChange: (val: number) => void;
  onRemarkChange: (val: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ backgroundColor: "#f5f2ea" }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left bg-transparent border-none cursor-pointer group"
      >
        {/* Index */}
        <span
          className="font-black text-[#2d4a3e]/18 leading-none shrink-0"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "-0.02em", width: 24 }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Name + bar */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-[#2d4a3e] leading-snug mb-2"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.3vw, 15px)" }}
          >
            {criterion.criterion_name}
          </p>
          <ScoreBar score={criterion.score} max={criterion.max_score} />
        </div>

        {/* AI score pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className="font-black text-[#2d4a3e] leading-none"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, letterSpacing: "-0.02em" }}
            >
              {criterion.score}
            </span>
            <span
              className="text-[#2d4a3e]/35 text-[11px] ml-0.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              /{criterion.max_score}
            </span>
          </div>
          {humanScore !== undefined && (
            <span
              className="text-[8px] tracking-[0.12em] uppercase font-bold px-2 py-1 rounded-sm shrink-0"
              style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}
            >
              ✓ Judged
            </span>
          )}
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{ color: "rgba(45,74,62,0.3)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Expanded body */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 600 : 0 }}
      >
        <div className="px-6 pb-6 flex flex-col gap-5" style={{ paddingLeft: "calc(24px + 24px + 16px)" }}>
          {/* AI detail */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: "rgba(45,74,62,0.05)" }}
          >
            <p
              className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/38"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              AI Evaluation
            </p>
            <p className="text-[#2d4a3e]/65 leading-relaxed text-sm" style={{ fontFamily: "Georgia, serif" }}>
              {criterion.justification}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <p
                  className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#2d4a3e]/35 mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Strength
                </p>
                <p className="text-xs text-[#2d4a3e]/60 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                  {criterion.strength}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#2d4a3e]/35 mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Improvement
                </p>
                <p className="text-xs text-[#2d4a3e]/60 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                  {criterion.improvement}
                </p>
              </div>
            </div>
          </div>

          {/* Human judge override */}
          <div>
            <p
              className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40 mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Judge Override
            </p>
            <div className="flex gap-3 items-start">
              <div className="shrink-0">
                <p
                  className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/35 mb-1.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Score (0–{criterion.max_score})
                </p>
                <input
                  type="number"
                  min={0}
                  max={criterion.max_score}
                  placeholder={String(criterion.score)}
                  value={humanScore ?? ""}
                  onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
                  className="w-20 rounded-xl px-3 py-2.5 text-sm outline-none font-semibold text-center transition-colors"
                  style={{
                    backgroundColor: humanScore !== undefined ? "#2d4a3e" : "#d6cfc0",
                    color: humanScore !== undefined ? "#f0ebe0" : "#2d4a3e",
                    border: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = humanScore !== undefined ? "#2d4a3e" : "#d6cfc0")}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/35 mb-1.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Remarks
                </p>
                <input
                  type="text"
                  placeholder="Your notes…"
                  value={humanRemark ?? ""}
                  onChange={(e) => onRemarkChange(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder-[#2d4a3e]/30"
                  style={{
                    backgroundColor: "#d6cfc0",
                    border: "none",
                    color: "#2d4a3e",
                    fontFamily: "Georgia, serif",
                  }}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page wrapper ───────────────────────────────────────────────── */
export default function HostJudgingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0ebe0" }}>
        <Loader2 size={18} className="animate-spin" style={{ color: "#2d4a3e" }} />
      </div>
    }>
      <HostJudgingPageContent />
    </Suspense>
  );
}

/* ─── Page content ───────────────────────────────────────────────── */
function HostJudgingPageContent() {
  const searchParams = useSearchParams();
  const { data: projects = [] } = useProjects();
  const { data: boosters = [] } = useBoosters();

  const [humanScores,  setHumanScores]  = useState<Record<string, number>>({});
  const [humanRemarks, setHumanRemarks] = useState<Record<string, string>>({});
  const [humanSaved,   setHumanSaved]   = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<JudgingEvalSchema>({
    resolver: zodResolver(judgingEvalSchema),
    defaultValues: {
      project_id: searchParams.get("project_id") ?? "",
      booster_id: searchParams.get("booster_id") ?? "",
      mode: "official",
    },
  });

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      project_id: prev.project_id || projects[0]?.project_id || "",
      booster_id: prev.booster_id || boosters[0]?.id || "",
      mode: "official",
    }));
  }, [projects, boosters, reset]);

  const projectId = watch("project_id");
  const boosterId = watch("booster_id");

  const selectedProject = projects.find((p) => p.project_id === projectId);
  const selectedBooster = boosters.find((b) => b.id === boosterId);

  const evalMutation = useMutation({
    mutationFn: async (data: JudgingEvalSchema): Promise<EvalResult> => {
      const project = await getProject(data.project_id);
      const booster = await getBooster(data.booster_id);
      const res = await fetch("/api/host-agents/project-evaluator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: data.project_id,
          booster_id: data.booster_id,
          judge_mode: "official",
          project: project ? {
            name: project.name, tagline: project.tagline,
            refined_description: project.refined_description,
            description: (project as { description?: string }).description,
            key_features: project.key_features, tech_stack_tags: project.tech_stack_tags,
            category: project.category,
            flattened_codebase: project.flattened_codebase?.slice(0, 50000),
          } : undefined,
          booster: booster ? {
            id: booster.id, name: booster.name, theme: booster.theme,
            problem_statements: booster.problem_statements, sponsor_tracks: booster.sponsor_tracks,
          } : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Evaluation failed");
      return json as EvalResult;
    },
    onSuccess: () => { setHumanScores({}); setHumanRemarks({}); setHumanSaved(false); },
  });

  const humanScoreMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        scores: humanScores, remarks: humanRemarks,
        overall: Object.keys(humanScores).length > 0
          ? Math.round(Object.values(humanScores).reduce((a, b) => a + b, 0) / Object.keys(humanScores).length)
          : 0,
        judged_at: new Date().toISOString(),
      };
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("submissions").update({ human_score: payload })
        .eq("project_id", projectId).eq("booster_id", boosterId);
    },
    onSuccess: () => setHumanSaved(true),
  });

  const result           = evalMutation.data;
  const humanJudgedCount = Object.keys(humanScores).length;
  const totalCriteria    = result?.criteria_scores?.length ?? 0;
  const humanOverall     = humanJudgedCount > 0
    ? Math.round(Object.values(humanScores).reduce((a, b) => a + b, 0) / humanJudgedCount)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-10 py-5 flex items-center justify-between"
        style={{ backgroundColor: "#f0ebe0", borderBottom: "1px solid rgba(45,74,62,0.1)" }}
      >
        <Link
          href="/host"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Host
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}
          >
            Official — Host only
          </span>
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
            AI
            <br />
            JUDGING.
          </h1>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.5vw, 18px)" }}
            >
              Evaluate a project against the booster rubric. Override individual criteria with your own scores.
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* ═══ LEFT — evaluation form + results ════════════════════════ */}
          <div className="flex flex-col gap-10">

            {/* Context cards — project + booster */}
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
                  Project & Booster
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Project card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "#d6cfc0" }}>
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Project
                  </p>
                  {selectedProject ? (
                    <>
                      <p
                        className="font-black text-[#2d4a3e] uppercase leading-tight mb-1"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(15px, 1.8vw, 20px)", letterSpacing: "-0.02em" }}
                      >
                        {selectedProject.name}
                      </p>
                      {selectedProject.tagline && (
                        <p className="text-[#2d4a3e]/55 text-sm leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                          {selectedProject.tagline}
                        </p>
                      )}
                      {selectedProject.category && (
                        <span
                          className="inline-block mt-3 text-[8px] tracking-[0.14em] uppercase font-bold px-2.5 py-1 rounded-sm"
                          style={{ backgroundColor: "rgba(45,74,62,0.12)", color: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
                        >
                          {selectedProject.category}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-[#2d4a3e]/40 text-sm" style={{ fontFamily: "Georgia, serif" }}>No project selected</p>
                  )}
                  {/* Hidden field */}
                  <input type="hidden" {...register("project_id")} />
                  <input type="hidden" {...register("mode")} />
                </div>

                {/* Booster card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "#2d4a3e" }}>
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]/38 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Booster
                  </p>
                  {selectedBooster ? (
                    <>
                      <p
                        className="font-black text-[#f0ebe0] uppercase leading-tight mb-1"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(15px, 1.8vw, 20px)", letterSpacing: "-0.02em" }}
                      >
                        {selectedBooster.name}
                      </p>
                      {selectedBooster.theme && (
                        <p className="text-[#f0ebe0]/50 text-sm leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                          {selectedBooster.theme}
                        </p>
                      )}
                      {selectedBooster.type && (
                        <span
                          className="inline-block mt-3 text-[8px] tracking-[0.14em] uppercase font-bold px-2.5 py-1 rounded-sm"
                          style={{ backgroundColor: "rgba(214,207,192,0.12)", color: "#d6cfc0", fontFamily: "'Inter', sans-serif" }}
                        >
                          {selectedBooster.type}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-[#f0ebe0]/38 text-sm" style={{ fontFamily: "Georgia, serif" }}>No booster selected</p>
                  )}
                  {/* Hidden booster field */}
                  <input type="hidden" {...register("booster_id")} />
                </div>
              </div>

              {/* Validation errors */}
              {(errors.project_id || errors.booster_id) && (
                <p className="mt-2 text-sm text-red-600" style={{ fontFamily: "Georgia, serif" }}>
                  {errors.project_id?.message ?? errors.booster_id?.message}
                </p>
              )}
            </div>

            {/* Run evaluation button */}
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
                  Run AI Evaluation
                </p>
              </div>

              <form onSubmit={handleSubmit((data) => evalMutation.mutate(data))}>
                <button
                  type="submit"
                  disabled={evalMutation.isPending || !selectedProject || !selectedBooster}
                  className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-lg disabled:opacity-40"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <span
                    className="pl-6 pr-4 py-4 text-[10px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {evalMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {evalMutation.isPending
                      ? "Evaluating…"
                      : result
                      ? "Re-run Evaluation"
                      : "Run AI Evaluation"}
                  </span>
                  <span
                    className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
                    style={{ backgroundColor: "#d6cfc0" }}
                  >
                    <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                  </span>
                </button>
              </form>

              {evalMutation.isError && (
                <div className="mt-4 rounded-2xl px-5 py-3.5" style={{ backgroundColor: "rgba(200,60,60,0.07)", border: "1px solid rgba(200,60,60,0.15)" }}>
                  <p className="text-sm text-red-700" style={{ fontFamily: "Georgia, serif" }}>
                    {evalMutation.error.message}
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            {result && (
              <div className="flex flex-col gap-6">
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
                    Evaluation Results
                  </p>
                </div>

                {/* Overall score hero card */}
                <div className="rounded-3xl p-8 flex items-start gap-8" style={{ backgroundColor: "#2d4a3e" }}>
                  {/* Score ring */}
                  <div className="shrink-0">
                    <ScoreRing score={result.overall_score ?? 0} max={100} />
                    <p
                      className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#f0ebe0]/38 text-center mt-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      AI Score
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <p
                        className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Overall Assessment
                      </p>
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(240,235,224,0.08)" }} />
                    </div>
                    <p
                      className="text-[#f0ebe0]/75 leading-relaxed"
                      style={{ fontFamily: "Georgia, serif", fontSize: "clamp(13px, 1.3vw, 15px)", lineHeight: 1.85 }}
                    >
                      {result.overall_summary}
                    </p>
                    {result.generated_at && (
                      <p
                        className="mt-4 text-[9px] tracking-[0.14em] uppercase text-[#f0ebe0]/22"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Generated {result.generated_at}
                      </p>
                    )}
                  </div>
                </div>

                {/* Criteria list */}
                {result.criteria_scores && result.criteria_scores.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {result.criteria_scores.map((c, i) => (
                      <CriteriaCard
                        key={i}
                        criterion={c}
                        index={i}
                        humanScore={humanScores[c.criterion_name]}
                        humanRemark={humanRemarks[c.criterion_name]}
                        onScoreChange={(val) => setHumanScores((prev) => ({ ...prev, [c.criterion_name]: val }))}
                        onRemarkChange={(val) => setHumanRemarks((prev) => ({ ...prev, [c.criterion_name]: val }))}
                      />
                    ))}
                  </div>
                )}

                {/* Save human scores */}
                {totalCriteria > 0 && (
                  <div
                    className="rounded-2xl px-7 py-5 flex items-center justify-between"
                    style={{ backgroundColor: "#f5f2ea" }}
                  >
                    <div>
                      <p
                        className="font-semibold text-[#2d4a3e] text-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {humanJudgedCount > 0
                          ? `${humanJudgedCount}/${totalCriteria} criteria judged`
                          : "No criteria judged yet"}
                      </p>
                      <p className="text-[#2d4a3e]/50 text-xs mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                        Expand each criterion above to enter scores and remarks
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {humanSaved && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.14em] uppercase font-bold text-[#2d4a3e]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <Check size={11} /> Saved
                        </span>
                      )}
                      {humanScoreMutation.isError && (
                        <span className="text-xs text-red-600" style={{ fontFamily: "Georgia, serif" }}>Failed to save</span>
                      )}
                      <button
                        type="button"
                        onClick={() => humanScoreMutation.mutate()}
                        disabled={humanScoreMutation.isPending || humanJudgedCount === 0}
                        className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-35"
                        style={{
                          backgroundColor: "#2d4a3e", color: "#f0ebe0",
                          padding: "10px 20px",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {humanScoreMutation.isPending ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Gavel size={11} />
                        )}
                        Save Scores
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ RIGHT sidebar ════════════════════════════════════════════ */}
          <aside className="sticky top-[81px] flex flex-col gap-4">

            {/* Status card */}
            <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Evaluation Status
              </p>

              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Project",
                    value: selectedProject?.name ?? "Not selected",
                    done: !!selectedProject,
                  },
                  {
                    label: "Booster",
                    value: selectedBooster?.name ?? "Not selected",
                    done: !!selectedBooster,
                  },
                  {
                    label: "AI Evaluation",
                    value: result ? `Score: ${result.overall_score ?? 0}/100` : "Pending",
                    done: !!result,
                  },
                  {
                    label: "Human Scores",
                    value: humanJudgedCount > 0 ? `${humanJudgedCount}/${totalCriteria} judged` : humanSaved ? "Saved" : "Optional",
                    done: humanSaved,
                  },
                ].map(({ label, value, done }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 py-3 border-b border-[#2d4a3e]/08"
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: done ? "#2d4a3e" : "rgba(45,74,62,0.1)" }}
                    >
                      {done && <Check size={10} style={{ color: "#f0ebe0" }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#2d4a3e]/38"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-sm text-[#2d4a3e]/65 truncate"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score summary */}
            {result && (
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#2d4a3e" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Score Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(240,235,224,0.07)" }}>
                    <p
                      className="font-black text-[#f0ebe0] leading-none"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, letterSpacing: "-0.03em" }}
                    >
                      {result.overall_score ?? 0}
                    </p>
                    <p
                      className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#f0ebe0]/38 mt-1.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      AI Score
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: humanOverall !== null ? "rgba(214,207,192,0.15)" : "rgba(240,235,224,0.05)" }}>
                    <p
                      className="font-black leading-none"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, letterSpacing: "-0.03em", color: humanOverall !== null ? "#d6cfc0" : "rgba(240,235,224,0.2)" }}
                    >
                      {humanOverall !== null ? humanOverall : "—"}
                    </p>
                    <p
                      className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#f0ebe0]/38 mt-1.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Human Score
                    </p>
                  </div>
                </div>
                {result.criteria_scores && (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {result.criteria_scores.map((c) => (
                      <div key={c.criterion_name}>
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className="text-[10px] text-[#f0ebe0]/50 truncate flex-1"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {c.criterion_name}
                          </p>
                          <span
                            className="text-[10px] font-bold text-[#f0ebe0]/60 shrink-0 ml-2"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {humanScores[c.criterion_name] !== undefined
                              ? `${humanScores[c.criterion_name]}★`
                              : `${c.score}/${c.max_score}`}
                          </span>
                        </div>
                        <ScoreBar
                          score={humanScores[c.criterion_name] !== undefined ? humanScores[c.criterion_name] : c.score}
                          max={c.max_score}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guide */}
            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#d6cfc0" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                How judging works
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { n: "01", t: "AI evaluates the project against the booster rubric and criteria." },
                  { n: "02", t: "Expand each criterion to read the AI justification and override with your score." },
                  { n: "03", t: "Save human scores to Supabase. Your scores override AI scores in final rankings." },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span
                      className="font-black text-[#2d4a3e]/20 leading-none shrink-0 mt-0.5"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, width: 20 }}
                    >
                      {n}
                    </span>
                    <p className="text-xs text-[#2d4a3e]/60 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {evalMutation.isPending && (
              <div
                className="rounded-2xl px-6 py-5 flex items-center gap-3"
                style={{ backgroundColor: "rgba(45,74,62,0.07)", border: "1px solid rgba(45,74,62,0.12)" }}
              >
                <Loader2 size={15} className="animate-spin shrink-0" style={{ color: "#2d4a3e" }} />
                <div>
                  <p className="text-[11px] font-semibold text-[#2d4a3e]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Running evaluation…
                  </p>
                  <p className="text-[11px] text-[#2d4a3e]/45 mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                    AI is reading project and booster context
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
            ["AI JUDGING", "★", "OFFICIAL MODE", "★", "HOST ONLY", "★"].map((t, i) => (
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