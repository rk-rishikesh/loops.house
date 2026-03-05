import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getBoosterWithTracksServer,
  getProjectsServer,
  getSubmissionsServer,
} from "@/lib/server-data";
import { BuilderBoosterDetail } from "@/components/client/builder-booster-detail";

export default async function BoosterDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { type, id } = await params;

  const [booster, projects, submissions] = await Promise.all([
    getBoosterWithTracksServer(id),
    getProjectsServer(),
    getSubmissionsServer(id),
  ]);

  const boosterSubmission = submissions.find((s) => s.booster_id === id);
  const submittedProject =
    (boosterSubmission && projects.find((p) => p.project_id === boosterSubmission.project_id)) ?? null;

  return (
    <BuilderBoosterDetail
      type={type}
      boosterId={id}
      booster={booster}
      projects={projects}
      submissions={submissions}
      isAuthenticated={true}
      role={auth.role}
    />
  );
}
