import { redirect } from "next/navigation";
import { getBoostersServer } from "@/lib/server-data";
import type { BoosterType } from "@/lib/data-mappers";
import { BoosterTypePage } from "@/components/client/booster-type-page";

const VALID_TYPES = new Set<string>(["idea", "momentum", "capital"]);

export default async function BoosterTypeRoute({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!VALID_TYPES.has(type)) {
    redirect("/boosters");
  }

  const validType = type as BoosterType;
  const boosters = await getBoostersServer(validType);

  const list = boosters.map((b) => ({
    id: b.id,
    name: b.name,
    theme: b.theme ?? undefined,
    bounty_pool_summary: b.bounty_pool_summary ?? undefined,
    problem_statements: b.problem_statements ?? [],
    timeline: b.timeline ?? undefined,
  }));

  return <BoosterTypePage validType={validType} list={list} />;
}
