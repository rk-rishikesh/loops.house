import { ArrowUpRight, InfoIcon, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PublishHackathonBanner } from "@/components/client/publish-hackathon-banner";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FN = "var(--font-funnel-sans), sans-serif";

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

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <div className="px-10 pt-10 pb-32">
        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-20">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-16">
            <h1
              className="font-black text-[#0F2C23] leading-[0.88] uppercase"
              style={{
                fontFamily: FN,
                fontSize: "clamp(48px, 8vw, 120px)",
                letterSpacing: "-0.025em",
              }}
            >
              HACKATHON
              <br />
              DASHBOARD
            </h1>

            <div className="pt-4 lg:max-w-[460px] lg:text-right">
              <p
                className="text-[#0F2C23]/55 leading-relaxed pt-5"
                style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
              >
                Welcome to the dashboard for{" "}
                <span className="font-bold text-[#0F2C23]">
                  {hackathon.name}
                </span>
                . Manage program info, speakers, judges, and cohosts from one
                place.
              </p>
              <div className="mt-4 flex lg:justify-end">
                <HackathonPhaseBadge phase={hackathon.phase} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Draft banner ─────────────────────────────────────────────── */}
        {hackathon.phase === "draft" && (
          <PublishHackathonBanner hackathonId={hackathon.id} />
        )}

        {/* ── Section 01: Core Management ───────────────────────────────── */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Program Info",
                desc: "Edit name, theme, schedule, and prize details for this hackathon.",
                href: `/host/${hackathon_id}/manage/edit`,
                icon: <InfoIcon size={20} />,
                color: "#E2FEA5",
              },
              {
                title: "Speakers",
                desc: "Manage featured speakers and their profiles for the program.",
                href: `/host/${hackathon_id}/manage/speakers`,
                icon: <Users size={20} />,
                color: "#E2FEA5",
              },
              {
                title: "Judges",
                desc: "Invite and track judges assigned to score this hackathon.",
                href: `/host/${hackathon_id}/manage/judges`,
                icon: <ShieldCheck size={20} />,
                color: "#E2FEA5",
              },
              {
                title: "Cohosts",
                desc: "Invite co-hosts to help manage this hackathon.",
                href: `/host/${hackathon_id}/manage/cohosts`,
                icon: <Users size={20} />,
                color: "#E2FEA5",
              },
            ].map((item) => (
              <a key={item.title} href={item.href} className="no-underline">
                <div
                  className="rounded-[40px] p-8 h-[240px] flex flex-col justify-between"
                  style={{ backgroundColor: item.color }}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0F2C23]/5 text-[#0F2C23]">
                      {item.icon}
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/40 text-[#0F2C23]">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                  <div>
                    <h2
                      className="font-black uppercase leading-tight mb-2"
                      style={{
                        fontFamily: FN,
                        fontSize: 20,
                        letterSpacing: "-0.01em",
                        color: "#0F2C23",
                      }}
                    >
                      {item.title}
                    </h2>
                    <p
                      className="text-xs leading-relaxed opacity-60"
                      style={{ fontFamily: FN, color: "#0F2C23" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
