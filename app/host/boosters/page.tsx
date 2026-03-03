import { getServerAuth } from "@/lib/server-auth";
import { getBoostersServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { BoosterForm } from "@/components/client/booster-form";

export default async function HostBoostersPage() {
  const auth = await getServerAuth();
  if (!auth || !["host", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const boosters = await getBoostersServer();

  return <BoosterForm boosters={boosters} userId={auth.userId} />;
}
