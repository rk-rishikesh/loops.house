import { getTeamsServer } from "@/lib/server-data";
import { getServerAuth } from "@/lib/server-auth";
import { CreateTeamForm } from "@/components/client/create-team-form";

export default async function BuilderTeamsPage() {
  const auth = await getServerAuth();
  const teams = auth ? await getTeamsServer(auth.userId) : [];

  return <CreateTeamForm teams={teams} />;
}
