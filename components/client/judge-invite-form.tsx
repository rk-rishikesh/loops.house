"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Users, Send, Check, Clock, Loader2, X } from "lucide-react";
import type { StoredHackathon, JudgeInviteWithUser } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Skeleton row ───────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div
      className="grid py-6 border-b border-[#0F2C23]/10 animate-pulse"
      style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
    >
      <div className="h-4 w-8 rounded bg-[#0F2C23]/08" />
      <div className="h-4 w-40 rounded bg-[#0F2C23]/08" />
      <div className="h-4 w-28 rounded bg-[#0F2C23]/05" />
      <div className="h-5 w-20 rounded-full bg-[#0F2C23]/07" />
      <div className="h-3 w-16 rounded bg-[#0F2C23]/05" />
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export function JudgeInviteForm({ hackathons, initialHackathonId, hideHackathonPicker = false }: { hackathons: StoredHackathon[]; initialHackathonId?: string; hideHackathonPicker?: boolean; }) {
  const [selectedHackathon, setSelectedHackathon] = useState<string>(
    initialHackathonId ?? ""
  );
  const [invites,         setInvites]         = useState<JudgeInviteWithUser[]>([]);
  const [loadingInvites,  setLoadingInvites]  = useState(false);
  const [email,           setEmail]           = useState("");
  const [inviting,        setInviting]        = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState<string | null>(null);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoadingInvites(true);
    fetch(`/api/judge-invites?hackathon_id=${selectedHackathon}`)
      .then((r) => r.json())
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [selectedHackathon]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHackathon || !email) return;
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/judge-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hackathon_id: selectedHackathon, judge_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Invited ${email}`);
      setEmail("");
      const updated = await fetch(`/api/judge-invites?hackathon_id=${selectedHackathon}`).then((r) => r.json());
      setInvites(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite judge");
    } finally {
      setInviting(false);
    }
  }

  const activeHackathon   = hackathons.find((b) => b.id === selectedHackathon);
  const acceptedCount   = invites.filter((i) => i.accepted).length;
  const pendingCount    = invites.filter((i) => !i.accepted).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>

      {/* ── Nav ─ strip style ─────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#F8FFE8" }}>
        <div
          className="flex w-full items-stretch border-t border-b border-[#0F2C23] text-[10px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]"
          style={{ fontFamily: PX }}
        >
          {/* Left: back to host */}
          <Link
            href="/host"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#0F2C23] no-underline hover:bg-[rgba(15,44,35,0.06)]"
          >
            <span className="flex items-center gap-2">
              <span>&larr;</span>
              <span>Host</span>
            </span>
          </Link>

          {/* Right: Judge Management + active hackathon */}
          <div className="flex-1 min-w-0 py-8 flex items-center justify-between px-10">
            <span>Judge Management</span>
            {activeHackathon && (
              <span
                className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#0F2C23", color: "#F8FFE8" }}
              >
                {activeHackathon.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-14">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(52px, 9vw, 138px)",
              letterSpacing: "-0.025em",
            }}
          >
            JUDGE
            <br />
            MANAGEMENT.
          </h1>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#0F2C23]/55 max-w-[380px] text-right leading-relaxed"
              style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
            >
              Invite judges to your hackathons by email. They must have an account on the platform.
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>

          {/* ═══ LEFT ════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-10">

            {/* Step 01 — Pick a hackathon */}
            {!hideHackathonPicker && (
              <div>
                <div className="flex items-baseline gap-3 mb-5">
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
                    Select Hackathon
                  </p>
                </div>

                {hackathons.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                      style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
                    >
                      <Users size={20} />
                    </div>
                    <p
                      className="font-black text-[#0F2C23] uppercase mb-2"
                      style={{ fontFamily: PX, fontSize: 16, letterSpacing: "-0.02em" }}
                    >
                      No hackathons yet.
                    </p>
                    <p className="text-[#0F2C23]/50 text-sm" style={{ fontFamily: FN }}>
                      Create a hackathon first to manage judges.
                    </p>
                  </div>
                ) : (
                  /* Hackathon tile grid */
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
                  >
                    {hackathons.map((b) => {
                      const isActive = selectedHackathon === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedHackathon(b.id);
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-left rounded-2xl p-5 border-none cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                          style={{ backgroundColor: isActive ? "#0F2C23" : "#E2FEA5" }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isActive
                                  ? "rgba(226,254,165,0.15)"
                                  : "rgba(15,44,35,0.1)",
                              }}
                            >
                              <Users
                                size={14}
                                style={{ color: isActive ? "#E2FEA5" : "#0F2C23" }}
                              />
                            </div>
                            {isActive && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "#E2FEA5" }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: "#0F2C23" }}
                                />
                              </span>
                            )}
                          </div>
                          <p
                            className="font-black uppercase leading-tight mb-1"
                            style={{
                              fontFamily: PX,
                              fontSize: 13,
                              letterSpacing: "-0.01em",
                              color: isActive ? "#F8FFE8" : "#0F2C23",
                            }}
                          >
                            {b.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Step 02 — Invite by email */}
            {selectedHackathon && (
              <div>
                <div className="flex items-baseline gap-3 mb-5">
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
                    Invite a Judge
                  </p>
                </div>

                <form onSubmit={handleInvite}>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                      <p
                        className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/40 mb-2"
                        style={{ fontFamily: PX }}
                      >
                        Judge Email
                      </p>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null); }}
                        placeholder="judge@example.com"
                        className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                        style={{
                          backgroundColor: "#E2FEA5",
                          border: "none",
                          color: "#0F2C23",
                          fontFamily: FN,
                        }}
                        onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                        onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inviting || !email}
                      className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
                      style={{ backgroundColor: "#0F2C23" }}
                    >
                      <span
                        className="pl-5 pr-3 py-3.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#F8FFE8] flex items-center gap-2"
                        style={{ fontFamily: PX }}
                      >
                        {inviting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        {inviting ? "Inviting…" : "Invite"}
                      </span>
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                        style={{ backgroundColor: "#E2FEA5" }}
                      >
                        <ArrowUpRight size={13} className="text-[#0F2C23]" />
                      </span>
                    </button>
                  </div>
                </form>

                {/* Feedback */}
                {error && (
                  <div
                    className="mt-4 flex items-start gap-3 rounded-2xl px-5 py-4"
                    style={{ backgroundColor: "rgba(200,60,60,0.07)", border: "1px solid rgba(200,60,60,0.15)" }}
                  >
                    <X size={13} className="shrink-0 mt-0.5" style={{ color: "#cc2222" }} />
                    <p className="text-sm text-red-700" style={{ fontFamily: FN }}>{error}</p>
                  </div>
                )}
                {success && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-2xl px-5 py-4"
                    style={{ backgroundColor: "rgba(15,44,35,0.07)", border: "1px solid rgba(15,44,35,0.15)" }}
                  >
                    <Check size={13} className="shrink-0" style={{ color: "#0F2C23" }} />
                    <p className="text-sm text-[#0F2C23]" style={{ fontFamily: FN }}>{success}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 03 — Invited judges table */}
            {selectedHackathon && (
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <div className="flex items-baseline gap-3">
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
                      Invited Judges
                    </p>
                  </div>
                  {invites.length > 0 && (
                    <span
                      className="text-[10px] tracking-widest uppercase font-bold text-[#0F2C23]/30"
                      style={{ fontFamily: PX }}
                    >
                      {invites.length} invite{invites.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Table header */}
                <div
                  className="grid border-b border-t border-[#0F2C23]/20 py-3"
                  style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
                >
                  {["No.", "Email", "Name", "Status", "Invited"].map((col) => (
                    <p
                      key={col}
                      className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#0F2C23]/40"
                      style={{ fontFamily: PX }}
                    >
                      {col}
                    </p>
                  ))}
                </div>

                {/* Rows */}
                {loadingInvites ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : invites.length === 0 ? (
                  <div className="py-20 text-center border-b border-[#0F2C23]/12">
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                      style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
                    >
                      <Users size={20} />
                    </div>
                    <p
                      className="font-black text-[#0F2C23] uppercase mb-2"
                      style={{ fontFamily: PX, fontSize: 16, letterSpacing: "-0.02em" }}
                    >
                      No judges yet.
                    </p>
                    <p className="text-[#0F2C23]/50 text-sm" style={{ fontFamily: FN }}>
                      Invite a judge using the form above.
                    </p>
                  </div>
                ) : (
                  invites.map((inv, idx) => (
                    <div
                      key={inv.id}
                      className="grid items-center py-6 border-b border-[#0F2C23]/10 transition-all duration-150 hover:bg-[#0F2C23]/[0.02] rounded-sm"
                      style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
                    >
                      <p
                        className="font-bold text-[#0F2C23]"
                        style={{ fontFamily: PX, fontSize: 14 }}
                      >
                        {String(idx + 1).padStart(2, "0")}.
                      </p>
                      <p
                        className="text-[#0F2C23]/80 text-sm truncate"
                        style={{ fontFamily: FN }}
                      >
                        {inv.users?.email ?? "—"}
                      </p>
                      <p
                        className="text-[#0F2C23]/55 text-sm truncate"
                        style={{ fontFamily: FN }}
                      >
                        {inv.users?.display_name ?? "—"}
                      </p>
                      <div>
                        <span
                          className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.14em] uppercase font-bold px-3 py-1.5 rounded-full"
                          style={{
                            fontFamily: PX,
                            backgroundColor: inv.accepted ? "#0F2C23" : "rgba(15,44,35,0.1)",
                            color: inv.accepted ? "#F8FFE8" : "rgba(15,44,35,0.55)",
                          }}
                        >
                          {inv.accepted ? (
                            <><Check size={8} /> Accepted</>
                          ) : (
                            <><Clock size={8} /> Pending</>
                          )}
                        </span>
                      </div>
                      <p
                        className="text-[#0F2C23]/35 text-xs"
                        style={{ fontFamily: FN }}
                      >
                        {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))
                )}

                {/* Footer strip */}
                {invites.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#0F2C23]/08">
                    <p className="text-[11px] text-[#0F2C23]/40" style={{ fontFamily: FN }}>
                      {acceptedCount} accepted · {pendingCount} pending
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ RIGHT sidebar ════════════════════════════════════════════ */}
          <aside className="sticky top-[81px] flex flex-col gap-4">

            {/* Status card */}
            <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
                style={{ fontFamily: PX }}
              >
                Status
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Hackathon",          value: activeHackathon?.name ?? "Not selected",              done: !!activeHackathon  },
                  { label: "Judges invited",   value: invites.length > 0 ? `${invites.length} total` : "None yet", done: invites.length > 0 },
                  { label: "Judges accepted",  value: acceptedCount > 0 ? `${acceptedCount} accepted`    : "Awaiting",           done: acceptedCount > 0 },
                ].map(({ label, value, done }) => (
                  <div key={label} className="flex items-center gap-3 py-3 border-b border-[#0F2C23]/08">
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: done ? "#0F2C23" : "rgba(15,44,35,0.1)" }}
                    >
                      {done && <Check size={10} style={{ color: "#F8FFE8" }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#0F2C23]/38"
                        style={{ fontFamily: PX }}
                      >
                        {label}
                      </p>
                      <p className="text-sm text-[#0F2C23]/65 truncate" style={{ fontFamily: FN }}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {selectedHackathon && invites.length > 0 && (
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#0F2C23" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#F8FFE8]/38 mb-4"
                  style={{ fontFamily: PX }}
                >
                  At a glance
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total",    value: invites.length  },
                    { label: "Accepted", value: acceptedCount   },
                    { label: "Pending",  value: pendingCount    },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(226,254,165,0.07)" }}>
                      <p
                        className="font-black text-[#F8FFE8] leading-none"
                        style={{ fontFamily: PX, fontSize: 22, letterSpacing: "-0.03em" }}
                      >
                        {value}
                      </p>
                      <p
                        className="text-[8px] tracking-[0.12em] uppercase font-bold text-[#F8FFE8]/35 mt-1.5"
                        style={{ fontFamily: PX }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guide */}
            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#E2FEA5" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-4"
                style={{ fontFamily: PX }}
              >
                How it works
              </p>
              <div className="flex flex-col gap-3">
                {(hideHackathonPicker
                  ? [
                      { n: "01", t: "Enter a judge's email address. They must already have a platform account." },
                      { n: "02", t: "Judges receive an invite and can accept it to gain judging access for this hackathon." },
                    ]
                  : [
                      { n: "01", t: "Select a hackathon — each one has its own pool of judges." },
                      { n: "02", t: "Enter a judge's email address. They must already have a platform account." },
                      { n: "03", t: "Judges receive an invite and can accept it to gain judging access for that hackathon." },
                    ]
                ).map(({ n, t }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span
                      className="font-black text-[#0F2C23]/20 leading-none shrink-0 mt-0.5"
                      style={{ fontFamily: PX, fontSize: 11, width: 20 }}
                    >
                      {n}
                    </span>
                    <p className="text-xs text-[#0F2C23]/60 leading-relaxed" style={{ fontFamily: FN }}>
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-t border-[#0F2C23]/10 py-3" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["JUDGE MANAGEMENT", "★", "INVITE JUDGES", "★", "HOST DASHBOARD", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: PX, color: t === "★" ? "#0F2C23" : "rgba(15,44,35,0.4)" }}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
