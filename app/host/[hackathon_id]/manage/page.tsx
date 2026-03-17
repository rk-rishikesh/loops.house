import { ArrowUpRight, Bot, Cpu, Database, InfoIcon, ShieldCheck, Users, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { PublishHackathonBanner } from "@/components/client/publish-hackathon-banner";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { canManageHackathon, getFullCapabilities } from "@/lib/capabilities";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer } from "@/lib/server-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PX = "var(--font-pixelify-sans), sans-serif";
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
  if (!caps || !canManageHackathon(caps, hackathon.host_id ?? "", auth.userId, hackathon.id)) {
    redirect("/host");
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-32">
        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-20">
          <div className="flex items-start justify-between">
            <h1
              className="font-black text-[#0F2C23] leading-[0.88] uppercase"
              style={{
                fontFamily: PX,
                fontSize: "clamp(52px, 9vw, 138px)",
                letterSpacing: "-0.025em",
              }}
            >
              PROGRAM
              <br />
              DASHBOARD.
            </h1>
            <div className="mt-4">
              <HackathonPhaseBadge phase={hackathon.phase} size="md" />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#0F2C23]/55 max-w-[420px] text-right leading-relaxed"
              style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
            >
              Welcome to the command center for{" "}
              <span className="font-bold text-[#0F2C23]">{hackathon.name}</span>. Manage your core
              configuration, speaker lineup, and judging committee from one place.
            </p>
          </div>
        </div>

        {/* ── Draft banner ─────────────────────────────────────────────── */}
        {hackathon.phase === "draft" && (
          <PublishHackathonBanner hackathonId={hackathon.id} />
        )}

        {/* ── Section 01: Core Management ───────────────────────────────── */}
        <div className="mb-24">
          <div className="flex items-baseline gap-3 mb-8">
            <span
              className="font-black text-[#0F2C23]/18"
              style={{ fontFamily: PX, fontSize: 32, letterSpacing: "-0.025em" }}
            >
              01
            </span>
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
              style={{ fontFamily: PX }}
            >
              Management Modules
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <a key={item.title} href={item.href} className="no-underline group">
                <div
                  className="rounded-[40px] p-8 h-[240px] flex flex-col justify-between transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:rotate-1"
                  style={{ backgroundColor: item.color }}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0F2C23]/5 text-[#0F2C23]">
                      {item.icon}
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/40 group-hover:bg-[#0F2C23] group-hover:text-[#F8FFE8] transition-colors">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                  <div>
                    <h2
                      className="font-black uppercase leading-tight mb-2"
                      style={{
                        fontFamily: PX,
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

        {/* ── Section 02: Program Intelligence ─────────────────────────── */}
        <div>
          <div className="flex items-baseline gap-3 mb-8">
            <span
              className="font-black text-[#0F2C23]/18"
              style={{ fontFamily: PX, fontSize: 32, letterSpacing: "-0.025em" }}
            >
              02
            </span>
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
              style={{ fontFamily: PX }}
            >
              Program Intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* AI Agent Breakdown - High Impact Asymmetrical */}
            <div
              className="lg:col-span-3 rounded-[48px] p-12 overflow-hidden relative group transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(15,44,35,0.4)]"
              style={{ backgroundColor: "#0F2C23" }}
            >
              {/* Background Neural Pattern */}
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="neural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" fill="#E2FEA5" />
                      <path
                        d="M 2 2 L 40 40 M 40 2 L 2 40"
                        stroke="#E2FEA5"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#neural-grid)" />
                </svg>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E2FEA5] text-[#0F2C23] shadow-[0_0_30px_rgba(226,254,165,0.3)]">
                        <Bot size={28} />
                      </div>
                      <div>
                        <h3
                          className="font-black text-[#F8FFE8] uppercase tracking-wide leading-none mb-1"
                          style={{ fontFamily: PX, fontSize: 26 }}
                        >
                          AUTONOMOUS AGENTS
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#E2FEA5] animate-pulse" />
                          <span
                            className="text-[10px] uppercase font-bold text-[#E2FEA5]/60 tracking-widest"
                            style={{ fontFamily: PX }}
                          >
                            System Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    className="text-[#F8FFE8]/70 leading-relaxed mb-12 max-w-xl"
                    style={{ fontFamily: FN, fontSize: 18 }}
                  >
                    Your program data isn't just stored; it's{" "}
                    <span className="text-[#E2FEA5] font-medium italic underline decoration-[#E2FEA5]/30 underline-offset-4">
                      synthesized
                    </span>
                    . Every deadline and prize detail feeds a custom AI Agent designed to guide your
                    builders through the complexity of your specific program logic.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Role", text: "Expert Program Guide", icon: <Cpu size={14} /> },
                    { label: "Capability", text: "Real-time Updates", icon: <Zap size={14} /> },
                    { label: "Context", text: "Hackathon Knowledge", icon: <Database size={14} /> },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
                    >
                      <div className="text-[#E2FEA5] mb-2">{stat.icon}</div>
                      <p
                        className="text-[9px] uppercase font-bold text-[#F8FFE8]/30 mb-1"
                        style={{ fontFamily: PX }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-[#F8FFE8] text-xs font-bold leading-tight"
                        style={{ fontFamily: FN }}
                      >
                        {stat.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Knowledge Base Sync - Technical Data Card */}
            <div
              className="lg:col-span-2 rounded-[48px] p-10 relative overflow-hidden transition-all duration-500 border border-[#0F2C23]/10 hover:shadow-[0_30px_60px_-15px_rgba(15,44,35,0.1)] flex flex-col justify-between"
              style={{ backgroundColor: "#E2FEA5" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#0F2C23] text-[#E2FEA5]">
                    <Database size={22} />
                  </div>
                  <h3
                    className="font-black text-[#0F2C23] uppercase tracking-wide leading-none"
                    style={{ fontFamily: PX, fontSize: 22 }}
                  >
                    KNOWLEDGE SYNC
                  </h3>
                </div>

                <p
                  className="text-[#0F2C23]/70 leading-relaxed mb-10"
                  style={{ fontFamily: FN, fontSize: 16 }}
                >
                  Our{" "}
                  <span className="font-bold text-[#0F2C23] uppercase text-[13px] tracking-tight">
                    RAG Pipeline
                  </span>{" "}
                  mirrors your every move. Edit a field, and our vector engine re-indexes the
                  builder-facing intelligence in{" "}
                  <span className="font-bold text-[#0F2C23]">~240ms</span>.
                </p>

                <div className="space-y-3">
                  {[
                    { label: "Last Sync", value: "Just now" },
                    { label: "Index Quality", value: "99.9%" },
                    { label: "Vector Latency", value: "8ms" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-3 border-b border-[#0F2C23]/10"
                    >
                      <span
                        className="text-[10px] uppercase font-bold text-[#0F2C23]/40 tracking-wider"
                        style={{ fontFamily: PX }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-xs font-black text-[#0F2C23]"
                        style={{ fontFamily: PX }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-6 bg-[#0F2C23]/5 rounded-[32px] border border-[#0F2C23]/5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[#E2FEA5] bg-[#0F2C23]/10 flex items-center justify-center"
                      >
                        <Users size={10} className="text-[#0F2C23]/40" />
                      </div>
                    ))}
                  </div>
                  <p
                    className="text-[10px] text-[#0F2C23]/60 font-medium"
                    style={{ fontFamily: FN }}
                  >
                    Builders accessing synced data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
