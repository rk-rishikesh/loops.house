import { redirect } from "next/navigation";
import { JudgingForm } from "@/components/client/judging-form";
import { canJudgeHackathon } from "@/lib/capabilities";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonServer,
  getJudgeEvaluationServer,
  getProjectServer,
  getSubmissionServer,
} from "@/lib/server-data";

export default async function JudgeProjectPage({
  params,
}: {
  params: Promise<{ hackathon_id: string; project_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { hackathon_id, project_id } = await params;
  if (!hackathon_id || !project_id) redirect("/judge");

  // Verify this user can judge this specific hackathon
  if (!canJudgeHackathon(auth.capabilities, hackathon_id)) {
    redirect("/judge");
  }

  const [project, hackathon, submission] = await Promise.all([
    getProjectServer(project_id),
    getHackathonServer(hackathon_id),
    getSubmissionServer(hackathon_id, project_id),
  ]);

  if (!project || !hackathon || !submission) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        <p className="text-[#2d4a3e]/60" style={{ fontFamily: "Georgia, serif" }}>
          Project, hackathon, or submission not found.
        </p>
      </div>
    );
  }

  // Phase-gate: judging only allowed during judging or completed phase
  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  if (!permissions.canJudge) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        <div className="text-center space-y-3">
          <p className="text-[#2d4a3e] text-lg font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            Judging is not open yet
          </p>
          <p className="text-[#2d4a3e]/60 text-sm" style={{ fontFamily: "Georgia, serif" }}>
            This hackathon is currently in the <strong>{phase}</strong> phase. Judging opens after the submission deadline.
          </p>
          <a
            href={`/judge/${hackathon_id}`}
            className="inline-block mt-4 px-5 py-2 rounded-full text-sm text-[#f0ebe0] no-underline"
            style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
          >
            Back to submissions
          </a>
        </div>
      </div>
    );
  }

  // Fetch this judge's existing evaluation (if any)
  const myEvaluation = await getJudgeEvaluationServer(hackathon_id, submission.id, auth.userId);

  return (
    <JudgingForm
      project={project}
      hackathon={hackathon}
      submission={submission}
      judgeId={auth.userId}
      existingEvaluation={myEvaluation}
      canJudge={permissions.canJudge}
      canRunAiEval={permissions.canRunAiEval}
    />
  );
}
