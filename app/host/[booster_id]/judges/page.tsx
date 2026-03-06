import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getBoosterServer } from "@/lib/server-data";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";

export default async function HostBoosterJudgesPage({
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

  const booster = await getBoosterServer(booster_id);
  if (!booster) {
    redirect("/host");
  }

  return (
    <JudgeInviteForm
      boosters={[booster]}
      initialBoosterId={booster.id}
      hideBoosterPicker
    />
  );
}
