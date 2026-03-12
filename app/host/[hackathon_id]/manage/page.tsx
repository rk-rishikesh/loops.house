import { redirect } from "next/navigation";
import { EditHackathonForm } from "@/components/client/edit-hackathon-form";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function ManagePage({
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
  if (!caps || !canManageHackathon(caps, hackathon.host_id ?? "", auth.userId, hackathon.id)) {
    redirect("/host");
  }

  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  return (
    <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#2d4a3e" }}>
              Manage: {hackathon.name}
            </h1>
            <div className="mt-2">
              <HackathonPhaseBadge hackathon={hackathon} size="md" />
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={`/host/${hackathon_id}/manage/speakers`}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: "#2d4a3e", color: "#f0ebe0" }}
            >
              Speakers
            </a>
            <a
              href={`/host/${hackathon_id}/manage/judges`}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: "#2d4a3e", color: "#f0ebe0" }}
            >
              Judges
            </a>
          </div>
        </div>

        {permissions.canEditDetails ? (
          <EditHackathonForm hackathon={hackathon} permissions={permissions} />
        ) : (
          <p className="text-sm opacity-60">This hackathon is finalized. No changes can be made.</p>
        )}
      </div>
    </div>
  );
}
