import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getProjectsServer,
  getHackathonsServer,
  getSubmissionServer,
} from "@/lib/server-data";
import { JudgingForm } from "@/components/client/judging-form";

export default async function HostBoosterJudgingPage({
  params,
}: {
  params: Promise<{ booster_id: string; project_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !["host", "judge", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const { booster_id, project_id } = await params;
  if (!booster_id.includes("-")) {
    redirect("/host");
  }

  const [projects, hackathons, initialSubmission] = await Promise.all([
    getProjectsServer(),
    getHackathonsServer(),
    getSubmissionServer(booster_id, project_id),
  ]);

  return (
    <JudgingForm
      projects={projects}
      hackathons={hackathons}
      initialSubmission={initialSubmission}
    />
  );
}

