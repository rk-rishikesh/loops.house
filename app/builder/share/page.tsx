import { getServerAuth } from "@/lib/server-auth";
import { getProjectsServer, getBoostersServer, getTeamsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { SocialGenerator } from "@/components/client/social-generator";

export default async function BuilderSharePage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const [allProjects, boosters, userTeams] = await Promise.all([
    getProjectsServer(),
    getBoostersServer(),
    getTeamsServer(auth.userId),
  ]);
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter((p) => p.team_id && userTeamIds.has(p.team_id));

  return <SocialGenerator projects={projects} boosters={boosters} />;
}
