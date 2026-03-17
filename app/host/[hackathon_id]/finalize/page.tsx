import { redirect } from "next/navigation";
import { FinalizeHackathon } from "@/components/client/finalize-hackathon";
import {
  HackathonLeaderboard,
  type LeaderboardEntry,
} from "@/components/client/hackathon-leaderboard";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import {
  getAllSubmissionEvaluationsServer,
  getHackathonResultsServer,
  getHackathonServer,
  getProjectsServer,
  getSubmissionsServer,
} from "@/lib/server-data";

export default async function FinalizePage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const { hackathon_id } = await params;
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const hackathon = await getHackathonServer(hackathon_id);
  if (!hackathon) redirect("/host");

  const permissions = getPhasePermissions(hackathon.phase);

  // If already finalized, show frozen results
  if (hackathon.phase === "finalized") {
    const results = await getHackathonResultsServer(hackathon_id);
    const projects = await getProjectsServer();
    const projectMap: Record<string, string> = {};
    for (const p of projects) projectMap[p.project_id] = p.name;

    const entries: LeaderboardEntry[] = results.map((r) => ({
      rank: r.rank,
      project_id: r.project_id,
      project_name: projectMap[r.project_id] ?? "Unknown",
      final_score: r.final_score,
      ai_score_weighted: r.ai_score_weighted,
      judge_score_weighted: r.judge_score_weighted,
      raw_ai_score: r.raw_ai_score,
      raw_judge_avg_score: r.raw_judge_avg_score,
    }));

    return (
      <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-semibold" style={{ color: "#2d4a3e" }}>
              Results: {hackathon.name}
            </h1>
            <HackathonPhaseBadge phase={hackathon.phase} size="md" />
          </div>
          <p className="mb-6 text-sm opacity-60" style={{ color: "#2d4a3e" }}>
            Finalized with AI weight: {Math.round((hackathon.ai_weight ?? 0.5) * 100)}%
          </p>
          <HackathonLeaderboard
            entries={entries}
            aiWeight={hackathon.ai_weight}
            showWeightBreakdown
          />
        </div>
      </div>
    );
  }

  // If not in completed phase, can't finalize
  if (!permissions.canFinalize) {
    return (
      <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="mb-4 text-2xl font-semibold" style={{ color: "#2d4a3e" }}>
            Finalize: {hackathon.name}
          </h1>
          <HackathonPhaseBadge phase={hackathon.phase} size="md" />
          <p className="mt-4 text-sm opacity-60" style={{ color: "#2d4a3e" }}>
            Hackathon must be in &quot;Completed&quot; phase (past results date) to finalize.
            Current phase: {hackathon.phase}
          </p>
        </div>
      </div>
    );
  }

  // Fetch all data for finalization
  const [submissions, projects, evaluationsBySubmission] = await Promise.all([
    getSubmissionsServer(hackathon_id),
    getProjectsServer(),
    getAllSubmissionEvaluationsServer(hackathon_id),
  ]);

  // Simplify evaluations for client
  const evalMap: Record<string, { submission_id: string; overall_score: number | null }[]> = {};
  for (const [subId, evals] of Object.entries(evaluationsBySubmission)) {
    evalMap[subId] = evals.map((e) => ({
      submission_id: e.submission_id,
      overall_score: typeof e.overall_score === "number" ? e.overall_score : null,
    }));
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-2xl font-semibold" style={{ color: "#2d4a3e" }}>
            Finalize: {hackathon.name}
          </h1>
          <HackathonPhaseBadge phase={hackathon.phase} size="md" />
        </div>
        <FinalizeHackathon
          hackathonId={hackathon_id}
          submissions={submissions}
          projects={projects}
          evaluationsBySubmission={evalMap}
        />
      </div>
    </div>
  );
}
