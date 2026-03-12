"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardEdit,
  Gavel,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  HumanEvaluationRow,
  StoredHackathon,
  StoredProject,
  StoredSubmission,
} from "@/lib/data-mappers";
import { getHackathon, getProject } from "@/lib/storage";
import { type JudgingEvalSchema, judgingEvalSchema } from "@/lib/validations/schemas";

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
  saved?: boolean;
  locked?: boolean;
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
          cx={52}
          cy={52}
          r={r}
          fill="none"
          stroke="#d6cfc0"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{
            transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-black text-[#f0ebe0] leading-none"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 26,
            letterSpacing: "-0.03em",
          }}
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
    <div
      className="relative h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(45,74,62,0.1)" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

/* ─── AI Criteria card (read-only) ───────────────────────────────── */
function AiCriteriaCard({
  criterion,
  index,
}: {
  criterion: NonNullable<EvalResult["criteria_scores"]>[0];
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ backgroundColor: "#f5f2ea" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left bg-transparent border-none cursor-pointer group"
      >
        <span
          className="font-black text-[#2d4a3e]/18 leading-none shrink-0"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            letterSpacing: "-0.02em",
            width: 24,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-[#2d4a3e] leading-snug mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(13px, 1.3vw, 15px)",
            }}
          >
            {criterion.criterion_name}
          </p>
          <ScoreBar score={criterion.score} max={criterion.max_score} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className="font-black text-[#2d4a3e] leading-none"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
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
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{
              color: "rgba(45,74,62,0.3)",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 600 : 0 }}
      >
        <div
          className="px-6 pb-6 flex flex-col gap-5"
          style={{ paddingLeft: "calc(24px + 24px + 16px)" }}
        >
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
            <p
              className="text-[#2d4a3e]/65 leading-relaxed text-sm"
              style={{ fontFamily: "Georgia, serif" }}
            >
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
                <p
                  className="text-xs text-[#2d4a3e]/60 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
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
                <p
                  className="text-xs text-[#2d4a3e]/60 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {criterion.improvement}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Default criteria (stable reference) ────────────────────────── */
const DEFAULT_CRITERIA: { name: string; description: string }[] = [
  {
    name: "Innovation",
    description: "Novelty and originality of the solution",
  },
  {
    name: "Technical Execution",
    description: "Code quality, architecture, and implementation",
  },
  { name: "Impact", description: "Potential real-world impact and usefulness" },
  {
    name: "Presentation",
    description: "Quality of demo, documentation, and communication",
  },
];

/* ─── Parse AI score from JSONB ──────────────────────────────────── */
function parseAiScore(raw: Record<string, unknown> | null | undefined): EvalResult | null {
  if (!raw || typeof raw !== "object" || typeof raw.overall_score !== "number") return null;
  const rawCriteria = raw.criteria_scores as Array<Record<string, unknown>> | undefined;
  return {
    overall_score: raw.overall_score as number,
    overall_summary: (raw.overall_summary as string) ?? undefined,
    criteria_scores: rawCriteria?.map((c) => ({
      criterion_name: (c.criterion_name ?? c.name ?? "") as string,
      score: (c.score ?? 0) as number,
      max_score: (c.max_score ?? 100) as number,
      justification: (c.justification ?? "") as string,
      strength: (c.strength ?? "") as string,
      improvement: (c.improvement ?? "") as string,
    })),
    generated_at: (raw.generated_at as string) ?? undefined,
  };
}

/* ─── Human criterion state ──────────────────────────────────────── */
type HumanCriterion = {
  name: string;
  description: string;
  score: number;
  remark: string;
};

/* ─── Page wrapper ───────────────────────────────────────────────── */
export function JudgingForm({
  project,
  hackathon,
  submission,
  judgeId,
  existingEvaluation,
}: {
  project: StoredProject;
  hackathon: StoredHackathon;
  submission: StoredSubmission;
  judgeId: string;
  existingEvaluation: HumanEvaluationRow | null;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#f0ebe0" }}
        >
          <Loader2 size={18} className="animate-spin" style={{ color: "#2d4a3e" }} />
        </div>
      }
    >
      <JudgingFormContent
        project={project}
        hackathon={hackathon}
        submission={submission}
        judgeId={judgeId}
        existingEvaluation={existingEvaluation}
      />
    </Suspense>
  );
}

/* ─── Page content ───────────────────────────────────────────────── */
function JudgingFormContent({
  project,
  hackathon,
  submission,
  judgeId: _judgeId,
  existingEvaluation,
}: {
  project: StoredProject;
  hackathon: StoredHackathon;
  submission: StoredSubmission;
  judgeId: string;
  existingEvaluation: HumanEvaluationRow | null;
}) {
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── AI evaluation state ──────────────────────────────────────── */
  const aiIsLocked = !!submission.ai_evaluated_at;
  const [aiResult, setAiResult] = useState<EvalResult | null>(() =>
    parseAiScore(submission.ai_score as Record<string, unknown> | null),
  );

  /* ── Human evaluation state ───────────────────────────────────── */
  const [humanEvalOpen, setHumanEvalOpen] = useState(false);
  const [humanEvalSaved, setHumanEvalSaved] = useState(!!existingEvaluation);
  const [humanCriteria, setHumanCriteria] = useState<HumanCriterion[]>(() => {
    if (existingEvaluation) {
      const scores = (existingEvaluation.scores ?? {}) as Record<string, number>;
      const remarks = (existingEvaluation.remarks ?? {}) as Record<string, string>;
      const source =
        hackathon?.judging_criteria && hackathon.judging_criteria.length > 0
          ? hackathon.judging_criteria
          : DEFAULT_CRITERIA;
      return source.map((c) => ({
        name: c.name,
        description: c.description,
        score: scores[c.name] ?? 0,
        remark: remarks[c.name] ?? "",
      }));
    }
    return [];
  });
  const [humanOverallNotes, setHumanOverallNotes] = useState(
    existingEvaluation?.overall_notes ?? "",
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JudgingEvalSchema>({
    resolver: zodResolver(judgingEvalSchema),
    defaultValues: {
      project_id: project.project_id,
      hackathon_id: hackathon.id,
      mode: "official",
    },
  });

  /* ── AI evaluation mutation ───────────────────────────────────── */
  const evalMutation = useMutation({
    mutationFn: async (data: JudgingEvalSchema): Promise<EvalResult> => {
      const project = await getProject(data.project_id);
      const hackathon = await getHackathon(data.hackathon_id);
      const res = await fetch("/api/host-agents/project-evaluator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: data.project_id,
          hackathon_id: data.hackathon_id,
          judge_mode: "official",
          project: project
            ? {
                name: project.name,
                tagline: project.tagline,
                refined_description: project.refined_description,
                description: (project as { description?: string }).description,
                key_features: project.key_features,
                tech_stack_tags: project.tech_stack_tags,
                category: project.category,
                flattened_codebase: project.flattened_codebase?.slice(0, 50000),
              }
            : undefined,
          hackathon: hackathon
            ? {
                id: hackathon.id,
                name: hackathon.name,
                theme: hackathon.theme,
                problem_statements: hackathon.problem_statements,
                sponsor_tracks: hackathon.sponsor_tracks,
              }
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Evaluation failed");
      return json as EvalResult;
    },
    onSuccess: (data) => {
      setAiResult(data);
      setSaveError(
        data.saved === false ? "AI evaluation completed but failed to save to database." : null,
      );
    },
  });

  /* ── Human evaluation mutation (saves per-judge) ──────────────── */
  const humanEvalMutation = useMutation({
    mutationFn: async () => {
      const scores: Record<string, number> = {};
      const remarks: Record<string, string> = {};
      humanCriteria.forEach((c) => {
        scores[c.name] = c.score;
        if (c.remark) remarks[c.name] = c.remark;
      });
      const overall =
        humanCriteria.length > 0
          ? Math.round(humanCriteria.reduce((sum, c) => sum + c.score, 0) / humanCriteria.length)
          : 0;

      const res = await fetch("/api/host-agents/save-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.project_id,
          hackathon_id: hackathon.id,
          human_evaluation: {
            scores,
            remarks,
            overall_notes: humanOverallNotes,
            overall_score: overall,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save evaluation");
    },
    onSuccess: () => {
      setHumanEvalSaved(true);
      setSaveError(null);
    },
    onError: (err: Error) => setSaveError(err.message),
  });

  /* ── Initialize human criteria from hackathon predefined list ─── */
  const initHumanCriteria = useCallback(() => {
    const source =
      hackathon?.judging_criteria && hackathon.judging_criteria.length > 0
        ? hackathon.judging_criteria
        : DEFAULT_CRITERIA;

    // If we have existing data, preserve scores
    if (existingEvaluation) {
      const scores = (existingEvaluation.scores ?? {}) as Record<string, number>;
      const remarks = (existingEvaluation.remarks ?? {}) as Record<string, string>;
      setHumanCriteria(
        source.map((c) => ({
          name: c.name,
          description: c.description,
          score: scores[c.name] ?? 0,
          remark: remarks[c.name] ?? "",
        })),
      );
    } else {
      setHumanCriteria(
        source.map((c) => ({
          name: c.name,
          description: c.description,
          score: 0,
          remark: "",
        })),
      );
    }
    setHumanEvalSaved(false);
    setHumanEvalOpen(true);
  }, [hackathon, existingEvaluation]);

  const humanEvalOverallScore =
    humanCriteria.length > 0
      ? Math.round(humanCriteria.reduce((sum, c) => sum + c.score, 0) / humanCriteria.length)
      : 0;

  const result = evalMutation.data ?? aiResult;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-10 py-5 flex items-center justify-between"
        style={{
          backgroundColor: "#f0ebe0",
          borderBottom: "1px solid rgba(45,74,62,0.1)",
        }}
      >
        <Link
          href="/judge"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Judge
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "#2d4a3e",
              color: "#f0ebe0",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Judge Evaluation
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
            PROJECT
            <br />
            JUDGING.
          </h1>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(14px, 1.5vw, 18px)",
              }}
            >
              Score this project against the predefined criteria. Your evaluation is saved
              independently from other judges.
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* ═══ LEFT — evaluation form + results ════════════════════════ */}
          <div className="flex flex-col gap-10">
            {/* Context cards — project + hackathon */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/18"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  01
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Project & Hackathon
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
                  <p
                    className="font-black text-[#2d4a3e] uppercase leading-tight mb-1"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(15px, 1.8vw, 20px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {project.name}
                  </p>
                  {project.tagline && (
                    <p
                      className="text-[#2d4a3e]/55 text-sm leading-relaxed"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {project.tagline}
                    </p>
                  )}
                  {project.category && (
                    <span
                      className="inline-block mt-3 text-[8px] tracking-[0.14em] uppercase font-bold px-2.5 py-1 rounded-sm"
                      style={{
                        backgroundColor: "rgba(45,74,62,0.12)",
                        color: "#2d4a3e",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {project.category}
                    </span>
                  )}
                  <input type="hidden" {...register("project_id")} />
                  <input type="hidden" {...register("mode")} />
                </div>

                {/* Hackathon card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "#2d4a3e" }}>
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]/38 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Hackathon
                  </p>
                  <p
                    className="font-black text-[#f0ebe0] uppercase leading-tight mb-1"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(15px, 1.8vw, 20px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {hackathon.name}
                  </p>
                  {hackathon.theme && (
                    <p
                      className="text-[#f0ebe0]/50 text-sm leading-relaxed"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {hackathon.theme}
                    </p>
                  )}
                  <input type="hidden" {...register("hackathon_id")} />
                </div>
              </div>

              {(errors.project_id || errors.hackathon_id) && (
                <p className="mt-2 text-sm text-red-600" style={{ fontFamily: "Georgia, serif" }}>
                  {errors.project_id?.message ?? errors.hackathon_id?.message}
                </p>
              )}
            </div>

            {/* ── Section 02 — AI Evaluation (read-only once locked) ──── */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/18"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  02
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  AI Evaluation {aiIsLocked && "(Locked)"}
                </p>
              </div>

              {aiIsLocked && result ? (
                <div
                  className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
                  style={{
                    backgroundColor: "rgba(45,74,62,0.06)",
                    border: "1px solid rgba(45,74,62,0.1)",
                  }}
                >
                  <Lock size={13} style={{ color: "#2d4a3e", opacity: 0.4 }} />
                  <p className="text-sm text-[#2d4a3e]/60" style={{ fontFamily: "Georgia, serif" }}>
                    AI evaluation completed on{" "}
                    {new Date(submission.ai_evaluated_at!).toLocaleDateString()}. Score:{" "}
                    {result.overall_score}/100. This cannot be re-run.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit((data) => evalMutation.mutate(data))}>
                  <button
                    type="submit"
                    disabled={evalMutation.isPending}
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
                      {evalMutation.isPending ? "Evaluating..." : "Run AI Evaluation"}
                    </span>
                    <span
                      className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
                      style={{ backgroundColor: "#d6cfc0" }}
                    >
                      <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                    </span>
                  </button>
                </form>
              )}

              {evalMutation.isError && (
                <div
                  className="mt-4 rounded-2xl px-5 py-3.5"
                  style={{
                    backgroundColor: "rgba(200,60,60,0.07)",
                    border: "1px solid rgba(200,60,60,0.15)",
                  }}
                >
                  <p className="text-sm text-red-700" style={{ fontFamily: "Georgia, serif" }}>
                    {evalMutation.error.message}
                  </p>
                </div>
              )}

              {saveError && (
                <div
                  className="mt-4 rounded-2xl px-5 py-3.5"
                  style={{
                    backgroundColor: "rgba(200,140,20,0.08)",
                    border: "1px solid rgba(200,140,20,0.2)",
                  }}
                >
                  <p className="text-sm" style={{ fontFamily: "Georgia, serif", color: "#8b6914" }}>
                    {saveError}
                  </p>
                </div>
              )}
            </div>

            {/* ── Section 03 — Human Evaluation (per-judge, predefined only) */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/18"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  03
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Your Evaluation
                </p>
              </div>

              {humanEvalSaved && !humanEvalOpen ? (
                <div
                  className="rounded-2xl p-6 flex items-center justify-between"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
                      style={{
                        backgroundColor: "#d6cfc0",
                        color: "#2d4a3e",
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {humanEvalOverallScore}
                    </div>
                    <div>
                      <p
                        className="font-semibold text-[#f0ebe0] text-sm flex items-center gap-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <Check size={13} /> Evaluation Saved
                      </p>
                      <p
                        className="text-[#f0ebe0]/45 text-xs mt-0.5"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {humanCriteria.filter((c) => c.score > 0).length} criteria scored — overall{" "}
                        {humanEvalOverallScore}/100
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={initHumanCriteria}
                    className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 px-5 py-3"
                    style={{
                      backgroundColor: "#d6cfc0",
                      color: "#2d4a3e",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    <ClipboardEdit size={11} /> Edit
                  </button>
                </div>
              ) : !humanEvalOpen ? (
                <button
                  type="button"
                  onClick={initHumanCriteria}
                  className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-lg disabled:opacity-40"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  <span
                    className="pl-6 pr-4 py-4 text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e] flex items-center gap-2.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <ClipboardEdit size={13} />
                    {existingEvaluation ? "Edit Your Evaluation" : "Start Your Evaluation"}
                  </span>
                  <span
                    className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
                    style={{ backgroundColor: "#2d4a3e" }}
                  >
                    <ArrowUpRight size={14} className="text-[#f0ebe0]" />
                  </span>
                </button>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Overall notes */}
                  <div className="rounded-2xl p-6" style={{ backgroundColor: "#d6cfc0" }}>
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40 mb-3"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Overall Notes
                    </p>
                    <textarea
                      placeholder="Your overall assessment of this project..."
                      value={humanOverallNotes}
                      onChange={(e) => setHumanOverallNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder-[#2d4a3e]/30 resize-none"
                      style={{
                        backgroundColor: "#c8c1b1",
                        border: "none",
                        color: "#2d4a3e",
                        fontFamily: "Georgia, serif",
                      }}
                      onFocus={(e) => (e.currentTarget.style.backgroundColor = "#bfb8a8")}
                      onBlur={(e) => (e.currentTarget.style.backgroundColor = "#c8c1b1")}
                    />
                  </div>

                  {/* Predefined criteria cards (no add/delete) */}
                  {humanCriteria.map((criterion, idx) => (
                    <div
                      key={criterion.name}
                      className="rounded-2xl overflow-hidden"
                      style={{ backgroundColor: "#f5f2ea" }}
                    >
                      <div className="px-6 py-5 flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
                            style={{
                              backgroundColor:
                                criterion.score > 0 ? "#2d4a3e" : "rgba(45,74,62,0.1)",
                              color: criterion.score > 0 ? "#f0ebe0" : "#2d4a3e",
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {criterion.score}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-[#2d4a3e] text-sm uppercase tracking-wide mb-1"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {criterion.name}
                          </p>
                          <p
                            className="text-xs text-[#2d4a3e]/50 mb-4"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {criterion.description}
                          </p>

                          <div className="flex gap-3 items-start">
                            <div className="shrink-0">
                              <p
                                className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/35 mb-1.5"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                Score (0-100)
                              </p>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={criterion.score || ""}
                                onChange={(e) =>
                                  setHumanCriteria((prev) =>
                                    prev.map((c, i) =>
                                      i === idx
                                        ? {
                                            ...c,
                                            score: Math.min(
                                              100,
                                              Math.max(0, parseInt(e.target.value, 10) || 0),
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                className="w-20 rounded-xl px-3 py-2.5 text-sm outline-none font-semibold text-center transition-colors"
                                style={{
                                  backgroundColor: criterion.score > 0 ? "#2d4a3e" : "#d6cfc0",
                                  color: criterion.score > 0 ? "#f0ebe0" : "#2d4a3e",
                                  border: "none",
                                  fontFamily: "'Inter', sans-serif",
                                }}
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
                                placeholder="Your notes on this criterion..."
                                value={criterion.remark}
                                onChange={(e) =>
                                  setHumanCriteria((prev) =>
                                    prev.map((c, i) =>
                                      i === idx ? { ...c, remark: e.target.value } : c,
                                    ),
                                  )
                                }
                                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder-[#2d4a3e]/30"
                                style={{
                                  backgroundColor: "#d6cfc0",
                                  border: "none",
                                  color: "#2d4a3e",
                                  fontFamily: "Georgia, serif",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Save bar */}
                  <div
                    className="rounded-2xl px-7 py-5 flex items-center justify-between"
                    style={{ backgroundColor: "#2d4a3e" }}
                  >
                    <div>
                      <p
                        className="font-semibold text-[#f0ebe0] text-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {humanCriteria.filter((c) => c.score > 0).length}/{humanCriteria.length}{" "}
                        criteria scored
                      </p>
                      <p
                        className="text-[#f0ebe0]/45 text-xs mt-0.5"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Overall score: {humanEvalOverallScore}/100
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {humanEvalSaved && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.14em] uppercase font-bold text-[#f0ebe0]/50"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <Check size={11} /> Saved
                        </span>
                      )}
                      {humanEvalMutation.isError && (
                        <span
                          className="text-xs text-red-300"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {humanEvalMutation.error.message}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => humanEvalMutation.mutate()}
                        disabled={
                          humanEvalMutation.isPending ||
                          humanCriteria.filter((c) => c.score > 0).length === 0
                        }
                        className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-35"
                        style={{
                          backgroundColor: "#d6cfc0",
                          color: "#2d4a3e",
                          padding: "10px 20px",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {humanEvalMutation.isPending ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Gavel size={11} />
                        )}
                        Submit Evaluation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 04 — AI Results (read-only) ────────────────── */}
            {result && (
              <div className="flex flex-col gap-6">
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-black text-[#2d4a3e]/18"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 32,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    04
                  </span>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    AI Evaluation Results
                  </p>
                </div>

                {/* Overall score hero card */}
                <div
                  className="rounded-3xl p-8 flex items-start gap-8"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <div className="shrink-0">
                    <ScoreRing score={result.overall_score ?? 0} max={100} />
                    <p
                      className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#f0ebe0]/38 text-center mt-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      AI Score
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <p
                        className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Overall Assessment
                      </p>
                      <div
                        className="flex-1 h-px"
                        style={{
                          backgroundColor: "rgba(240,235,224,0.08)",
                        }}
                      />
                    </div>
                    <p
                      className="text-[#f0ebe0]/75 leading-relaxed"
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "clamp(13px, 1.3vw, 15px)",
                        lineHeight: 1.85,
                      }}
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

                {/* Criteria list (read-only, no override) */}
                {result.criteria_scores && result.criteria_scores.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {result.criteria_scores.map((c, i) => (
                      <AiCriteriaCard key={i} criterion={c} index={i} />
                    ))}
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
                    value: project.name ?? "Not selected",
                    done: !!project,
                  },
                  {
                    label: "Hackathon",
                    value: hackathon.name ?? "Not selected",
                    done: !!hackathon,
                  },
                  {
                    label: "AI Evaluation",
                    value: result
                      ? `Score: ${result.overall_score ?? 0}/100${aiIsLocked ? " (locked)" : ""}`
                      : "Pending",
                    done: !!result,
                  },
                  {
                    label: "Your Evaluation",
                    value: humanEvalSaved
                      ? `Score: ${humanEvalOverallScore}/100`
                      : humanEvalOpen
                        ? `${humanCriteria.filter((c) => c.score > 0).length}/${humanCriteria.length} scored`
                        : "Not started",
                    done: humanEvalSaved,
                  },
                ].map(({ label, value, done }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 py-3 border-b border-[#2d4a3e]/08"
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: done ? "#2d4a3e" : "rgba(45,74,62,0.1)",
                      }}
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
            {(result || humanEvalSaved) && (
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#2d4a3e" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Score Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {result && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(240,235,224,0.07)",
                      }}
                    >
                      <p
                        className="font-black text-[#f0ebe0] leading-none"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 26,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {result.overall_score ?? 0}
                      </p>
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#f0ebe0]/38 mt-1"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        AI Score
                      </p>
                    </div>
                  )}
                  {humanEvalSaved && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(240,235,224,0.07)",
                      }}
                    >
                      <p
                        className="font-black text-[#f0ebe0] leading-none"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 26,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {humanEvalOverallScore}
                      </p>
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#f0ebe0]/38 mt-1"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Your Score
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
