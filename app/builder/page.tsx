import { getHackathonsServer } from "@/lib/server-data";
import { BuilderDashboard } from "@/components/client/builder-dashboard";

export default async function ProjectHubPage() {
  const hackathons = await getHackathonsServer();

  return <BuilderDashboard allHackathons={hackathons} />;
}
