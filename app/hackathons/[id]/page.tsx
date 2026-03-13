import { BuilderHackathonDetail } from "@/components/client/builder-hackathon-detail";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonWithTracksServer, getSubmissionsServer, getUserProjectsServer } from "@/lib/server-data";

export default async function HackathonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await getServerAuth();
  const { id } = await params;

  const [hackathon, projects, submissions] = await Promise.all([
    getHackathonWithTracksServer(id),
    auth ? getUserProjectsServer(auth.userId) : Promise.resolve([]),
    auth ? getSubmissionsServer(id) : Promise.resolve([]),
  ]);

  return (
    <BuilderHackathonDetail
      hackathonId={id}
      hackathon={hackathon}
      projects={projects}
      submissions={submissions}
      isAuthenticated={!!auth}
    />
  );
}
