import { getBoostersServer } from "@/lib/server-data";
import { BuilderDashboard } from "@/components/client/builder-dashboard";

export default async function ProjectHubPage() {
  const boosters = await getBoostersServer();

  return <BuilderDashboard allBoosters={boosters} />;
}
