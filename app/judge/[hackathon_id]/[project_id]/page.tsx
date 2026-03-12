import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { canJudgeHackathon } from "@/lib/capabilities";
import {
  getSubmissionServer,
  getProjectServer,
  getHackathonServer,
  getJudgeEvaluationServer,
} from "@/lib/server-data";
import { JudgingForm } from "@/components/client/judging-form";

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

  // Fetch this judge's existing evaluation (if any)
  const myEvaluation = await getJudgeEvaluationServer(
    hackathon_id,
    submission.id,
    auth.userId,
  );

  return (
    <JudgingForm
      project={project}
      hackathon={hackathon}
      submission={submission}
      judgeId={auth.userId}
      existingEvaluation={myEvaluation}
    />
  );
}
