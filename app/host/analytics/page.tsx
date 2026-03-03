import { getServerAuth } from "@/lib/server-auth";
import { getBoostersServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { AnalyticsReportGenerator } from "@/components/client/analytics-report-generator";

export default async function HostAnalyticsPage() {
  const auth = await getServerAuth();
  if (!auth || !["host", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const boosters = await getBoostersServer();

  return <AnalyticsReportGenerator boosters={boosters} />;
}
