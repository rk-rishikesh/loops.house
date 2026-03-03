"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Trophy,
  Zap,
  Search,
} from "lucide-react";
import type { BoosterType, StoredBooster } from "@/lib/data-mappers";
import { useState, useMemo } from "react";

/* ─── Types ──────────────────────────────────────────────────────── */
const TYPES: BoosterType[] = ["idea", "momentum", "capital"];
type EventStatus = "featured" | "ongoing" | "upcoming" | "past";

function deriveStatus(b: StoredBooster, idx: number): EventStatus {
  const tl = (b.timeline ?? "").toLowerCase();
  if (tl.includes("past") || tl.includes("ended") || tl.includes("closed"))
    return "past";
  if (tl.includes("upcoming") || tl.includes("soon") || tl.includes("launch"))
    return "upcoming";
  if (tl.includes("ongoing") || tl.includes("open") || tl.includes("now"))
    return "ongoing";
  if (idx === 0) return "featured";
  if (idx % 3 === 1) return "ongoing";
  if (idx % 3 === 2) return "upcoming";
  return "past";
}

const STATUS_META: Record<
  EventStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  featured: {
    label: "Featured",
    dot: "#2d4a3e",
    bg: "#2d4a3e",
    text: "#f0ebe0",
  },
  ongoing: {
    label: "Open Now",
    dot: "#4caf7d",
    bg: "rgba(76,175,125,0.12)",
    text: "#2d7a50",
  },
  upcoming: {
    label: "Upcoming",
    dot: "#d6a84a",
    bg: "rgba(214,168,74,0.12)",
    text: "#8a6a1a",
  },
  past: {
    label: "Ended",
    dot: "rgba(45,74,62,0.25)",
    bg: "rgba(45,74,62,0.06)",
    text: "rgba(45,74,62,0.45)",
  },
};

const TYPE_LABELS: Record<BoosterType, { nav: string }> = {
  idea: { nav: "Early Stage" },
  momentum: { nav: "Build Phase" },
  capital: { nav: "Scale Up" },
};

/* ─── Atoms ──────────────────────────────────────────────────────── */
function StatusPill({ status }: { status: EventStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.14em] uppercase font-bold px-3 py-1.5 rounded-full"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: m.bg,
        color: m.text,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: m.dot }}
      />
      {m.label}
    </span>
  );
}

function SectionHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <h2
        className="font-black text-[#2d4a3e] uppercase"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(22px, 3vw, 36px)",
          letterSpacing: "-0.02em",
        }}
      >
        {label}
      </h2>
      {count !== undefined && (
        <span
          className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/30"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

/* ─── Featured hero card ─────────────────────────────────────────── */
function FeaturedCard({ b }: { b: StoredBooster & { _type: BoosterType } }) {
  return (
    <Link
      href={`/boosters/${b._type}/${b.id}`}
      className="no-underline group block"
    >
      <div
        className="rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group-hover:scale-[1.01] relative overflow-hidden"
        style={{ backgroundColor: "#2d4a3e", minHeight: 340 }}
      >
        <span
          className="absolute right-4 bottom-0 select-none pointer-events-none font-black text-[#f0ebe0]/04"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(120px, 18vw, 220px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
          }}
        >
          ★
        </span>
        <div className="flex items-start justify-between gap-4">
          <StatusPill status="featured" />
          <span
            className="w-12 h-12 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "#d6cfc0" }}
          >
            <ArrowUpRight size={18} style={{ color: "#2d4a3e" }} />
          </span>
        </div>
        <div className="mt-10 relative z-10">
          <p
            className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-3"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {TYPE_LABELS[b._type].nav}
          </p>
          <h2
            className="font-black text-[#f0ebe0] uppercase leading-[0.88] mb-4"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-0.025em",
            }}
          >
            {b.name}
          </h2>
          {b.theme && (
            <p
              className="text-[#f0ebe0]/55 text-sm leading-relaxed mb-6 max-w-[480px]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {b.theme}
            </p>
          )}
          <div className="flex items-center gap-5 flex-wrap">
            {b.bounty_pool_summary && (
              <div className="flex items-center gap-2">
                <Trophy size={11} style={{ color: "#d6cfc0", opacity: 0.6 }} />
                <span
                  className="text-[11px] text-[#f0ebe0]/50"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {b.bounty_pool_summary.slice(0, 40)}
                  {b.bounty_pool_summary.length > 40 ? "…" : ""}
                </span>
              </div>
            )}
            {(b.problem_statements?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <Zap size={11} style={{ color: "#d6cfc0", opacity: 0.6 }} />
                <span
                  className="text-[11px] text-[#f0ebe0]/50"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {b.problem_statements.length} challenge
                  {b.problem_statements.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {b.timeline && (
              <div className="flex items-center gap-2">
                <Calendar
                  size={11}
                  style={{ color: "#d6cfc0", opacity: 0.6 }}
                />
                <span
                  className="text-[11px] text-[#f0ebe0]/50"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {b.timeline.slice(0, 50)}
                  {b.timeline.length > 50 ? "…" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Open Now row card ──────────────────────────────────────────── */
function OngoingRow({ b }: { b: StoredBooster & { _type: BoosterType } }) {
  return (
    <Link
      href={`/boosters/${b._type}/${b.id}`}
      className="no-underline group block"
    >
      <div
        className="rounded-2xl px-8 py-6 flex items-center gap-6 transition-all duration-200 group-hover:scale-[1.01]"
        style={{ backgroundColor: "#d6cfc0" }}
      >
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#4caf7d" }}
          />
          <span
            className="w-px"
            style={{ backgroundColor: "rgba(45,74,62,0.12)", minHeight: 20 }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <StatusPill status="ongoing" />
            <span
              className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/40"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {TYPE_LABELS[b._type].nav}
            </span>
          </div>
          <p
            className="font-black text-[#2d4a3e] uppercase leading-tight"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(16px, 2vw, 22px)",
              letterSpacing: "-0.02em",
            }}
          >
            {b.name}
          </p>
          {b.theme && (
            <p
              className="text-[#2d4a3e]/55 text-sm mt-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {b.theme.slice(0, 100)}
              {b.theme.length > 100 ? "…" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6 shrink-0">
          {b.bounty_pool_summary && (
            <div className="text-right">
              <p
                className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/35 mb-0.5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Prize
              </p>
              <p
                className="text-sm font-semibold text-[#2d4a3e]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {b.bounty_pool_summary.slice(0, 30)}
              </p>
            </div>
          )}
          {b.timeline && (
            <div className="text-right">
              <p
                className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/35 mb-0.5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Deadline
              </p>
              <p
                className="text-sm text-[#2d4a3e]/70"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {b.timeline.slice(0, 24)}
              </p>
            </div>
          )}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#2d4a3e" }}
          >
            <ArrowUpRight size={15} style={{ color: "#f0ebe0" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Grid card (upcoming / past) ────────────────────────────────── */
function GridCard({
  b,
  status,
}: {
  b: StoredBooster & { _type: BoosterType };
  status: EventStatus;
}) {
  const isPast = status === "past";
  return (
    <Link
      href={`/boosters/${b._type}/${b.id}`}
      className="no-underline group block"
    >
      <div
        className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.015]"
        style={{
          backgroundColor: isPast ? "#f5f2ea" : "#d6cfc0",
          minHeight: 200,
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <StatusPill status={status} />
          <span
            className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all group-hover:scale-105"
            style={{
              backgroundColor: isPast ? "rgba(45,74,62,0.1)" : "#2d4a3e",
            }}
          >
            <ArrowUpRight
              size={13}
              style={{ color: isPast ? "rgba(45,74,62,0.4)" : "#f0ebe0" }}
            />
          </span>
        </div>
        <div>
          <p
            className="text-[9px] tracking-[0.15em] uppercase font-bold mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: isPast ? "rgba(45,74,62,0.35)" : "rgba(45,74,62,0.5)",
            }}
          >
            {TYPE_LABELS[b._type].nav}
          </p>
          <h3
            className="font-black uppercase leading-tight mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(14px, 1.8vw, 18px)",
              letterSpacing: "-0.02em",
              color: isPast ? "rgba(45,74,62,0.5)" : "#2d4a3e",
            }}
          >
            {b.name}
          </h3>
          {b.theme && (
            <p
              className="text-xs leading-relaxed mb-3"
              style={{
                fontFamily: "Georgia, serif",
                color: isPast ? "rgba(45,74,62,0.35)" : "rgba(45,74,62,0.6)",
              }}
            >
              {b.theme.slice(0, 80)}
              {b.theme.length > 80 ? "…" : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {b.bounty_pool_summary && (
              <span
                className="text-[8px] tracking-[0.1em] uppercase font-bold px-2.5 py-1 rounded-sm"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: isPast ? "rgba(45,74,62,0.35)" : "#2d4a3e",
                }}
              >
                Prize pool
              </span>
            )}
            {(b.problem_statements?.length ?? 0) > 0 && (
              <span
                className="text-[8px] tracking-[0.1em] uppercase font-bold px-2.5 py-1 rounded-sm"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: isPast ? "rgba(45,74,62,0.35)" : "#2d4a3e",
                }}
              >
                {b.problem_statements.length} challenges
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export function BoosterDemo({ boosters }: { boosters: StoredBooster[] }) {
  const allBoosters = useMemo(
    () =>
      boosters.map((b) => ({
        ...b,
        _type: (b.booster_type ?? "idea") as BoosterType,
      })),
    [boosters],
  );

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<BoosterType | "all">("all");

  const filtered = useMemo(() => {
    let list = allBoosters;
    if (activeFilter !== "all")
      list = list.filter((b) => b._type === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.theme ?? "").toLowerCase().includes(q) ||
          (b.program_goal ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [allBoosters, activeFilter, search]);

  const withStatus = useMemo(
    () =>
      filtered.map((b, idx) => ({
        ...b,
        _status: deriveStatus(b, idx) as EventStatus,
      })),
    [filtered],
  );

  const featured = withStatus.filter((b) => b._status === "featured");
  const ongoing = withStatus.filter((b) => b._status === "ongoing");
  const upcoming = withStatus.filter((b) => b._status === "upcoming");
  const past = withStatus.filter((b) => b._status === "past");
  const isEmpty = withStatus.length === 0;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-10 py-5 flex items-center justify-between gap-6"
        style={{
          backgroundColor: "#f0ebe0",
          borderBottom: "1px solid rgba(45,74,62,0.1)",
        }}
      >
        <Link
          href="/boosters"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline shrink-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Opportunities
        </Link>

        {/* Type filter pills */}
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ backgroundColor: "rgba(45,74,62,0.07)" }}
        >
          {(["all", ...TYPES] as const).map((t) => {
            const isActive = activeFilter === t;
            const label =
              t === "all" ? "All" : TYPE_LABELS[t as BoosterType].nav;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveFilter(t)}
                className="rounded-full border-none cursor-pointer text-[9px] tracking-[0.12em] uppercase font-bold transition-all duration-200"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  padding: "8px 14px",
                  backgroundColor: isActive ? "#2d4a3e" : "transparent",
                  color: isActive ? "#f0ebe0" : "rgba(45,74,62,0.5)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2.5 flex-1 max-w-xs"
          style={{ backgroundColor: "rgba(45,74,62,0.07)" }}
        >
          <Search size={12} style={{ color: "rgba(45,74,62,0.4)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className="bg-transparent border-none outline-none text-[11px] text-[#2d4a3e] placeholder-[#2d4a3e]/35 w-full"
            style={{ fontFamily: "Georgia, serif" }}
          />
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="mb-14 flex items-start justify-between gap-8">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(52px, 9vw, 138px)",
              letterSpacing: "-0.025em",
            }}
          >
            OPEN
            <br />
            CALLS.
          </h1>

          <div className="flex gap-3 shrink-0 mt-2">
            {[
              {
                label: "Open Now",
                value: ongoing.length,
                bg: "#2d4a3e",
                fg: "#f0ebe0",
                fgMid: "rgba(240,235,224,0.5)",
              },
              {
                label: "Upcoming",
                value: upcoming.length,
                bg: "#d6cfc0",
                fg: "#2d4a3e",
                fgMid: "rgba(45,74,62,0.45)",
              },
              {
                label: "Total",
                value: withStatus.length,
                bg: "#f5f2ea",
                fg: "#2d4a3e",
                fgMid: "rgba(45,74,62,0.45)",
              },
            ].map(({ label, value, bg, fg, fgMid }) => (
              <div
                key={label}
                className="rounded-2xl px-5 py-5 text-center"
                style={{ backgroundColor: bg, minWidth: 90 }}
              >
                <p
                  className="font-black leading-none mb-1"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 28,
                    letterSpacing: "-0.03em",
                    color: fg,
                  }}
                >
                  {value}
                </p>
                <p
                  className="text-[8px] tracking-[0.14em] uppercase font-bold"
                  style={{ fontFamily: "'Inter', sans-serif", color: fgMid }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p
          className="text-[#2d4a3e]/55 mb-14 max-w-[480px] leading-relaxed"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(14px, 1.4vw, 17px)",
          }}
        >
          Hackathons, grants, and build programs — browse by status or search by
          topic.
        </p>

        {/* Empty */}
        {isEmpty && (
          <div
            className="py-24 text-center rounded-3xl"
            style={{ backgroundColor: "#f5f2ea" }}
          >
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{
                backgroundColor: "rgba(45,74,62,0.08)",
                color: "#2d4a3e",
              }}
            >
              <Search size={24} />
            </div>
            <p
              className="font-black text-[#2d4a3e] uppercase mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(18px, 2.5vw, 28px)",
                letterSpacing: "-0.02em",
              }}
            >
              {search ? "No results found." : "No opportunities yet."}
            </p>
            <p
              className="text-[#2d4a3e]/50 text-sm"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {search
                ? "Try a different search term."
                : "Check back soon — hosts are adding programs."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 inline-flex items-center gap-2 rounded-full border-none cursor-pointer text-[#f0ebe0] text-[9px] tracking-widest uppercase font-bold px-6 py-3"
                style={{
                  backgroundColor: "#2d4a3e",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {!isEmpty && (
          <div className="flex flex-col gap-14">
            {/* FEATURED */}
            {featured.length > 0 && (
              <section>
                <SectionHead label="Featured." />
                <div
                  className={`grid gap-4 ${featured.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {featured.map((b) => (
                    <FeaturedCard key={b.id} b={b} />
                  ))}
                </div>
              </section>
            )}

            {/* OPEN NOW */}
            {ongoing.length > 0 && (
              <section>
                <SectionHead label="Open Now." count={ongoing.length} />
                <div className="flex flex-col gap-4">
                  {ongoing.map((b) => (
                    <OngoingRow key={b.id} b={b} />
                  ))}
                </div>
              </section>
            )}

            {/* UPCOMING */}
            {upcoming.length > 0 && (
              <section>
                <SectionHead label="Upcoming." count={upcoming.length} />
                <div className="grid grid-cols-3 gap-4">
                  {upcoming.map((b) => (
                    <GridCard key={b.id} b={b} status="upcoming" />
                  ))}
                </div>
              </section>
            )}

            {/* PAST */}
            {past.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: "rgba(45,74,62,0.12)" }}
                  />
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/30"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Past Programs
                  </p>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: "rgba(45,74,62,0.12)" }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {past.map((b) => (
                    <GridCard key={b.id} b={b} status="past" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            [
              "OPEN CALLS",
              "★",
              "BUILD & SHIP",
              "★",
              "GRANTS & PRIZES",
              "★",
              "HACKATHONS",
              "★",
            ].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)",
                }}
              >
                {t}
              </span>
            )),
          )}
        </div>
      </div>

      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </main>
  );
}
