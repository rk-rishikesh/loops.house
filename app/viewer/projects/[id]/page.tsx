import { getProjectServer } from "@/lib/server-data";
import { ViewerProjectDetail } from "@/components/client/viewer-project-detail";

export default async function ViewerProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectServer(id);
  return <ViewerProjectDetail project={project} projectId={id} />;
}
