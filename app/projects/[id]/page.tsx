import { ViewerProjectDetail } from "@/components/client/viewer-project-detail";
import {
  getHackathonsByIdsServer,
  getProjectServer,
  getProjectSubmissionsServer,
} from "@/lib/server-data";

export default async function ViewerProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, submissions] = await Promise.all([
    getProjectServer(id),
    getProjectSubmissionsServer(id),
  ]);

  const hackathonIds = [...new Set(submissions.map((s) => s.hackathon_id))];
  const hackathonMap = hackathonIds.length > 0 ? await getHackathonsByIdsServer(hackathonIds) : {};
  const hackathonNames: Record<string, string> = {};
  for (const [hId, h] of Object.entries(hackathonMap)) {
    hackathonNames[hId] = h.name;
  }

  return (
    <ViewerProjectDetail
      project={project}
      projectId={id}
      submissions={submissions}
      hackathonNames={hackathonNames}
    />
  );
}
