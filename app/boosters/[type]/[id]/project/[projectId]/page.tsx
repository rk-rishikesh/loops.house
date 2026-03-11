import { getServerAuth } from "@/lib/server-auth";
import { getProjectServer, getProjectSubmissionsServer, getBoostersByIdsServer, getTeamMembersServer, getTeamOwnerServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { ProjectEditor } from "@/components/client/project-editor";

export default async function BoosterProjectPage({
  params,
}: {
  params: Promise<{ type: string; id: string; projectId: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { type, id: boosterId, projectId } = await params;

  const [project, submissions] = await Promise.all([
    getProjectServer(projectId),
    getProjectSubmissionsServer(projectId),
  ]);

  const boosterIds = [...new Set(submissions.map((s) => s.booster_id))];
  const boosterMap = boosterIds.length > 0 ? await getBoostersByIdsServer(boosterIds) : {};
  const boosterNames: Record<string, string> = {};
  const boosterTypes: Record<string, string> = {};
  for (const [id, b] of Object.entries(boosterMap)) {
    boosterNames[id] = b.name;
    boosterTypes[id] = b.booster_type ?? "idea";
  }

  const teamId = project?.team_id;
  const [teamMembers, teamOwnerId] = teamId
    ? await Promise.all([getTeamMembersServer(teamId), getTeamOwnerServer(teamId)])
    : [[], null];

  return (
    <ProjectEditor
      initialProject={project}
      initialSubmissions={submissions}
      initialBoosterNames={boosterNames}
      initialBoosterTypes={boosterTypes}
      projectId={projectId}
      backHref={`/boosters/${type}/${boosterId}`}
      backLabel="Back to Booster"
      initialTeamMembers={teamMembers}
      teamOwnerId={teamOwnerId}
      currentUserId={auth.userId}
    />
  );
}
