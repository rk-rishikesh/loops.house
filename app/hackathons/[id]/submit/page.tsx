import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitToHackathonForm } from "@/components/client/submit-to-hackathon-form";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonServer,
  getProjectsServer,
  getSubmissionsServer,
  getTeamsServer,
} from "@/lib/server-data";

export default async function SubmitToHackathonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { id: hackathonId } = await params;

  const [hackathon, allProjects, submissions, userTeams] = await Promise.all([
    getHackathonServer(hackathonId),
    getProjectsServer(),
    getSubmissionsServer(hackathonId),
    getTeamsServer(auth.userId),
  ]);

  // Only show projects the user owns (their team's projects)
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter((p) => p.team_id && userTeamIds.has(p.team_id));

  if (!hackathon) {
    return (
      <div>
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to hackathons
        </Link>
        <p className="text-zinc-500">Hackathon not found.</p>
      </div>
    );
  }

  return (
    <SubmitToHackathonForm hackathon={hackathon} projects={projects} submissions={submissions} />
  );
}
