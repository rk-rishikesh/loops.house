import { getServerAuth } from "@/lib/server-auth";
import { getProjectServer, getProjectSubmissionsServer, getBoostersByIdsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { ProjectEditor } from "@/components/client/project-editor";

export default async function BuilderProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from_type?: string; from_booster?: string }>;
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

  // Build booster name/type maps
  const boosterIds = [...new Set(submissions.map((s) => s.booster_id))];
  const boosterMap = boosterIds.length > 0 ? await getBoostersByIdsServer(boosterIds) : {};
  const boosterNames: Record<string, string> = {};
  const boosterTypes: Record<string, string> = {};
  for (const [id, b] of Object.entries(boosterMap)) {
    boosterNames[id] = b.name;
    boosterTypes[id] = b.booster_type ?? "idea";
  }

  const fromType = search.from_type;
  const fromBooster = search.from_booster;

  const backHrefFromSearch =
    fromType && fromBooster ? `/boosters/${fromType}/${fromBooster}` : null;

  const firstSubmission = submissions[0];
  const backBoosterId = firstSubmission?.booster_id;
  const backType = backBoosterId ? boosterTypes[backBoosterId] ?? "idea" : null;

  const backHref =
    backHrefFromSearch ??
    (backBoosterId && backType ? `/boosters/${backType}/${backBoosterId}` : "/builder/projects");

  return (
    <ProjectEditor
      initialProject={project}
      initialSubmissions={submissions}
      initialBoosterNames={boosterNames}
      initialBoosterTypes={boosterTypes}
      projectId={projectId}
      backHref={backHref}
      backLabel={backBoosterId && backType ? "Back to booster" : "Projects"}
    />
  );
}
