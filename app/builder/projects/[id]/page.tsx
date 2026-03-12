import { redirect } from "next/navigation";
import { ProjectEditor } from "@/components/client/project-editor";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonsByIdsServer,
  getProjectServer,
  getProjectSubmissionsServer,
  getTeamMembersServer,
  getTeamOwnerServer,
} from "@/lib/server-data";

export default async function BuilderProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { id: projectId } = await params;

  const [project, submissions] = await Promise.all([
    getProjectServer(projectId),
    getProjectSubmissionsServer(projectId),
  ]);

  // Build hackathon name map
  const hackathonIds = [...new Set(submissions.map((s) => s.hackathon_id))];
  const hackathonMap = hackathonIds.length > 0 ? await getHackathonsByIdsServer(hackathonIds) : {};
  const hackathonNames: Record<string, string> = {};
  for (const [id, h] of Object.entries(hackathonMap)) {
    hackathonNames[id] = h.name;
  }

  // Fetch team members if project exists
  const teamId = project?.team_id;
  const [teamMembers, teamOwnerId] = teamId
    ? await Promise.all([getTeamMembersServer(teamId), getTeamOwnerServer(teamId)])
    : [[], null];

  return (
    <ProjectEditor
      initialProject={project}
      initialSubmissions={submissions}
      initialHackathonNames={hackathonNames}
      projectId={projectId}
      initialTeamMembers={teamMembers}
      teamOwnerId={teamOwnerId}
      currentUserId={auth.userId}
    />
  );
}
