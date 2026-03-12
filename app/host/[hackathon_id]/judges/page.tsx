import { redirect } from "next/navigation";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonInvitationsServer, getHackathonServer } from "@/lib/server-data";

export default async function HostBoosterJudgesPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth || !(auth.capabilities.isAdmin || auth.capabilities.isEventCreator)) {
    redirect("/login");
  }

  const { hackathon_id } = await params;
  if (!hackathon_id.includes("-")) {
    redirect("/host");
  }

  const [hackathon, invites] = await Promise.all([
    getHackathonServer(hackathon_id),
    getHackathonInvitationsServer(hackathon_id, "judge"),
  ]);

  if (!hackathon) {
    redirect("/host");
  }

  return (
    <JudgeInviteForm
      hackathons={[hackathon]}
      initialHackathonId={hackathon.id}
      initialInvites={invites}
      hideHackathonPicker
    />
  );
}
