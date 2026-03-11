import { getServerAuth } from "@/lib/server-auth";
import { getProjectsServer, getHackathonsServer, getTeamsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { SocialGenerator } from "@/components/client/social-generator";

export default async function BuilderSharePage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const [allProjects, hackathons, userTeams] = await Promise.all([
    getProjectsServer(),
    getHackathonsServer(),
    getTeamsServer(auth.userId),
  ]);
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter((p) => p.team_id && userTeamIds.has(p.team_id));

  return <SocialGenerator projects={projects} hackathons={hackathons} />;
}
