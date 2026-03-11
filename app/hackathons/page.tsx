import { getHackathonsServer } from "@/lib/server-data";
import { HackathonListPage } from "@/components/client/hackathon-list-page";

export default async function HackathonsPage() {
  const boosters = await getHackathonsServer();

  const list = boosters
    .filter((b) => !b.is_exclusive)
    .map((b) => ({
      id: b.id,
      name: b.name,
      theme: b.theme ?? undefined,
      bounty_pool_summary: b.bounty_pool_summary ?? undefined,
      problem_statements: b.problem_statements ?? [],
      start_date: b.start_date ?? undefined,
      submission_deadline: b.submission_deadline ?? undefined,
      judging_deadline: b.judging_deadline ?? undefined,
      results_date: b.results_date ?? undefined,
    }));

  return <HackathonListPage list={list} />;
}
