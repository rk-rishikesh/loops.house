import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getSubmissionServer,
  getProjectServer,
  getHackathonServer,
} from "@/lib/server-data";
import { JudgingForm } from "@/components/client/judging-form";

export default async function HostBoosterJudgingPage({
  params,
}: {
  params: Promise<{ hackathon_id: string | null; project_id: string | null }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !["host", "judge", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const { hackathon_id, project_id } = await params;
  if (!hackathon_id || !project_id) {
    redirect("/host");
  }

  const [project, hackathon, submission] = await Promise.all([
    getProjectServer(project_id),
    getHackathonServer(hackathon_id),
    getSubmissionServer(hackathon_id, project_id),
  ]);

  if (!project || !hackathon || !submission) {
    return <div>Project, hackathon, or submission not found.</div>;
  }

  return (
    <JudgingForm
      project={project}
      hackathon={hackathon}
      submission={submission}
    />
  );
}
