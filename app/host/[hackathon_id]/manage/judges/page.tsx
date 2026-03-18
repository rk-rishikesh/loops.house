import { redirect } from "next/navigation";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonInvitationsServer, getHackathonServer } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

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

  const permissions = getPhasePermissions(hackathon.phase);

  const invitations = await getHackathonInvitationsServer(hackathon_id, "judge");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <a
              href={`/host/${hackathon_id}/manage`}
              className="text-[11px] tracking-[0.16em] uppercase font-bold no-underline"
              style={{ color: "rgba(15,44,35,0.55)", fontFamily: FN }}
            >
              Manage
            </a>
            <span style={{ color: "rgba(15,44,35,0.35)" }}>/</span>
            <h1
            className="font-bold uppercase leading-tight"
            style={{
              color: "#0F2C23",
              fontFamily: FN,
              letterSpacing: "-0.02em",
            }}
          >
            Judges
          </h1>
            <HackathonPhaseBadge phase={hackathon.phase} />
          </div>


        </div>
        {permissions.canEditJudges ? (
          <JudgeInviteForm
            hackathons={[hackathon]}
            initialHackathonId={hackathon.id}
            initialInvites={invitations}
            hideHackathonPicker
          />
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(15,44,35,0.6)", fontFamily: FN }}
          >
            Judge management is locked for finalized hackathons.
          </p>
        )}
      </div>
    </div>
  );
}
