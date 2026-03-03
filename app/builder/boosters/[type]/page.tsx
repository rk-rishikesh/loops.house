import { getServerAuth } from "@/lib/server-auth";
import { getBoostersServer, getProjectsServer, getSubmissionsForBoostersServer } from "@/lib/server-data";
import type { BoosterType } from "@/lib/data-mappers";
import { redirect } from "next/navigation";
import { BuilderBoosterTypeDetail } from "@/components/client/builder-booster-type-detail";

export default async function BuilderBoosterTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { type } = await params;
  const validType = (["idea", "momentum", "capital"].includes(type) ? type : "idea") as BoosterType;

  const [boosters, projects] = await Promise.all([
    getBoostersServer(validType),
    getProjectsServer(),
  ]);

  const boosterIds = boosters.map(b => b.id);
  const submissions = boosterIds.length > 0 ? await getSubmissionsForBoostersServer(boosterIds) : [];

  return (
    <BuilderBoosterTypeDetail
      type={validType}
      boosters={boosters}
      projects={projects}
      submissions={submissions}
      role={auth.role}
    />
  );
}
