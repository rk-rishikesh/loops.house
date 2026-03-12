import { redirect } from "next/navigation";

export default async function LegacyJudgesPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const { hackathon_id } = await params;
  redirect(`/host/${hackathon_id}/manage/judges`);
}
