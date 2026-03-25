"use client";

import { ArrowUpRight, Check, Clock, Loader2, Send, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInvitationAction } from "@/lib/actions";
import type { InvitationRow } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

interface CohostRow {
  user_id: string;
  users: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function CohostInviteForm({
  hackathonId,
  initialInvites = [],
  existingCohosts = [],
}: {
  hackathonId: string;
  initialInvites?: InvitationRow[];
  existingCohosts?: CohostRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createInvitationAction({
        type: "cohost",
        email,
        hackathon_id: hackathonId,
      });
      if (!result.success) throw new Error(result.error);
      setSuccess(`Invited ${email}`);
      setEmail("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite cohost");
    } finally {
      setInviting(false);
    }
  }

  const acceptedCount = initialInvites.filter(
    (i) => i.status === "accepted",
  ).length;
  const pendingCount = initialInvites.filter(
    (i) => i.status === "pending",
  ).length;

  return (
    <div className="pt-6 pb-24">
      {/* Hero */}
      <div className="flex items-start justify-between gap-10">
        <h1
          className="font-black text-[#0F2C23] leading-[0.88] uppercase"
          style={{
            fontFamily: FN,
            fontSize: "clamp(48px, 8vw, 120px)",
            letterSpacing: "-0.025em",
          }}
        >
          COHOST
          <br />
          MANAGEMENT
        </h1>
        <div className="flex flex-col items-end justify-end mt-8">
          <p
            className="text-[#0F2C23]/55 max-w-[380px] text-right leading-relaxed"
            style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
          >
            Invite co-hosts to help you manage this hackathon. Cohosts can edit
            details, manage speakers, and invite judges.
          </p>
        </div>
      </div>

      <div
        className=" px-10 grid gap-8 items-start mt-14"
        style={{ gridTemplateColumns: "1fr 320px" }}
      >
        {/* Left Column */}
        <div className="flex flex-col gap-12">
          {/* Invite form */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{
                  fontFamily: FN,
                  fontSize: 32,
                  letterSpacing: "-0.025em",
                }}
              >
                01
              </span>
              <p
                className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
                style={{ fontFamily: FN }}
              >
                Send Invite
              </p>
            </div>

            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cohost@example.com"
                required
                className="flex-1 rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                style={{
                  backgroundColor: "#E2FEA5",
                  border: "none",
                  color: "#0F2C23",
                  fontFamily: FN,
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.backgroundColor = "#CBE595")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E2FEA5")
                }
              />
              <button
                type="submit"
                disabled={inviting || !email}
                className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <span
                  className="pl-5 pr-3 py-3.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#F8FFE8] flex items-center gap-2"
                  style={{ fontFamily: FN }}
                >
                  {inviting ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Send size={11} />
                  )}
                  {inviting ? "Sending..." : "Invite"}
                </span>
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                  style={{ backgroundColor: "#E2FEA5" }}
                >
                  <ArrowUpRight size={13} className="text-[#0F2C23]" />
                </span>
              </button>
            </form>

            {error && (
              <div
                className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-2 text-xs"
                style={{
                  fontFamily: FN,
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "#B91C1C",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <Clock size={12} />
                {error}
              </div>
            )}
            {success && (
              <div
                className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-2 text-xs"
                style={{
                  fontFamily: FN,
                  backgroundColor: "rgba(34,197,94,0.08)",
                  color: "#166534",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}
              >
                <Check size={12} />
                {success}
              </div>
            )}
          </div>

          {/* Active cohosts */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{
                  fontFamily: FN,
                  fontSize: 32,
                  letterSpacing: "-0.025em",
                }}
              >
                02
              </span>
              <p
                className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
                style={{ fontFamily: FN }}
              >
                Active Cohosts
              </p>
            </div>

            {existingCohosts.length === 0 ? (
              <div
                className="py-16 text-center rounded-3xl"
                style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
              >
                <Users size={24} className="mx-auto mb-4 text-[#0F2C23]/30" />
                <p
                  className="text-sm text-[#0F2C23]/50"
                  style={{ fontFamily: FN }}
                >
                  No cohosts yet. Invite someone above.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {existingCohosts.map((cohost) => (
                  <div
                    key={cohost.user_id}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                    style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
                  >
                    {cohost.users?.avatar_url ? (
                      <Image
                        src={cohost.users.avatar_url}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: "rgba(15,44,35,0.1)" }}
                      >
                        <Users size={14} className="text-[#0F2C23]/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold text-[#0F2C23] truncate"
                        style={{ fontFamily: FN }}
                      >
                        {cohost.users?.display_name ||
                          cohost.users?.email ||
                          "Unknown"}
                      </p>
                      {cohost.users?.display_name && cohost.users?.email && (
                        <p
                          className="text-xs text-[#0F2C23]/50 truncate"
                          style={{ fontFamily: FN }}
                        >
                          {cohost.users.email}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[8px] tracking-[0.16em] uppercase font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: "rgba(34,197,94,0.1)",
                        color: "#166534",
                        fontFamily: FN,
                      }}
                    >
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending invitations */}
          {initialInvites.length > 0 && (
            <div>
              <div className="flex items-baseline gap-3 mb-6">
                <span
                  className="font-black text-[#0F2C23]/18"
                  style={{
                    fontFamily: PX,
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                  }}
                >
                  03
                </span>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
                  style={{ fontFamily: PX }}
                >
                  Invitations
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {initialInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-2xl px-5 py-4 border"
                    style={{ borderColor: "rgba(15,44,35,0.08)" }}
                  >
                    <p
                      className="text-sm text-[#0F2C23] truncate"
                      style={{ fontFamily: FN }}
                    >
                      {invite.email}
                    </p>
                    <span
                      className="text-[8px] tracking-[0.16em] uppercase font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          invite.status === "accepted"
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(234,179,8,0.1)",
                        color:
                          invite.status === "accepted" ? "#166534" : "#92400E",
                        fontFamily: PX,
                      }}
                    >
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="sticky top-[81px] flex flex-col gap-4">
          <div
            className="rounded-3xl p-7"
            style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
          >
            <p
              className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
              style={{ fontFamily: FN }}
            >
              Cohost Status
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Active", value: existingCohosts.length },
                { label: "Accepted", value: acceptedCount },
                { label: "Pending", value: pendingCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b border-[#0F2C23]/08"
                >
                  <p
                    className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#0F2C23]/38"
                    style={{ fontFamily: FN }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm font-black text-[#0F2C23]"
                    style={{ fontFamily: FN }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl px-6 py-5"
            style={{ backgroundColor: "#E2FEA5" }}
          >
            <p
              className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-4"
              style={{ fontFamily: FN }}
            >
              About Cohosts
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  n: "01",
                  t: "Cohosts can edit hackathon details, manage speakers, and invite judges.",
                },
                {
                  n: "02",
                  t: "Only the original host or admins can add cohosts.",
                },
                {
                  n: "03",
                  t: "Invitees receive a notification to accept the cohost role.",
                },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-start gap-3">
                  <span
                    className="font-black text-[#0F2C23]/20 leading-none shrink-0 mt-0.5"
                    style={{ fontFamily: FN, fontSize: 11, width: 20 }}
                  >
                    {n}
                  </span>
                  <p
                    className="text-xs text-[#0F2C23]/60 leading-relaxed"
                    style={{ fontFamily: FN }}
                  >
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
