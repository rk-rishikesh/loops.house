import { redirect } from "next/navigation";
import { HackathonAnalytics } from "@/components/client/analytics-report-generator";
import type { StoredProject } from "@/lib/data-mappers";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonJudgesServer,
  getHackathonServer,
  getProjectsServer,
  getSubmissionsServer,
} from "@/lib/server-data";
import { createServerSupabase } from "@/lib/supabase/server";

export type HackathonStats = {
  totalSubmissions: number;
  submissionsByStatus: Record<string, number>;
  topCategories: { category: string; count: number }[];
  topTechStacks: { tech: string; count: number }[];
  avgMomentumScore: number;
  aiEvaluatedCount: number;
  judgeCount: number;
  humanEvaluationCount: number;
  daysToDeadline: number | null;
  currentPhase: string;
};

export default async function HostBoosterAnalyticsPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !(auth.capabilities.isAdmin || auth.capabilities.isEventCreator)) {
    redirect("/login");
  }

  const { hackathon_id } = await params;
  if (!hackathon_id.includes("-")) {
    redirect("/host");
  }

  const [hackathon, submissions, judges] = await Promise.all([
    getHackathonServer(hackathon_id),
    getSubmissionsServer(hackathon_id),
    getHackathonJudgesServer(hackathon_id),
  ]);

  if (!hackathon) {
    redirect("/host");
  }

  // Fetch projects for submitted project IDs
  const projectIds = [...new Set(submissions.map((s) => s.project_id))];
  let projectMap: Record<string, StoredProject> = {};
  if (projectIds.length > 0) {
    const allProjects = await getProjectsServer();
    const relevant = allProjects.filter((p) => projectIds.includes(p.project_id));
    projectMap = Object.fromEntries(relevant.map((p) => [p.project_id, p]));
  }

  // Count human evaluations for this hackathon
  const supabase = await createServerSupabase();
  const { count: humanEvalCount } = await supabase
    .from("human_evaluations")
    .select("*", { count: "exact", head: true })
    .eq("hackathon_id", hackathon_id);

  // Compute stats
  const submissionsByStatus: Record<string, number> = {};
  let totalMomentum = 0;
  let aiEvaluatedCount = 0;
  const categoryCounts = new Map<string, number>();
  const techCounts = new Map<string, number>();

  for (const sub of submissions) {
    submissionsByStatus[sub.status] = (submissionsByStatus[sub.status] ?? 0) + 1;
    totalMomentum += sub.momentum_score;
    if (sub.ai_evaluated_at) aiEvaluatedCount++;

    const project = projectMap[sub.project_id];
    if (project?.category) {
      categoryCounts.set(project.category, (categoryCounts.get(project.category) ?? 0) + 1);
    }
    for (const t of project?.tech_stack_tags ?? []) {
      if (t) techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
    }
  }

  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topTechStacks = Array.from(techCounts.entries())
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Days to deadline
  let daysToDeadline: number | null = null;
  if (hackathon.judging_deadline) {
    const diff = new Date(hackathon.judging_deadline).getTime() - Date.now();
    daysToDeadline = Math.ceil(diff / (1000 * 60 * 60 * 24));
  } else if (hackathon.submission_deadline) {
    const diff = new Date(hackathon.submission_deadline).getTime() - Date.now();
    daysToDeadline = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const stats: HackathonStats = {
    totalSubmissions: submissions.length,
    submissionsByStatus,
    topCategories,
    topTechStacks,
    avgMomentumScore: submissions.length > 0 ? Math.round(totalMomentum / submissions.length) : 0,
    aiEvaluatedCount,
    judgeCount: judges.length,
    humanEvaluationCount: humanEvalCount ?? 0,
    daysToDeadline,
    currentPhase: hackathon.status ?? "draft",
  };

  return (
    <HackathonAnalytics hackathon={hackathon} stats={stats} backHref={`/host/${hackathon.id}`} />
  );
}
