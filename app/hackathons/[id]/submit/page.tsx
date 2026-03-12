import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitToHackathonForm } from "@/components/client/submit-to-hackathon-form";
import { computePhase } from "@/lib/hackathon-phase";
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

  const phase = computePhase(hackathon);
  if (phase !== "building") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
        <div className="px-10 pt-10 pb-16 max-w-3xl mx-auto">
          <Link
            href={`/hackathons/${hackathonId}`}
            className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to hackathon
          </Link>
          <p className="mt-8 text-sm text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
            Submissions are only accepted during the building phase. This hackathon is currently in
            the <strong>{phase}</strong> phase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubmitToHackathonForm hackathon={hackathon} projects={projects} submissions={submissions} />
  );
}
