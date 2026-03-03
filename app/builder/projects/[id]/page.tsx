import { getServerAuth } from "@/lib/server-auth";
import { getProjectServer, getProjectSubmissionsServer, getBoostersByIdsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { ProjectEditor } from "@/components/client/project-editor";

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

  // Build booster name/type maps
  const boosterIds = [...new Set(submissions.map((s) => s.booster_id))];
  const boosterMap = boosterIds.length > 0 ? await getBoostersByIdsServer(boosterIds) : {};
  const boosterNames: Record<string, string> = {};
  const boosterTypes: Record<string, string> = {};
  for (const [id, b] of Object.entries(boosterMap)) {
    boosterNames[id] = b.name;
    boosterTypes[id] = b.booster_type ?? "idea";
  }

  return (
    <ProjectEditor
      initialProject={project}
      initialSubmissions={submissions}
      initialBoosterNames={boosterNames}
      initialBoosterTypes={boosterTypes}
      projectId={projectId}
    />
  );
}
