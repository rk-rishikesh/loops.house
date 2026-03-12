"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  HackathonLeaderboard,
  type LeaderboardEntry,
} from "@/components/client/hackathon-leaderboard";
import { finalizeHackathonAction } from "@/lib/actions";
import type { StoredProject, StoredSubmission } from "@/lib/data-mappers";
import type { EvaluationScore } from "@/lib/types/json-schemas";

interface HumanEval {
  submission_id: string;
  overall_score: number | null;
}

interface Props {
  hackathonId: string;
  submissions: StoredSubmission[];
  projects: StoredProject[];
  evaluationsBySubmission: Record<string, HumanEval[]>;
}

function extractAiOverallScore(aiScore: EvaluationScore): number {
  if (typeof aiScore.overall_score === "number") return aiScore.overall_score;
  if (
    typeof aiScore.overall_score === "object" &&
    aiScore.overall_score !== null &&
    "score" in aiScore.overall_score
  ) {
    return (aiScore.overall_score as { score: number }).score;
  }
  const scores = Object.values(aiScore)
    .map((v) => {
      if (typeof v === "number") return v;
      if (typeof v === "object" && v !== null && "score" in v)
        return (v as { score: number }).score;
      return null;
    })
    .filter((v): v is number => v !== null);
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

export function FinalizeHackathon({
  hackathonId,
  submissions,
  projects,
  evaluationsBySubmission,
}: Props) {
  const router = useRouter();
  const [aiWeight, setAiWeight] = useState(0.5);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const projectMap = useMemo(() => {
    const map: Record<string, StoredProject> = {};
    for (const p of projects) map[p.project_id] = p;
    return map;
  }, [projects]);

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];

    for (const sub of submissions) {
      if (sub.status === "withdrawn" || sub.status === "draft") continue;

      const rawAi = sub.ai_score ? extractAiOverallScore(sub.ai_score) : 0;

      const evals = evaluationsBySubmission[sub.id] ?? [];
      const judgeScores = evals
        .map((e) => e.overall_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const rawJudge =
        judgeScores.length > 0 ? judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length : 0;

      const aiWeighted = aiWeight * rawAi;
      const judgeWeighted = (1 - aiWeight) * rawJudge;
      const finalScore = aiWeighted + judgeWeighted;

      entries.push({
        rank: 0,
        project_id: sub.project_id,
        project_name: projectMap[sub.project_id]?.name ?? "Unknown Project",
        final_score: finalScore,
        ai_score_weighted: aiWeighted,
        judge_score_weighted: judgeWeighted,
        raw_ai_score: rawAi,
        raw_judge_avg_score: rawJudge,
      });
    }

    entries.sort((a, b) => b.final_score - a.final_score);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }, [submissions, aiWeight, evaluationsBySubmission, projectMap]);

  const handleFinalize = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeHackathonAction({
        hackathon_id: hackathonId,
        ai_weight: aiWeight,
        results: leaderboard.map((e) => ({
          submission_id: submissions.find((s) => s.project_id === e.project_id)!.id,
          project_id: e.project_id,
          rank: e.rank,
          final_score: e.final_score,
          ai_score_weighted: e.ai_score_weighted,
          judge_score_weighted: e.judge_score_weighted,
          raw_ai_score: e.raw_ai_score,
          raw_judge_avg_score: e.raw_judge_avg_score,
        })),
      });
      if (result.success) {
        router.refresh();
        router.push(`/host/${hackathonId}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Weight Slider */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "rgba(15,44,35,0.1)", background: "white" }}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#2d4a3e" }}>
          Score Weighting
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm" style={{ color: "#2d4a3e" }}>
            <span>
              AI Evaluation: <strong>{Math.round(aiWeight * 100)}%</strong>
            </span>
            <span>
              Judge Evaluation: <strong>{Math.round((1 - aiWeight) * 100)}%</strong>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={aiWeight}
            onChange={(e) => setAiWeight(Number(e.target.value))}
            className="w-full accent-[#2d4a3e]"
          />
          <div className="flex justify-between text-xs opacity-50" style={{ color: "#2d4a3e" }}>
            <span>100% Judges</span>
            <span>50/50</span>
            <span>100% AI</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#2d4a3e" }}>
          Leaderboard Preview
        </h2>
        <HackathonLeaderboard entries={leaderboard} aiWeight={aiWeight} showWeightBreakdown />
      </div>

      {/* Finalize Button */}
      {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="rounded-xl px-6 py-3 text-sm font-semibold transition-all"
          style={{ background: "#d6a84a", color: "#2d4a3e" }}
        >
          Finalize Hackathon
        </button>
      ) : (
        <div
          className="rounded-2xl border-2 p-6"
          style={{ borderColor: "#d6a84a", background: "rgba(214,168,74,0.06)" }}
        >
          <p className="mb-4 text-sm font-medium" style={{ color: "#2d4a3e" }}>
            This action is permanent. The leaderboard will be frozen with the current AI weight of{" "}
            <strong>{Math.round(aiWeight * 100)}%</strong> and results will be publicly visible. Are
            you sure?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleFinalize}
              disabled={isPending}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "#d6a84a", color: "#2d4a3e" }}
            >
              {isPending ? "Finalizing..." : "Confirm & Finalize"}
            </button>
            <button
              onClick={() => setConfirmed(false)}
              className="rounded-xl px-6 py-2.5 text-sm"
              style={{ color: "#2d4a3e" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
