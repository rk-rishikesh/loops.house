import { redirect } from "next/navigation";
import { SpeakersManager } from "@/components/client/speakers-manager";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer, getHackathonSpeakersServer } from "@/lib/server-data";

const FN = "var(--font-funnel-sans), sans-serif";
const PX = "var(--font-pixelify-sans), sans-serif";

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

  const permissions = getPhasePermissions(hackathon.phase);

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
            Speakers
          </h1>
            <HackathonPhaseBadge phase={hackathon.phase} />
          </div>

          <div className="flex items-start justify-between gap-10 mt-12">
          <h1
          className="font-black text-[#0F2C23] leading-[0.88] uppercase"
          style={{
            fontFamily: PX,
            fontSize: "clamp(52px, 9vw, 138px)",
            letterSpacing: "-0.025em",
          }}
        >
          SPEAKERS
          <br />
          MANAGEMENT
        </h1>
        <div className="flex flex-col items-end justify-end mt-8">
          <p
            className="text-[#0F2C23]/55 max-w-[380px] text-right leading-relaxed"
            style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
          >
            Add and manage speakers for this program. They'll appear on the public hackathon page.
          </p>
        </div>
          </div>
        </div>
        <SpeakersManager
          hackathonId={hackathon_id}
          speakers={speakers}
          canEdit={permissions.canEditSpeakers}
        />
        {!permissions.canEditSpeakers && (
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
          >
            This hackathon is finalized. Speaker details can no longer be edited.
          </p>
        )}
      </div>
    </div>
  );
}
