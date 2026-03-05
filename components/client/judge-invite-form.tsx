"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Users, Send, Check, Clock, Loader2, X } from "lucide-react";
import type { StoredBooster, JudgeInviteWithUser } from "@/lib/data-mappers";

/* ─── Skeleton row ───────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div
      className="grid py-6 border-b border-[#2d4a3e]/10 animate-pulse"
      style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
    >
      <div className="h-4 w-8 rounded bg-[#2d4a3e]/08" />
      <div className="h-4 w-40 rounded bg-[#2d4a3e]/08" />
      <div className="h-4 w-28 rounded bg-[#2d4a3e]/05" />
      <div className="h-5 w-20 rounded-full bg-[#2d4a3e]/07" />
      <div className="h-3 w-16 rounded bg-[#2d4a3e]/05" />
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export function JudgeInviteForm({ boosters, initialBoosterId, hideBoosterPicker = false }: { boosters: StoredBooster[]; initialBoosterId?: string; hideBoosterPicker?: boolean; }) {
  const [selectedBooster, setSelectedBooster] = useState<string>(
    initialBoosterId ?? ""
  );
  const [invites,         setInvites]         = useState<JudgeInviteWithUser[]>([]);
  const [loadingInvites,  setLoadingInvites]  = useState(false);
  const [email,           setEmail]           = useState("");
  const [inviting,        setInviting]        = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBooster) return;
    setLoadingInvites(true);
    fetch(`/api/judge-invites?booster_id=${selectedBooster}`)
      .then((r) => r.json())
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [selectedBooster]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooster || !email) return;
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/judge-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booster_id: selectedBooster, judge_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Invited ${email}`);
      setEmail("");
      const updated = await fetch(`/api/judge-invites?booster_id=${selectedBooster}`).then((r) => r.json());
      setInvites(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite judge");
    } finally {
      setInviting(false);
    }
  }

  const activeBooster   = boosters.find((b) => b.id === selectedBooster);
  const acceptedCount   = invites.filter((i) => i.accepted).length;
  const pendingCount    = invites.filter((i) => !i.accepted).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─ strip style ─────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Left: back to host */}
          <Link
            href="/host"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <span>&larr;</span>
              <span>Host</span>
            </span>
          </Link>

          {/* Right: Judge Management + active booster */}
          <div className="flex-1 min-w-0 py-8 flex items-center justify-between px-10">
            <span>Judge Management</span>
            {activeBooster && (
              <span
                className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
              >
                {activeBooster.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-14">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
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
              className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.5vw, 18px)" }}
            >
              Invite judges to your boosters by email. They must have an account on the platform.
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────── */}
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>

          {/* ═══ LEFT ════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-10">

            {/* Step 01 — Pick a booster */}
            {!hideBoosterPicker && (
              <div>
                <div className="flex items-baseline gap-3 mb-5">
                  <span
                    className="font-black text-[#2d4a3e]/18"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                  >
                    01
                  </span>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Select Booster
                  </p>
                </div>

                {boosters.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "#f5f2ea" }}>
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                      style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
                    >
                      <Users size={20} />
                    </div>
                    <p
                      className="font-black text-[#2d4a3e] uppercase mb-2"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, letterSpacing: "-0.02em" }}
                    >
                      No boosters yet.
                    </p>
                    <p className="text-[#2d4a3e]/50 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                      Create a booster first to manage judges.
                    </p>
                  </div>
                ) : (
                  /* Booster tile grid */
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
                  >
                    {boosters.map((b) => {
                      const isActive = selectedBooster === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBooster(b.id);
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-left rounded-2xl p-5 border-none cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                          style={{ backgroundColor: isActive ? "#2d4a3e" : "#d6cfc0" }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isActive
                                  ? "rgba(214,207,192,0.15)"
                                  : "rgba(45,74,62,0.1)",
                              }}
                            >
                              <Users
                                size={14}
                                style={{ color: isActive ? "#d6cfc0" : "#2d4a3e" }}
                              />
                            </div>
                            {isActive && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "#d6cfc0" }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: "#2d4a3e" }}
                                />
                              </span>
                            )}
                          </div>
                          <p
                            className="font-black uppercase leading-tight mb-1"
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13,
                              letterSpacing: "-0.01em",
                              color: isActive ? "#f0ebe0" : "#2d4a3e",
                            }}
                          >
                            {b.name}
                          </p>
                          {b.booster_type && (
                            <p
                              className="text-[10px] uppercase font-bold"
                              style={{
                                color: isActive
                                  ? "rgba(240,235,224,0.4)"
                                  : "rgba(45,74,62,0.45)",
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {b.booster_type}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Step 02 — Invite by email */}
            {selectedBooster && (
              <div>
                <div className="flex items-baseline gap-3 mb-5">
                  <span
                    className="font-black text-[#2d4a3e]/18"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                  >
                    01
                  </span>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Invite a Judge
                  </p>
                </div>

                <form onSubmit={handleInvite}>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                      <p
                        className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40 mb-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Judge Email
                      </p>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null); }}
                        placeholder="judge@example.com"
                        className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#2d4a3e]/30"
                        style={{
                          backgroundColor: "#d6cfc0",
                          border: "none",
                          color: "#2d4a3e",
                          fontFamily: "Georgia, serif",
                        }}
                        onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
                        onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inviting || !email}
                      className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 shrink-0"
                      style={{ backgroundColor: "#2d4a3e" }}
                    >
                      <span
                        className="pl-5 pr-3 py-3.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {inviting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        {inviting ? "Inviting…" : "Invite"}
                      </span>
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                        style={{ backgroundColor: "#d6cfc0" }}
                      >
                        <ArrowUpRight size={13} className="text-[#2d4a3e]" />
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
                    <p className="text-sm text-red-700" style={{ fontFamily: "Georgia, serif" }}>{error}</p>
                  </div>
                )}
                {success && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-2xl px-5 py-4"
                    style={{ backgroundColor: "rgba(45,74,62,0.07)", border: "1px solid rgba(45,74,62,0.15)" }}
                  >
                    <Check size={13} className="shrink-0" style={{ color: "#2d4a3e" }} />
                    <p className="text-sm text-[#2d4a3e]" style={{ fontFamily: "Georgia, serif" }}>{success}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 03 — Invited judges table */}
            {selectedBooster && (
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-black text-[#2d4a3e]/18"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 32, letterSpacing: "-0.025em" }}
                    >
                      02
                    </span>
                    <p
                      className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Invited Judges
                    </p>
                  </div>
                  {invites.length > 0 && (
                    <span
                      className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/30"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {invites.length} invite{invites.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Table header */}
                <div
                  className="grid border-b border-t border-[#2d4a3e]/20 py-3"
                  style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
                >
                  {["No.", "Email", "Name", "Status", "Invited"].map((col) => (
                    <p
                      key={col}
                      className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40"
                      style={{ fontFamily: "'Inter', sans-serif" }}
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
                  <div className="py-20 text-center border-b border-[#2d4a3e]/12">
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                      style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
                    >
                      <Users size={20} />
                    </div>
                    <p
                      className="font-black text-[#2d4a3e] uppercase mb-2"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, letterSpacing: "-0.02em" }}
                    >
                      No judges yet.
                    </p>
                    <p className="text-[#2d4a3e]/50 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                      Invite a judge using the form above.
                    </p>
                  </div>
                ) : (
                  invites.map((inv, idx) => (
                    <div
                      key={inv.id}
                      className="grid items-center py-6 border-b border-[#2d4a3e]/10 transition-all duration-150 hover:bg-[#2d4a3e]/[0.02] rounded-sm"
                      style={{ gridTemplateColumns: "64px 1fr 1fr 120px 100px", gap: "0 20px" }}
                    >
                      <p
                        className="font-bold text-[#2d4a3e]"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}
                      >
                        {String(idx + 1).padStart(2, "0")}.
                      </p>
                      <p
                        className="text-[#2d4a3e]/80 text-sm truncate"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {inv.users?.email ?? "—"}
                      </p>
                      <p
                        className="text-[#2d4a3e]/55 text-sm truncate"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {inv.users?.display_name ?? "—"}
                      </p>
                      <div>
                        <span
                          className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.14em] uppercase font-bold px-3 py-1.5 rounded-full"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            backgroundColor: inv.accepted ? "#2d4a3e" : "rgba(45,74,62,0.1)",
                            color: inv.accepted ? "#f0ebe0" : "rgba(45,74,62,0.55)",
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
                        className="text-[#2d4a3e]/35 text-xs"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))
                )}

                {/* Footer strip */}
                {invites.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#2d4a3e]/08">
                    <p className="text-[11px] text-[#2d4a3e]/40" style={{ fontFamily: "Georgia, serif" }}>
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
            <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Status
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Booster",          value: activeBooster?.name ?? "Not selected",              done: !!activeBooster  },
                  { label: "Judges invited",   value: invites.length > 0 ? `${invites.length} total` : "None yet", done: invites.length > 0 },
                  { label: "Judges accepted",  value: acceptedCount > 0 ? `${acceptedCount} accepted`    : "Awaiting",           done: acceptedCount > 0 },
                ].map(({ label, value, done }) => (
                  <div key={label} className="flex items-center gap-3 py-3 border-b border-[#2d4a3e]/08">
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: done ? "#2d4a3e" : "rgba(45,74,62,0.1)" }}
                    >
                      {done && <Check size={10} style={{ color: "#f0ebe0" }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#2d4a3e]/38"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {label}
                      </p>
                      <p className="text-sm text-[#2d4a3e]/65 truncate" style={{ fontFamily: "Georgia, serif" }}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {selectedBooster && invites.length > 0 && (
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#2d4a3e" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  At a glance
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total",    value: invites.length  },
                    { label: "Accepted", value: acceptedCount   },
                    { label: "Pending",  value: pendingCount    },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(240,235,224,0.07)" }}>
                      <p
                        className="font-black text-[#f0ebe0] leading-none"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, letterSpacing: "-0.03em" }}
                      >
                        {value}
                      </p>
                      <p
                        className="text-[8px] tracking-[0.12em] uppercase font-bold text-[#f0ebe0]/35 mt-1.5"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guide */}
            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#d6cfc0" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                How it works
              </p>
              <div className="flex flex-col gap-3">
                {(hideBoosterPicker
                  ? [
                      { n: "01", t: "Enter a judge's email address. They must already have a platform account." },
                      { n: "02", t: "Judges receive an invite and can accept it to gain judging access for this booster." },
                    ]
                  : [
                      { n: "01", t: "Select a booster — each one has its own pool of judges." },
                      { n: "02", t: "Enter a judge's email address. They must already have a platform account." },
                      { n: "03", t: "Judges receive an invite and can accept it to gain judging access for that booster." },
                    ]
                ).map(({ n, t }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span
                      className="font-black text-[#2d4a3e]/20 leading-none shrink-0 mt-0.5"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, width: 20 }}
                    >
                      {n}
                    </span>
                    <p className="text-xs text-[#2d4a3e]/60 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
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
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["JUDGE MANAGEMENT", "★", "INVITE JUDGES", "★", "HOST DASHBOARD", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}
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
