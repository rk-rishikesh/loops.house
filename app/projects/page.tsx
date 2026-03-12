import ProjectsListing from "@/components/client/projects-listing";
import { getProjectsServer } from "@/lib/server-data";

export default async function ProjectsPage() {
  const projects = await getProjectsServer();

  return <ProjectsListing projects={projects} />;
}
