import { getServerAuth } from "@/lib/server-auth";
import { getBoosterServer, getProjectsServer, getSubmissionsServer, getTeamsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitToBoosterForm } from "@/components/client/submit-to-booster-form";
import type { BoosterType } from "@/lib/data-mappers";

const TYPES: BoosterType[] = ["idea", "momentum", "capital"];

export default async function SubmitProjectToBoosterPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { type: rawType, id: boosterId } = await params;
  const type: BoosterType = TYPES.includes(rawType as BoosterType)
    ? (rawType as BoosterType)
    : "idea";

  const [booster, allProjects, submissions, userTeams] = await Promise.all([
    getBoosterServer(boosterId),
    getProjectsServer(),
    getSubmissionsServer(boosterId),
    getTeamsServer(auth.userId),
  ]);

  // Only show projects the user owns (their team's projects)
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter((p) => p.team_id && userTeamIds.has(p.team_id));

  if (!booster) {
    return (
      <div>
        <Link
          href={`/boosters/${type}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to boosters
        </Link>
        <p className="text-zinc-500">Booster not found.</p>
      </div>
    );
  }

  return (
    <SubmitToBoosterForm
      booster={booster}
      projects={projects}
      submissions={submissions}
      type={type}
    />
  );
}
