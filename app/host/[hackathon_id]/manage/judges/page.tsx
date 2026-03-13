import { redirect } from "next/navigation";
import { JudgeInviteForm } from "@/components/client/judge-invite-form";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
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

  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  const invitations = await getHackathonInvitationsServer(hackathon_id, "judge");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <a
            href={`/host/${hackathon_id}/manage`}
            className="text-[11px] tracking-[0.16em] uppercase font-bold no-underline"
            style={{ color: "rgba(15,44,35,0.55)", fontFamily: PX }}
          >
            Manage
          </a>
          <span style={{ color: "rgba(15,44,35,0.35)" }}>/</span>
          <h1
            className="font-black uppercase leading-tight"
            style={{
              color: "#0F2C23",
              fontFamily: PX,
              fontSize: "clamp(18px, 2.4vw, 26px)",
              letterSpacing: "-0.02em",
            }}
          >
            Judges
          </h1>
          <div className="ml-2">
            <HackathonPhaseBadge hackathon={hackathon} />
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
