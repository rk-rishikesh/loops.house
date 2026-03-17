import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonsServer, getTeamsServer } from "@/lib/server-data";
import { ResidencyApplicationForm } from "./residency-application-form";

export default async function ResidencyApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string; hackathon_id?: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/residency");

  const [teams, hackathons, params] = await Promise.all([
    getTeamsServer(auth.userId),
    getHackathonsServer(),
    searchParams,
  ]);

  return (
    <ResidencyApplicationForm
      teams={teams}
      hackathons={hackathons}
      defaultTeamId={params.team_id}
      defaultHackathonId={params.hackathon_id}
    />
  );
}
