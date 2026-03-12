import { redirect } from "next/navigation";
import { NewProfileForm } from "@/components/client/new-profile-form";
import { getServerAuth } from "@/lib/server-auth";
import { getTeamsServer } from "@/lib/server-data";

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login?redirect=/builder/new");
  }

  const resolvedSearchParams = await searchParams;

  const teams = await getTeamsServer(auth.userId);

  return (
    <NewProfileForm
      teams={teams}
      userId={auth.userId}
      initialTeamId={resolvedSearchParams.team_id}
    />
  );
}
