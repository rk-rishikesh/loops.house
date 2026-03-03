import { getServerAuth } from "@/lib/server-auth";
import { getBoostersServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";

export default async function JudgeManagementPage() {
  const auth = await getServerAuth();
  if (!auth || !["host", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const boosters = await getBoostersServer();

  return <JudgeInviteForm boosters={boosters} />;
}
