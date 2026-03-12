import { redirect } from "next/navigation";
import { SpeakersManager } from "@/components/client/speakers-manager";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer, getHackathonSpeakersServer } from "@/lib/server-data";

export default async function SpeakersPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const { hackathon_id } = await params;
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const [hackathon, speakers] = await Promise.all([
    getHackathonServer(hackathon_id),
    getHackathonSpeakersServer(hackathon_id),
  ]);
  if (!hackathon) redirect("/host");

  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  return (
    <div className="min-h-screen" style={{ background: "#f0ebe0" }}>
      <div className="mx-auto max-w-3xl px-6 py-10">
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
            Speakers
          </h1>
          <HackathonPhaseBadge hackathon={hackathon} />
        </div>
        <SpeakersManager
          hackathonId={hackathon_id}
          speakers={speakers}
          canEdit={permissions.canEditSpeakers}
        />
      </div>
    </div>
  );
}
