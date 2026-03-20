"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Search, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useIsMounted } from "@/hooks/use-is-mounted";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function fmtDateTime(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTotalPrizePoolFromSummary(
  summary?: string,
): { label: string; amount: number } | null {
  if (!summary) return null;

  // bounty_pool_summary is stored as concatenated prize blocks like:
  // "1st Prize — USD 5000\nDescription" (repeated)
  // We parse all occurrences of currency + amount and sum them.
  const matches: Array<{ currency: string; amount: number }> = [];

  const currencyToken =
    "(?:USD|EUR|GBP|INR|AUD|CAD|CHF|CNY|JPY|KRW|SGD|HKD|NZD|\\$|€|£)";
  const amountRegex = new RegExp(
    `${currencyToken}\\s*([0-9]+(?:,[0-9]{3})*(?:\\.[0-9]+)?|[0-9]+(?:\\.[0-9]+)?)(?:\\s*([kKmMbB]))?`,
    "g",
  );

  let m: RegExpExecArray | null;
  while ((m = amountRegex.exec(summary))) {
    const currency = m[0].match(new RegExp(currencyToken, "i"))?.[0] ?? "$";
    const raw = m[1];
    const suffix = m[2]?.toLowerCase() ?? "";

    const base = Number(String(raw).replace(/,/g, ""));
    if (!Number.isFinite(base)) continue;

    const multiplier =
      suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : suffix === "b" ? 1_000_000_000 : 1;

    matches.push({ currency: currency.toUpperCase(), amount: base * multiplier });
  }

  if (matches.length === 0) return null;

  const total = matches.reduce((sum, x) => sum + x.amount, 0);
  const currencyLabel = matches[0].currency;

  const formatted =
    Number.isInteger(total) || total % 1 === 0
      ? total.toLocaleString()
      : total.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return { label: `${currencyLabel} ${formatted}`, amount: total };
}

type EventStatus = "ongoing" | "upcoming" | "past";
type TabId = "ongoing" | "upcoming" | "past";

type Hackathon = {
  id: string;
  name: string;
  logo_url?: string;
  theme?: string;
  bounty_pool_summary?: string;
  problem_statements: string[];
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
};
const TAGLINE = "Discover hackathons, build projects, and compete for prizes";

const TAB_CONFIG: { id: TabId; label: string }[] = [
  { id: "ongoing", label: "Open Now" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function deriveStatus(hackathon: Hackathon, idx: number): EventStatus {
  const now = new Date();
  if (hackathon.results_date) {
    const results = new Date(hackathon.results_date);
    if (results < now) return "past";
  }
  if (hackathon.start_date) {
    const start = new Date(hackathon.start_date);
    if (start > now) return "upcoming";
  }
  if (hackathon.submission_deadline) {
    const deadline = new Date(hackathon.submission_deadline);
    if (deadline > now) return "ongoing";
    // Deadline passed but results_date hasn't passed (or not set) → still ongoing (judging)
    return hackathon.results_date ? "ongoing" : "past";
  }
  // Fallback: distribute based on index
  if (idx % 3 === 2) return "past";
  if (idx % 3 === 1) return "upcoming";
  return "ongoing";
}

function FeaturedHero({ b }: { b: Hackathon }) {
  return (
    <Link href={`/hackathons/${b.id}`} className="no-underline block group">
      <div
        className="relative overflow-hidden rounded-3xl transition-all duration-200 group-hover:scale-[1.005]"
        style={{ backgroundColor: "#0F2C23" }}
      >
        <span
          className="absolute right-[-24px] top-1/2 -translate-y-1/2 select-none pointer-events-none font-black uppercase whitespace-nowrap"
          style={{
            fontFamily: PX,
            fontSize: "clamp(100px, 16vw, 220px)",
            letterSpacing: "-0.05em",
            color: "rgba(226,254,165,0.035)",
            lineHeight: 1,
          }}
          aria-hidden
        >
          FEATURED
        </span>

        <div className="flex items-center justify-between px-9 py-5">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[9px] tracking-[0.16em] uppercase font-bold"
            style={{
              fontFamily: PX,
              backgroundColor: "#E2FEA5",
              color: "#0F2C23",
            }}
          >
            View program <ArrowUpRight size={11} />
          </span>
        </div>

        <div className="px-9 pb-9 flex items-end justify-between gap-10">
          <div className="flex-1 min-w-0">
            <h2
              className="font-black text-[#E2FEA5] uppercase leading-[0.88]"
              style={{
                fontFamily: FN,
                fontSize: "clamp(40px, 6vw, 80px)",
                letterSpacing: "-0.04em",
                margin: "0 0 18px",
              }}
            >
              {b.name}
            </h2>
            {b.theme && (
              <p
                className="text-[rgba(226,254,165,0.42)] leading-relaxed max-w-[520px]"
                style={{ fontFamily: FN, fontSize: "clamp(14px, 1.3vw, 17px)" }}
              >
                {b.theme}
              </p>
            )}
          </div>

          <div
            className="flex flex-col justify-center gap-2 shrink-0 uppercase"
            style={{ minWidth: 180 }}
          >
            {b.problem_statements.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-xl px-3.5 py-5"
                style={{ backgroundColor: "#3C574B" }}
              >
                <Zap size={11} style={{ color: "#f0c060", flexShrink: 0 }} />
                <span
                  className="text-[11px]"
                  style={{ fontFamily: FN, color: "rgba(226,254,165,0.7)" }}
                >
                  {b.problem_statements.length} challenges
                </span>
              </div>
            )}
            {b.bounty_pool_summary && (
              <div
                className="flex items-center gap-3 rounded-xl px-3.5 py-5"
                style={{ backgroundColor: "#3C574B" }}
              >
                <Trophy size={11} style={{ color: "#4caf7d", flexShrink: 0 }} />
                <span
                  className="text-[11px] truncate"
                  style={{ fontFamily: FN, color: "rgba(226,254,165,0.7)" }}
                >
                  {(() => {
                    const parsed = getTotalPrizePoolFromSummary(
                      b.bounty_pool_summary,
                    );
                    return parsed ? `Total ${parsed.label}` : String(b.bounty_pool_summary).slice(0, 32);
                  })()}
                </span>
              </div>
            )}
            {b.submission_deadline && (
              <div
                className="flex items-center gap-3 rounded-xl px-3.5 py-5"
                style={{ backgroundColor: "#3C574B" }}
              >
                <Clock size={11} style={{ color: "#E2FEA5", flexShrink: 0 }} />
                <span
                  className="text-[11px] truncate"
                  style={{ fontFamily: FN, color: "rgba(226,254,165,0.7)" }}
                >
                  Due {fmtDateTime(b.submission_deadline)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HackCard({ b, status }: { b: Hackathon; status: EventStatus }) {
  const isPast = status === "past";
  const isUpcoming = status === "upcoming";

  const bg = isPast ? "rgba(15,44,35,0.04)" : "#0F2C23";
  const fg = isPast ? "rgba(15,44,35,0.35)" : "#F8FFE8";
  const fgSub = isPast ? "rgba(15,44,35,0.35)" : "rgba(248,255,232,0.55)";
  const statusLabel = isPast ? "Ended" : isUpcoming ? "Upcoming" : "Open Now";
  const dotColor = isPast
    ? "rgba(15,44,35,0.2)"
    : isUpcoming
      ? "#f0c060"
      : "#4caf7d";

  return (
    <Link
      href={`/hackathons/${b.id}`}
      className="no-underline block h-full group"
    >
      <div
        className={`h-full rounded-2xl p-6 flex flex-col transition-all duration-200 ${!isPast ? "group-hover:scale-[1.01]" : ""}`}
        style={{
          backgroundColor: bg,
          minHeight: 200,
          opacity: isPast ? 0.6 : 1,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            <span
              className="text-[8px] tracking-[0.18em] uppercase font-bold"
              style={{ fontFamily: FN, color: fgSub }}
            >
              {statusLabel}
            </span>
          </div>
          <span
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{
              backgroundColor: isPast ? "rgba(15,44,35,0.06)" : "#0F2C23",
            }}
          >
            <ArrowUpRight
              size={12}
              style={{ color: isPast ? "rgba(15,44,35,0.25)" : "#E2FEA5" }}
            />
          </span>
        </div>

        <h3
          className="font-black uppercase leading-[1.1] mb-2 flex-1"
          style={{
            fontFamily: FN,
            fontSize: "clamp(14px, 1.5vw, 17px)",
            letterSpacing: "-0.02em",
            color: fg,
          }}
        >
          {b.name}
        </h3>

        {b.theme && (
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ fontFamily: FN, color: fgSub }}
          >
            {b.theme.length > 72 ? `${b.theme.slice(0, 72)}...` : b.theme}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4">
          {b.logo_url ? (
            <div
              className="relative w-10 h-10 rounded-xl overflow-hidden"
              style={{
                backgroundColor: isPast
                  ? "rgba(15,44,35,0.06)"
                  : "rgba(248,255,232,0.08)",
                border: `1px solid ${isPast ? "rgba(15,44,35,0.10)" : "rgba(248,255,232,0.12)"}`,
              }}
            >
              <Image
                src={b.logo_url}
                alt={b.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl"
              style={{
                backgroundColor: isPast
                  ? "rgba(15,44,35,0.06)"
                  : "rgba(248,255,232,0.08)",
                border: `1px solid ${isPast ? "rgba(15,44,35,0.10)" : "rgba(248,255,232,0.12)"}`,
              }}
            />
          )}

          {b.submission_deadline ? (
            <span
              className="text-[10px] truncate"
              style={{ fontFamily: FN, color: fgSub }}
            >
              Due {fmtDateTime(b.submission_deadline)}
            </span>
          ) : (
            <span
              className="text-[10px]"
              style={{ fontFamily: FN, color: fgSub }}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function HackathonListPage({ list }: { list: Hackathon[] }) {
  const mounted = useIsMounted();
  const withStatus = list.map((h, idx) => ({
    ...h,
    _status: deriveStatus(h, idx) as EventStatus,
  }));

  // Prefer featuring an "Open Now" hackathon so we don't surface "Upcoming" in that bucket.
  const featured =
    withStatus.find((h) => h._status === "ongoing") ?? withStatus[0] ?? null;

  const bucketed: Record<TabId, typeof withStatus> = {
    ongoing: withStatus.filter((h) => h._status === "ongoing"),
    upcoming: withStatus.filter((h) => h._status === "upcoming"),
    past: withStatus.filter((h) => h._status === "past"),
  };

  const counts: Record<TabId, number> = {
    ongoing: bucketed.ongoing.length,
    upcoming: bucketed.upcoming.length,
    past: bucketed.past.length,
  };

  const [activeTab, setActiveTab] = useState<TabId>("ongoing");
  const [query, setQuery] = useState("");
  const tabItems = bucketed[activeTab];
  const q = query.trim().toLowerCase();
  const filteredItems =
    q.length === 0
      ? tabItems
      : tabItems.filter((h) => {
          const hay = `${h.name ?? ""} ${h.theme ?? ""}`.toLowerCase();
          return hay.includes(q);
        });

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div
        className="px-10 pb-24 transition-all duration-500 ease-out mt-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {/* ── Hero heading ── */}
        <div className="mb-16 flex items-end justify-between gap-10">
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-black text-[#0F2C23] leading-[0.88] uppercase"
              style={{
                fontFamily: PX,
                fontSize: "clamp(48px, 8vw, 120px)",
                letterSpacing: "-0.025em",
              }}
            >
              HACKATHONS
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-4 leading-relaxed max-w-[560px]"
              style={{
                fontFamily: FN,
                fontSize: "clamp(14px, 1.4vw, 17px)",
                color: "rgba(15,44,35,0.55)",
              }}
            >
              {TAGLINE}
            </motion.p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {list.length === 0 && (
          <div
            className="rounded-3xl p-16 text-center"
            style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
          >
            <Zap
              size={24}
              style={{
                color: "#0F2C23",
                opacity: 0.3,
                margin: "0 auto 16px",
                display: "block",
              }}
            />
            <p
              className="font-black uppercase mb-2"
              style={{
                fontFamily: PX,
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "rgba(15,44,35,0.45)",
              }}
            >
              No open calls yet.
            </p>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.4)" }}
            >
              Hosts are adding programs — check back soon.
            </p>
          </div>
        )}

        {list.length > 0 && (
          <>
            {/* ── Featured hero ── */}
            {featured && (
              <section className="mb-12">
                <FeaturedHero b={featured} />
              </section>
            )}

            {/* ── Tab bar (header style) ── */}
            <div className="mt-8 flex items-center justify-between gap-6">
              <div
                className="inline-flex items-center gap-2 rounded-full p-1"
                style={{
                  backgroundColor: "rgba(15,44,35,0.06)",
                  border: "1px solid rgba(15,44,35,0.10)",
                }}
              >
                {TAB_CONFIG.map((tab) => {
                  const on = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className="border-none cursor-pointer px-5 py-2 rounded-full flex items-center justify-center gap-2 transition-all"
                      style={{
                        fontFamily: FN,
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        color: on ? "#0F2C23" : "rgba(15,44,35,0.55)",
                        backgroundColor: on ? "#E2FEA5" : "transparent",
                      }}
                    >
                      {tab.label}
                      <span style={{ opacity: 0.6 }}>({counts[tab.id]})</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-[360px] max-w-[40vw]">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(15,44,35,0.35)" }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search hackathons..."
                  className="w-full rounded-full pl-10 pr-4 py-2.5 outline-none"
                  style={{
                    fontFamily: FN,
                    fontSize: 12,
                    backgroundColor: "rgba(15,44,35,0.04)",
                    border: "1px solid rgba(15,44,35,0.10)",
                    color: "#0F2C23",
                  }}
                />
              </div>
            </div>

            {/* ── Grid ── */}
            {filteredItems.length > 0 ? (
              <div
                className="grid gap-4 mt-8"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {filteredItems.map((h) => (
                  <HackCard key={h.id} b={h} status={h._status} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl px-12 pt-12 pb-16 mt-8 text-center"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <p
                  className="text-[10px] tracking-[0.18em] uppercase font-bold mb-3"
                  style={{ fontFamily: PX, color: "rgba(226,254,165,0.5)" }}
                >
                  {q.length > 0
                    ? "No matching hackathons"
                    : `No ${activeTab} programs`}
                </p>
                <p
                  className="text-sm"
                  style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
                >
                  {q.length > 0
                    ? "Try a different search term."
                    : "Check back soon or explore another tab."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
