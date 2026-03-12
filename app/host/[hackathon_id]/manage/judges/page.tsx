import { redirect } from "next/navigation";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonInvitationsServer, getHackathonServer } from "@/lib/server-data";

export default async function ManageJudgesPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const { hackathon_id } = await params;
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const hackathon = await getHackathonServer(hackathon_id);
  if (!hackathon) redirect("/host");

  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  const invitations = await getHackathonInvitationsServer(hackathon_id, "judge");

  return (
    <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <a
            href={`/host/${hackathon_id}/manage`}
            className="text-sm opacity-60 hover:opacity-100"
            style={{ color: "#2d4a3e" }}
          >
            Manage
          </a>
          <span style={{ color: "#2d4a3e", opacity: 0.3 }}>/</span>
          <h1 className="text-xl font-semibold" style={{ color: "#2d4a3e" }}>
            Judges
          </h1>
          <HackathonPhaseBadge hackathon={hackathon} />
        </div>
        {permissions.canEditJudges ? (
          <JudgeInviteForm
            hackathons={[hackathon]}
            initialHackathonId={hackathon.id}
            initialInvites={invitations}
            hideHackathonPicker
          />
        ) : (
          <p className="text-sm opacity-60" style={{ color: "#2d4a3e" }}>
            Judge management is locked for finalized hackathons.
          </p>
        )}
      </div>
    </div>
  );
}
