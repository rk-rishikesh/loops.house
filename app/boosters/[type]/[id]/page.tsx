import { getServerAuth } from "@/lib/server-auth";
import {
  getBoosterWithTracksServer,
  getProjectsServer,
  getSubmissionsServer,
} from "@/lib/server-data";
import { BoosterDetailView } from "@/components/client/booster-detail-view";

export default async function BoosterDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const [auth, { type, id }] = await Promise.all([getServerAuth(), params]);

  const [booster, projects, submissions] = await Promise.all([
    getBoosterWithTracksServer(id),
    getProjectsServer(),
    getSubmissionsServer(id),
  ]);

  // Find the project that was already submitted to this booster (if any)
  const submittedProject =
    projects.find(
      (p) => (p as Record<string, unknown>).booster_id === id,
    ) ?? null;

  return (
    <BoosterDetailView
      type={type}
      boosterId={id}
      booster={booster}
      submittedProject={submittedProject}
      submissions={submissions}
      isAuthenticated={!!auth}
      role={auth?.role ?? null}
    />
  );
}
