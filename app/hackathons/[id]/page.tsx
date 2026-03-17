import { BuilderHackathonDetail } from "@/components/client/builder-hackathon-detail";
import type { LeaderboardEntry } from "@/components/client/hackathon-leaderboard";
import type { StoredResult } from "@/lib/data-mappers";
import { computePhase } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonServer,
  getHackathonResultsServer,
  getProjectsServer,
  getSubmissionsServer,
  getUserProjectsServer,
} from "@/lib/server-data";

function buildLeaderboard(results: StoredResult[], projectNames: Record<string, string>): LeaderboardEntry[] {
  return results
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({
      rank: r.rank,
      project_id: r.project_id,
      project_name: projectNames[r.project_id] ?? "Unknown Project",
      final_score: r.final_score,
      ai_score_weighted: r.ai_score_weighted,
      judge_score_weighted: r.judge_score_weighted,
      raw_ai_score: r.raw_ai_score,
      raw_judge_avg_score: r.raw_judge_avg_score,
    }));
}

export default async function HackathonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await getServerAuth();
  const { id } = await params;

  const [hackathon, projects, submissions] = await Promise.all([
    getHackathonServer(id),
    auth ? getUserProjectsServer(auth.userId) : Promise.resolve([]),
    auth ? getSubmissionsServer(id) : Promise.resolve([]),
  ]);

  // Fetch results for judging/completed/finalized phases
  let results: LeaderboardEntry[] = [];
  if (hackathon) {
    const phase = computePhase(hackathon);
    if (phase === "completed" || phase === "finalized") {
      const [storedResults, allProjects] = await Promise.all([
        getHackathonResultsServer(id),
        getProjectsServer(),
      ]);
      const nameMap: Record<string, string> = {};
      for (const p of allProjects) {
        nameMap[p.project_id] = p.name;
      }
      results = buildLeaderboard(storedResults, nameMap);
    }
  }

  return (
    <BuilderHackathonDetail
      hackathonId={id}
      hackathon={hackathon}
      projects={projects}
      submissions={submissions}
      isAuthenticated={!!auth}
      results={results}
    />
  );
}
