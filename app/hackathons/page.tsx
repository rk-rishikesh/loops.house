import { HackathonListPage } from "@/components/client/hackathon-list-page";
import { getHackathonsServer } from "@/lib/server-data";

export default async function HackathonsPage() {
  const hackathons = await getHackathonsServer();

  const list = hackathons
    .filter((h) => !h.is_exclusive)
    .map((h) => ({
      id: h.id,
      name: h.name,
      logo_url: h.logo_url ?? undefined,
      theme: h.theme ?? undefined,
      bounty_pool_summary: h.bounty_pool_summary ?? undefined,
      problem_statements: h.problem_statements ?? [],
      start_date: h.start_date ?? undefined,
      submission_deadline: h.submission_deadline ?? undefined,
      judging_deadline: h.judging_deadline ?? undefined,
      results_date: h.results_date ?? undefined,
    }));

  return <HackathonListPage list={list} />;
}
