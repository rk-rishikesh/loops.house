import { getServerAuth } from "@/lib/server-auth";
import {
  getBoosterWithTracksServer,
  getProjectsServer,
  getSubmissionsServer,
} from "@/lib/server-data";
import { redirect } from "next/navigation";
import { BuilderBoosterDetail } from "@/components/client/builder-booster-detail";

export default async function BuilderBoosterDetailPage({
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
