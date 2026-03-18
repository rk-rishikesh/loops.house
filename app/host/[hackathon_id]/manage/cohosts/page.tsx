import { redirect } from "next/navigation";
import { CohostInviteForm } from "@/components/client/cohost-invite-form";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonCohostsServer,
  getHackathonInvitationsServer,
  getHackathonServer,
} from "@/lib/server-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FN = "var(--font-funnel-sans), sans-serif";

export default async function ManageCohostsPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const { hackathon_id } = await params;
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const hackathon = await getHackathonServer(hackathon_id);
  if (!hackathon) redirect("/host");

  const caps = await getFullCapabilities(supabaseAdmin, auth.userId);
  if (
    !caps ||
    !canManageHackathon(
      caps,
      hackathon.host_id ?? "",
      auth.userId,
      hackathon.id,
    )
  ) {
    redirect("/host");
  }

  const [invitations, cohosts] = await Promise.all([
    getHackathonInvitationsServer(hackathon_id, "cohost"),
    getHackathonCohostsServer(hackathon_id),
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
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
            Cohosts
          </h1>
          <div className="ml-2">
            <HackathonPhaseBadge phase={hackathon.phase} />
          </div>
        </div>

        <CohostInviteForm
          hackathonId={hackathon.id}
          initialInvites={invitations}
          existingCohosts={cohosts}
        />
      </div>
    </div>
  );
}
