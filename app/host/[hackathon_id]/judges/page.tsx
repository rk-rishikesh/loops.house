import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";

export default async function HostBoosterJudgesPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !["host", "admin"].includes(auth.role)) {
    redirect("/login");
  }

  const { hackathon_id } = await params;
  if (!hackathon_id.includes("-")) {
    redirect("/host");
  }

  const hackathon = await getHackathonServer(hackathon_id);
  if (!hackathon) {
    redirect("/host");
  }

  return (
    <JudgeInviteForm
      hackathons={[hackathon]}
      initialHackathonId={hackathon.id}
      hideHackathonPicker
    />
  );
}
