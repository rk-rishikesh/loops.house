import { redirect } from "next/navigation";
import { EditHackathonForm } from "@/components/client/edit-hackathon-form";
import { PublishHackathonBanner } from "@/components/client/publish-hackathon-banner";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import { getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export default async function EditPage({ params }: { params: Promise<{ hackathon_id: string }> }) {
  const { hackathon_id } = await params;
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const hackathon = await getHackathonServer(hackathon_id);
  if (!hackathon) redirect("/host");

  const caps = await getFullCapabilities(supabaseAdmin, auth.userId);
  if (!caps || !canManageHackathon(caps, hackathon.host_id ?? "", auth.userId, hackathon.id)) {
    redirect("/host");
  }

  const permissions = getPhasePermissions(hackathon.phase);

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
            Edit Program
          </h1>
          <div className="ml-2">
            <HackathonPhaseBadge phase={hackathon.phase} />
          </div>
        </div>

        {hackathon.phase === "draft" && (
          <PublishHackathonBanner hackathonId={hackathon.id} />
        )}

        {permissions.canEditDetails ? (
          <EditHackathonForm hackathon={hackathon} permissions={permissions} />
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
          >
            This hackathon is finalized. No changes can be made.
          </p>
        )}
      </div>
    </div>
  );
}
