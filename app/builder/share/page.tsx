import { getServerAuth } from "@/lib/server-auth";
import { getProjectsServer, getBoostersServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { SocialGenerator } from "@/components/client/social-generator";

export default async function BuilderSharePage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const [projects, boosters] = await Promise.all([
    getProjectsServer(),
    getBoostersServer(),
  ]);

  return <SocialGenerator projects={projects} boosters={boosters} />;
}
