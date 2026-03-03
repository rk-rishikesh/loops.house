import { getServerAuth } from "@/lib/server-auth";
import { getProjectsServer, getBoostersServer, getSubmissionServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { JudgingForm } from "@/components/client/judging-form";

export default async function HostJudgingPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string; booster_id?: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !["host", "judge", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const params = await searchParams;

  const [projects, boosters, initialSubmission] = await Promise.all([
    getProjectsServer(),
    getBoostersServer(),
    params.project_id && params.booster_id
      ? getSubmissionServer(params.booster_id, params.project_id)
      : Promise.resolve(null),
  ]);

  return (
    <JudgingForm
      projects={projects}
      boosters={boosters}
      initialSubmission={initialSubmission}
    />
  );
}
