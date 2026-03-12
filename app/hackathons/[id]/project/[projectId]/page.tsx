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

export default async function HackathonProjectPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { id: hackathonId, projectId } = await params;

  const [project, submissions] = await Promise.all([
    getProjectServer(projectId),
    getProjectSubmissionsServer(projectId),
  ]);

  const hackathonIds = [
    ...new Set(submissions.map((s: { hackathon_id: string }) => s.hackathon_id)),
  ];
  const hackathonMap = hackathonIds.length > 0 ? await getHackathonsByIdsServer(hackathonIds) : {};
  const hackathonNames: Record<string, string> = {};
  for (const [id, b] of Object.entries(hackathonMap)) {
    hackathonNames[id] = b.name;
  }

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
      backHref={`/hackathons/${hackathonId}`}
      backLabel="Back to Hackathon"
      initialTeamMembers={teamMembers}
      teamOwnerId={teamOwnerId}
      currentUserId={auth.userId}
    />
  );
}
