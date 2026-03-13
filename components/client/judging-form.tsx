"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, Check, ChevronRight, ClipboardEdit, Gavel, Loader2, Lock, Sparkles } from "lucide-react";
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

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

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
          className="font-black leading-none"
          style={{
            fontFamily: PX,
            fontSize: 26,
            letterSpacing: "-0.03em",
            color: "#F8FFE8",
          }}
        >
          {score}
        </span>
        <span
          className="text-[9px] tracking-[0.12em] uppercase font-bold mt-0.5"
          style={{ fontFamily: PX, color: "rgba(248,255,232,0.55)" }}
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
      style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left bg-transparent border-none cursor-pointer group"
      >
        <span
          className="font-black leading-none shrink-0"
          style={{
            fontFamily: PX,
            fontSize: 13,
            letterSpacing: "-0.02em",
            width: 24,
            color: "rgba(15,44,35,0.35)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold leading-snug mb-2"
            style={{
              fontFamily: PX,
              fontSize: "clamp(13px, 1.3vw, 15px)",
              color: "#0F2C23",
            }}
          >
            {criterion.criterion_name}
          </p>
          <ScoreBar score={criterion.score} max={criterion.max_score} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className="font-black leading-none"
              style={{
                fontFamily: PX,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "#0F2C23",
              }}
            >
              {criterion.score}
            </span>
            <span
              className="text-[11px] ml-0.5"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
            >
              /{criterion.max_score}
            </span>
          </div>
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{
              color: "rgba(15,44,35,0.4)",
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
            style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
          >
            <p
              className="text-[9px] tracking-[0.18em] uppercase font-bold"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.55)" }}
            >
              AI Evaluation
            </p>
            <p
              className="leading-relaxed text-sm"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
            >
              {criterion.justification}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <p
                  className="text-[9px] tracking-[0.14em] uppercase font-bold mb-1"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
                >
                  Strength
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
                >
                  {criterion.strength}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] tracking-[0.14em] uppercase font-bold mb-1"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
                >
                  Improvement
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
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
  canJudge = true,
  canRunAiEval = true,
}: {
  project: StoredProject;
  hackathon: StoredHackathon;
  submission: StoredSubmission;
  judgeId: string;
  existingEvaluation: HumanEvaluationRow | null;
  canJudge?: boolean;
  canRunAiEval?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#F8FFE8" }}
        >
          <Loader2 size={18} className="animate-spin" style={{ color: "#0F2C23" }} />
        </div>
      }
    >
      <JudgingFormContent
        project={project}
        hackathon={hackathon}
        submission={submission}
        judgeId={judgeId}
        existingEvaluation={existingEvaluation}
        canJudge={canJudge}
        canRunAiEval={canRunAiEval}
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
  canJudge,
  canRunAiEval,
}: {
  project: StoredProject;
  hackathon: StoredHackathon;
  submission: StoredSubmission;
  judgeId: string;
  existingEvaluation: HumanEvaluationRow | null;
  canJudge: boolean;
  canRunAiEval: boolean;
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
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>

      <div className="px-10 pt-10 pb-24">
        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-14 flex flex-row items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(52px, 9vw, 138px)",
              letterSpacing: "-0.025em",
            }}
          >
            PROJECT
            <br />
            JUDGING.
          </h1>
          <p
            className="max-w-[380px] text-right leading-relaxed"
            style={{
              fontFamily: FN,
              fontSize: "clamp(14px, 1.5vw, 18px)",
              color: "rgba(15,44,35,0.55)",
            }}
          >
            Score this project against the predefined criteria. Your evaluation is saved
            independently from other judges.
          </p>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* ═══ LEFT — evaluation form + results ════════════════════════ */}
          <div className="flex flex-col gap-10">
            {/* Context cards — project + hackathon */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#0F2C23]/18"
                  style={{
                    fontFamily: PX,
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  01
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
                >
                  Project & Hackathon
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Project card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(15,44,35,0.06)" }}>
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold mb-3"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
                  >
                    Project
                  </p>
                  <p
                    className="font-black text-[#0F2C23] uppercase leading-tight mb-1"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(15px, 1.8vw, 20px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {project.name}
                  </p>
                  {project.tagline && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
                    >
                      {project.tagline}
                    </p>
                  )}
                  {project.category && (
                    <span
                      className="inline-block mt-3 text-[8px] tracking-[0.14em] uppercase font-bold px-2.5 py-1 rounded-sm"
                      style={{
                        backgroundColor: "#0F2C23",
                        color: "#F8FFE8",
                        fontFamily: PX,
                      }}
                    >
                      {project.category}
                    </span>
                  )}
                  <input type="hidden" {...register("project_id")} />
                  <input type="hidden" {...register("mode")} />
                </div>

                {/* Hackathon card */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "#0F2C23" }}>
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold mb-3"
                    style={{ fontFamily: PX, color: "rgba(248,255,232,0.55)" }}
                  >
                    Hackathon
                  </p>
                  <p
                    className="font-black text-[#F8FFE8] uppercase leading-tight mb-1"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(15px, 1.8vw, 20px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {hackathon.name}
                  </p>
                  {hackathon.theme && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(248,255,232,0.7)" }}
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
                  className="font-black text-[#0F2C23]/18"
                  style={{
                    fontFamily: PX,
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  02
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
                >
                  AI Evaluation {aiIsLocked && "(Locked)"}
                </p>
              </div>

              {aiIsLocked && result ? (
                <div
                  className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
                  style={{
                    backgroundColor: "rgba(15,44,35,0.04)",
                    border: "1px solid rgba(15,44,35,0.12)",
                  }}
                >
                  <Lock size={13} style={{ color: "#0F2C23", opacity: 0.45 }} />
                  <p
                    className="text-sm"
                    style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                  >
                    AI evaluation completed on{" "}
                    {new Date(submission.ai_evaluated_at!)
                      .toISOString()
                      .slice(0, 10)}{" "}
                    (YYYY-MM-DD). Score: {result.overall_score}/100. This cannot be re-run.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit((data) => evalMutation.mutate(data))}>
                  <button
                    type="submit"
                    disabled={evalMutation.isPending || !canRunAiEval}
                    className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-lg disabled:opacity-40"
                    style={{ backgroundColor: "#0F2C23" }}
                  >
                    <span
                      className="pl-6 pr-4 py-4 text-[10px] tracking-[0.18em] uppercase font-bold flex items-center gap-2.5"
                      style={{ fontFamily: PX, color: "#F8FFE8" }}
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
                      style={{ backgroundColor: "#E2FEA5" }}
                    >
                      <ArrowUpRight size={14} className="text-[#0F2C23]" />
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
                  <p
                    className="text-sm text-red-700"
                    style={{ fontFamily: FN }}
                  >
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
                  <p
                    className="text-sm"
                    style={{ fontFamily: FN, color: "#8b6914" }}
                  >
                    {saveError}
                  </p>
                </div>
              )}
            </div>

            {/* ── Section 03 — Human Evaluation (per-judge, predefined only) */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="font-black text-[#0F2C23]/18"
                  style={{
                    fontFamily: PX,
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  03
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
                >
                  Your Evaluation
                </p>
              </div>

              {humanEvalSaved && !humanEvalOpen ? (
                <div
                  className="rounded-2xl p-6 flex items-center justify-between"
                  style={{ backgroundColor: "#0F2C23" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
                      style={{
                        backgroundColor: "#E2FEA5",
                        color: "#0F2C23",
                        fontFamily: PX,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {humanEvalOverallScore}
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm flex items-center gap-2"
                        style={{ fontFamily: PX, color: "#F8FFE8" }}
                      >
                        <Check size={13} /> Evaluation Saved
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ fontFamily: FN, color: "rgba(248,255,232,0.7)" }}
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
                      backgroundColor: "#E2FEA5",
                      color: "#0F2C23",
                      fontFamily: PX,
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
                  style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
                >
                  <span
                    className="pl-6 pr-4 py-4 text-[10px] tracking-[0.18em] uppercase font-bold flex items-center gap-2.5"
                    style={{ fontFamily: PX, color: "#0F2C23" }}
                  >
                    <ClipboardEdit size={13} />
                    {existingEvaluation ? "Edit Your Evaluation" : "Start Your Evaluation"}
                  </span>
                  <span
                    className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
                    style={{ backgroundColor: "#0F2C23" }}
                  >
                    <ArrowUpRight size={14} className="text-[#F8FFE8]" />
                  </span>
                </button>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Overall notes */}
                  <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold mb-3"
                      style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
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
                        backgroundColor: "rgba(15,44,35,0.06)",
                        border: "none",
                        color: "#0F2C23",
                        fontFamily: FN,
                      }}
                      onFocus={(e) => (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")}
                      onBlur={(e) => (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")}
                    />
                  </div>

                  {/* Predefined criteria cards (no add/delete) */}
                  {humanCriteria.map((criterion, idx) => (
                    <div
                      key={criterion.name}
                      className="rounded-2xl overflow-hidden"
                      style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                    >
                      <div className="px-6 py-5 flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
                            style={{
                              backgroundColor:
                                criterion.score > 0 ? "#0F2C23" : "rgba(15,44,35,0.08)",
                              color: criterion.score > 0 ? "#F8FFE8" : "#0F2C23",
                              fontFamily: PX,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {criterion.score}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-sm uppercase tracking-wide mb-1"
                            style={{ fontFamily: PX, color: "#0F2C23" }}
                          >
                            {criterion.name}
                          </p>
                          <p
                            className="text-xs mb-4"
                            style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
                          >
                            {criterion.description}
                          </p>

                          <div className="flex gap-3 items-start">
                            <div className="shrink-0">
                              <p
                                className="text-[9px] tracking-[0.12em] uppercase font-bold mb-1.5"
                                style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
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
                                  backgroundColor: criterion.score > 0 ? "#0F2C23" : "rgba(15,44,35,0.06)",
                                  color: criterion.score > 0 ? "#F8FFE8" : "#0F2C23",
                                  border: "none",
                                  fontFamily: PX,
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p
                                className="text-[9px] tracking-[0.12em] uppercase font-bold mb-1.5"
                                style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
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
                                  backgroundColor: "rgba(15,44,35,0.06)",
                                  border: "none",
                                  color: "#0F2C23",
                                  fontFamily: FN,
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
                    style={{ backgroundColor: "#0F2C23" }}
                  >
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ fontFamily: PX, color: "#F8FFE8" }}
                      >
                        {humanCriteria.filter((c) => c.score > 0).length}/{humanCriteria.length}{" "}
                        criteria scored
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ fontFamily: FN, color: "rgba(248,255,232,0.7)" }}
                      >
                        Overall score: {humanEvalOverallScore}/100
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {humanEvalSaved && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.14em] uppercase font-bold"
                          style={{ fontFamily: PX, color: "rgba(248,255,232,0.7)" }}
                        >
                          <Check size={11} /> Saved
                        </span>
                      )}
                      {humanEvalMutation.isError && (
                        <span
                          className="text-xs text-red-300"
                          style={{ fontFamily: FN }}
                        >
                          {humanEvalMutation.error.message}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => humanEvalMutation.mutate()}
                        disabled={
                          humanEvalMutation.isPending ||
                          humanCriteria.filter((c) => c.score > 0).length === 0 ||
                          !canJudge
                        }
                        className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-35"
                        style={{
                          backgroundColor: "#E2FEA5",
                          color: "#0F2C23",
                          padding: "10px 20px",
                          fontFamily: PX,
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
                    className="font-black text-[#0F2C23]/18"
                    style={{
                      fontFamily: PX,
                      fontSize: 32,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    04
                  </span>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
                  >
                    AI Evaluation Results
                  </p>
                </div>

                {/* Overall score hero card */}
                <div
                  className="rounded-3xl p-8 flex items-start gap-8"
                  style={{ backgroundColor: "#0F2C23" }}
                >
                  <div className="shrink-0">
                    <ScoreRing score={result.overall_score ?? 0} max={100} />
                    <p
                      className="text-[9px] tracking-[0.14em] uppercase font-bold text-center mt-2"
                      style={{ fontFamily: PX, color: "rgba(248,255,232,0.6)" }}
                    >
                      AI Score
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <p
                      className="text-[9px] tracking-[0.2em] uppercase font-bold"
                      style={{ fontFamily: PX, color: "rgba(248,255,232,0.6)" }}
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
                      className="leading-relaxed"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(13px, 1.3vw, 15px)",
                        lineHeight: 1.85,
                        color: "rgba(248,255,232,0.85)",
                      }}
                    >
                      {result.overall_summary}
                    </p>
                    {result.generated_at && (
                      <p
                        className="mt-4 text-[9px] tracking-[0.14em] uppercase"
                        style={{ fontFamily: PX, color: "rgba(248,255,232,0.45)" }}
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
            <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
                style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
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
                    className="flex items-center gap-3 py-3 border-b"
                    style={{ borderColor: "rgba(15,44,35,0.08)" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: done ? "#0F2C23" : "rgba(15,44,35,0.08)",
                      }}
                    >
                      {done && <Check size={10} style={{ color: "#F8FFE8" }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold"
                        style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-sm truncate"
                        style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
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
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#0F2C23" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold mb-4"
                  style={{ fontFamily: PX, color: "rgba(248,255,232,0.6)" }}
                >
                  Score Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {result && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(248,255,232,0.05)",
                      }}
                    >
                      <p
                        className="font-black leading-none"
                        style={{
                          fontFamily: PX,
                          fontSize: 26,
                          letterSpacing: "-0.03em",
                          color: "#F8FFE8",
                        }}
                      >
                        {result.overall_score ?? 0}
                      </p>
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold mt-1"
                        style={{ fontFamily: PX, color: "rgba(248,255,232,0.6)" }}
                      >
                        AI Score
                      </p>
                    </div>
                  )}
                  {humanEvalSaved && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(248,255,232,0.05)",
                      }}
                    >
                      <p
                        className="font-black leading-none"
                        style={{
                          fontFamily: PX,
                          fontSize: 26,
                          letterSpacing: "-0.03em",
                          color: "#F8FFE8",
                        }}
                      >
                        {humanEvalOverallScore}
                      </p>
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold mt-1"
                        style={{ fontFamily: PX, color: "rgba(248,255,232,0.6)" }}
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
