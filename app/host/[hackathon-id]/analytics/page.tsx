import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { AnalyticsReportGenerator } from "@/components/client/analytics-report-generator";

export default async function HostBoosterAnalyticsPage({
  params,
}: {
  params: Promise<{ booster_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !["host", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const { booster_id } = await params;
  if (!booster_id.includes("-")) {
    redirect("/host");
  }
  const hackathon = await getHackathonServer(booster_id);
  if (!hackathon) {
    redirect("/host");
  }

  return <AnalyticsReportGenerator hackathon={hackathon} backHref={`/host/${hackathon.id}`} />;
}

