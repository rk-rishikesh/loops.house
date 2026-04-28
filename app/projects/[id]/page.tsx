import { ViewerProjectDetail } from "@/components/client/viewer-project-detail";
import {
  getHackathonsByIdsServer,
  getProjectServer,
  getProjectSubmissionsServer,
  getTeamMembersServer,
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
  const emptyHackathonMap: Awaited<ReturnType<typeof getHackathonsByIdsServer>> = {};
  const [hackathonMap, teamMembers] = await Promise.all([
    hackathonIds.length > 0
      ? getHackathonsByIdsServer(hackathonIds)
      : Promise.resolve(emptyHackathonMap),
    project?.team_id ? getTeamMembersServer(project.team_id) : Promise.resolve([]),
  ]);
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
      teamMembers={teamMembers}
    />
  );
}
