import { getServerAuth } from "@/lib/server-auth";
import { getProjectServer, getProjectSubmissionsServer, getHackathonsByIdsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { ProjectEditor } from "@/components/client/project-editor";

export default async function HackathonProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from_hackathon?: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const [{ id: projectId }, search] = await Promise.all([params, searchParams]);

  const [project, submissions] = await Promise.all([
    getProjectServer(projectId),
    getProjectSubmissionsServer(projectId),
  ]);

  // Build hackathon name maps
  const hackathonIds = [...new Set(submissions.map((s: { hackathon_id: string }) => s.hackathon_id))];
  const hackathonMap = hackathonIds.length > 0 ? await getHackathonsByIdsServer(hackathonIds) : {};
  const hackathonNames: Record<string, string> = {};
  for (const [id, b] of Object.entries(hackathonMap)) {
    hackathonNames[id] = b.name;
  }

  const fromHackathon = search.from_hackathon;

  const backHrefFromSearch =
    fromHackathon ? `/hackathons/${fromHackathon}` : null;

  const firstSubmission = submissions[0];
  const backHackathonId = firstSubmission?.hackathon_id;

  const backHref =
    backHrefFromSearch ??
    (backHackathonId ? `/hackathons/${backHackathonId}` : "/builder/projects");

  return (
    <ProjectEditor
      initialProject={project}
      initialSubmissions={submissions}
      initialHackathonNames={hackathonNames}
      projectId={projectId}
      backHref={backHref}
      backLabel={backHackathonId ? "Back to hackathon" : "Projects"}
    />
  );
}
