import { redirect } from "next/navigation";

/**
 * Legacy host judging route — redirects to /judge/[hackathon_id]/[project_id].
 * Judges now use the dedicated /judge/ route tree.
 */
export default async function HostBoosterJudgingPage({
  params,
}: {
  params: Promise<{ hackathon_id: string; project_id: string }>;
}) {
  const { hackathon_id, project_id } = await params;
  redirect(`/judge/${hackathon_id}/${project_id}`);
}
