import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Trophy, Zap, FileText, Clock } from "lucide-react";
import { getBoostersServer } from "@/lib/server-data";
import type { BoosterType } from "@/lib/data-mappers";

/* ─── Config ─────────────────────────────────────────────────────── */
const TYPES: BoosterType[] = ["idea", "momentum", "capital"];

const TYPE_META: Record<BoosterType, { nav: string; tagline: string; index: string }> = {
  idea: { nav: "Early Stage", tagline: "Validate before you build", index: "01" },
  momentum: { nav: "Build Phase", tagline: "Ship with conviction", index: "02" },
  capital: { nav: "Scale Up", tagline: "Funding & growth programs", index: "03" },
};

/* ─── Status helper (server-safe, no hooks) ──────────────────────── */
type EventStatus = "featured" | "ongoing" | "upcoming" | "past";

function deriveStatus(timeline: string | undefined, idx: number): EventStatus {
  const tl = (timeline ?? "").toLowerCase();
  if (tl.includes("past") || tl.includes("ended") || tl.includes("closed")) return "past";
  if (tl.includes("upcoming") || tl.includes("soon") || tl.includes("launch")) return "upcoming";
  if (tl.includes("ongoing") || tl.includes("open") || tl.includes("now")) return "ongoing";
  if (idx === 0) return "featured";
  if (idx % 3 === 1) return "ongoing";
  if (idx % 3 === 2) return "upcoming";
  return "past";
}

const STATUS_META: Record<EventStatus, { label: string; dot: string; bg: string; text: string }> = {
  featured: { label: "Featured", dot: "#2d4a3e", bg: "#2d4a3e", text: "#f0ebe0" },
  ongoing: { label: "Open Now", dot: "#4caf7d", bg: "rgba(76,175,125,0.12)", text: "#2d7a50" },
  upcoming: { label: "Upcoming", dot: "#d6a84a", bg: "rgba(214,168,74,0.12)", text: "#8a6a1a" },
  past: { label: "Ended", dot: "rgba(45,74,62,0.25)", bg: "rgba(45,74,62,0.06)", text: "rgba(45,74,62,0.45)" },
};

/* ─── Server components ──────────────────────────────────────────── */

function StatusPill({ status }: { status: EventStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.14em] uppercase font-bold px-3 py-1.5 rounded-full shrink-0"
      style={{ fontFamily: "'Inter', sans-serif", backgroundColor: m.bg, color: m.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  );
}

/* Featured hero card */
function FeaturedCard({
  b, type,
}: {
  b: { id: string; name: string; theme?: string; bounty_pool_summary?: string; problem_statements: string[]; timeline?: string };
  type: BoosterType;
}) {
  return (
    <Link href={`/boosters/${type}/${b.id}`} className="no-underline group block">
      <div
        className="rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group-hover:scale-[1.01] relative overflow-hidden"
        style={{ backgroundColor: "#2d4a3e", minHeight: 300 }}
      >
        {/* Watermark */}
        <span
          className="absolute right-4 bottom-0 select-none pointer-events-none font-black text-[#f0ebe0]/04"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(100px, 15vw, 200px)", letterSpacing: "-0.05em", lineHeight: 0.85 }}
        >
          ★
        </span>

        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <StatusPill status="featured" />
          <span
            className="w-12 h-12 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "#d6cfc0" }}
          >
            <ArrowUpRight size={18} style={{ color: "#2d4a3e" }} />
          </span>
        </div>

        {/* Body */}
        <div className="mt-10 relative z-10">
          <h2
            className="font-black text-[#f0ebe0] uppercase leading-[0.88] mb-4"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(26px, 4vw, 48px)",
              letterSpacing: "-0.025em",
            }}
          >
            {b.name}
          </h2>
          {b.theme && (
            <p className="text-[#f0ebe0]/55 text-sm leading-relaxed mb-6 max-w-[500px]"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
              {b.theme}
            </p>
          )}
          <div className="flex items-center gap-5 flex-wrap">
            {b.bounty_pool_summary && (
              <div className="flex items-center gap-2">
                <Trophy size={11} style={{ color: "#d6cfc0", opacity: 0.6 }} />
                <span className="text-[11px] text-[#f0ebe0]/50" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                  {b.bounty_pool_summary.slice(0, 40)}{b.bounty_pool_summary.length > 40 ? "…" : ""}
                </span>
              </div>
            )}
            {b.problem_statements.length > 0 && (
              <div className="flex items-center gap-2">
                <Zap size={11} style={{ color: "#d6cfc0", opacity: 0.6 }} />
                <span className="text-[11px] text-[#f0ebe0]/50" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                  {b.problem_statements.length} challenge{b.problem_statements.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {b.timeline && (
              <div className="flex items-center gap-2">
                <Clock size={11} style={{ color: "#d6cfc0", opacity: 0.6 }} />
                <span className="text-[11px] text-[#f0ebe0]/50" style={{ fontFamily: "Georgia, serif" }}>
                  {b.timeline.slice(0, 50)}{b.timeline.length > 50 ? "…" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Ongoing row */
function OngoingRow({
  b, type,
}: {
  b: { id: string; name: string; theme?: string; bounty_pool_summary?: string; timeline?: string };
  type: BoosterType;
}) {
  return (
    <Link href={`/boosters/${type}/${b.id}`} className="no-underline group block">
      <div
        className="rounded-2xl px-8 py-6 flex items-center gap-6 transition-all duration-200 group-hover:scale-[1.01]"
        style={{ backgroundColor: "#d6cfc0" }}
      >
        {/* Live dot */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4caf7d" }} />
          <span className="w-px" style={{ backgroundColor: "rgba(45,74,62,0.12)", minHeight: 20 }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <StatusPill status="ongoing" />
            <span
              className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/40"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {TYPE_META[type].nav}
            </span>
          </div>
          <p
            className="font-black text-[#2d4a3e] uppercase leading-tight"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(15px, 2vw, 21px)", letterSpacing: "-0.02em" }}
          >
            {b.name}
          </p>
          {b.theme && (
            <p className="text-[#2d4a3e]/55 text-sm mt-1" style={{ fontFamily: "Georgia, serif" }}>
              {b.theme.slice(0, 100)}{b.theme.length > 100 ? "…" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {b.bounty_pool_summary && (
            <div className="text-right">
              <p className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/35 mb-0.5"
                style={{ fontFamily: "'Inter', sans-serif" }}>Prize</p>
              <p className="text-sm font-semibold text-[#2d4a3e]" style={{ fontFamily: "Georgia, serif" }}>
                {b.bounty_pool_summary.slice(0, 28)}
              </p>
            </div>
          )}
          {b.timeline && (
            <div className="text-right">
              <p className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/35 mb-0.5"
                style={{ fontFamily: "'Inter', sans-serif" }}>Deadline</p>
              <p className="text-sm text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
                {b.timeline.slice(0, 22)}
              </p>
            </div>
          )}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#2d4a3e" }}>
            <ArrowUpRight size={15} style={{ color: "#f0ebe0" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Grid card — upcoming or past */
function GridCard({
  b, type, status,
}: {
  b: { id: string; name: string; theme?: string; bounty_pool_summary?: string; problem_statements: string[] };
  type: BoosterType;
  status: EventStatus;
}) {
  const isPast = status === "past";
  return (
    <Link href={`/boosters/${type}/${b.id}`} className="no-underline group block">
      <div
        className="rounded-2xl p-6 flex flex-col justify-between h-full transition-all duration-200 group-hover:scale-[1.015]"
        style={{ backgroundColor: isPast ? "#f5f2ea" : "#d6cfc0", minHeight: 196 }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <StatusPill status={status} />
          <span
            className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: isPast ? "rgba(45,74,62,0.1)" : "#2d4a3e" }}
          >
            <ArrowUpRight size={13} style={{ color: isPast ? "rgba(45,74,62,0.4)" : "#f0ebe0" }} />
          </span>
        </div>
        <div>
          <p
            className="text-[9px] tracking-[0.15em] uppercase font-bold mb-2"
            style={{ fontFamily: "'Inter', sans-serif", color: isPast ? "rgba(45,74,62,0.35)" : "rgba(45,74,62,0.5)" }}
          >
            {TYPE_META[type].nav}
          </p>
          <h3
            className="font-black uppercase leading-tight mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(13px, 1.6vw, 17px)",
              letterSpacing: "-0.02em",
              color: isPast ? "rgba(45,74,62,0.5)" : "#2d4a3e",
            }}
          >
            {b.name}
          </h3>
          {b.theme && (
            <p className="text-xs leading-relaxed mb-3"
              style={{ fontFamily: "Georgia, serif", color: isPast ? "rgba(45,74,62,0.35)" : "rgba(45,74,62,0.6)" }}>
              {b.theme.slice(0, 72)}{b.theme.length > 72 ? "…" : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {b.bounty_pool_summary && (
              <span className="text-[8px] tracking-[0.1em] uppercase font-bold px-2.5 py-1 rounded-sm"
                style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "rgba(45,74,62,0.08)", color: isPast ? "rgba(45,74,62,0.35)" : "#2d4a3e" }}>
                Prize pool
              </span>
            )}
            {b.problem_statements.length > 0 && (
              <span className="text-[8px] tracking-[0.1em] uppercase font-bold px-2.5 py-1 rounded-sm"
                style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "rgba(45,74,62,0.08)", color: isPast ? "rgba(45,74,62,0.35)" : "#2d4a3e" }}>
                {b.problem_statements.length} challenges
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Section heading */
function SectionHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <h2
        className="font-black text-[#2d4a3e] uppercase"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(20px, 2.8vw, 34px)", letterSpacing: "-0.02em" }}
      >
        {label}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/30"
          style={{ fontFamily: "'Inter', sans-serif" }}>
          {count}
        </span>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default async function BoosterTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  const type = rawType?.toLowerCase() || "idea";
  const validType = TYPES.includes(type as BoosterType) ? (type as BoosterType) : "idea";
  const list = await getBoostersServer(validType);
  const meta = TYPE_META[validType];

  /* Bucket by status */
  const withStatus = list.map((b, idx) => ({ ...b, _status: deriveStatus(b.timeline, idx) }));
  const featured = withStatus.filter((b) => b._status === "featured");
  const ongoing = withStatus.filter((b) => b._status === "ongoing");
  const upcoming = withStatus.filter((b) => b._status === "upcoming");
  const past = withStatus.filter((b) => b._status === "past");

  // "Open Now" should include both featured and ongoing programs
  const openNow = withStatus.filter(
    (b) => b._status === "featured" || b._status === "ongoing",
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="pt-0">
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Link
            href="/boosters"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Boosters</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-end px-10">
            <span>
              {validType.charAt(0).toUpperCase() + validType.slice(1)} boosters
            </span>
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {list.length === 0 && (
          <div className="py-24 text-center rounded-3xl" style={{ backgroundColor: "#f5f2ea" }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}>
              <Zap size={24} />
            </div>
            <p className="font-black text-[#2d4a3e] uppercase mb-3"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "-0.02em" }}>
              No open calls yet.
            </p>
            <p className="text-[#2d4a3e]/50 text-sm mb-8" style={{ fontFamily: "Georgia, serif" }}>
              Hosts are adding programs — check back soon.
            </p>
            <Link
              href="/boosters"
              className="inline-flex items-center gap-2 no-underline rounded-full text-[#f0ebe0] text-[9px] tracking-widest uppercase font-bold px-6 py-3"
              style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
            >
              <ArrowLeft size={10} /> All categories
            </Link>
          </div>
        )}

        {/* ── Content sections ─────────────────────────────────────────── */}
        {list.length > 0 && (
          <div className="flex flex-col gap-14">

            {/* FEATURED */}
            {featured.length > 0 && (
              <section>
                <div className={`grid gap-4 ${featured.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {featured.map((b) => (
                    <FeaturedCard key={b.id} b={b} type={validType} />
                  ))}
                </div>
              </section>
            )}

            {/* OPEN NOW (includes featured + ongoing) */}
            {openNow.length > 0 && (
              <section>
                <SectionHead label="Open Now." count={openNow.length} />
                <div className="flex flex-col gap-4">
                  {openNow.map((b) => (
                    <OngoingRow key={b.id} b={b} type={validType} />
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
                    <GridCard key={b.id} b={b} type={validType} status="upcoming" />
                  ))}
                </div>
              </section>
            )}

            {/* PAST */}
            {past.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(45,74,62,0.12)" }} />
                  <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/30"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    Past Programs
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(45,74,62,0.12)" }} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {past.map((b) => (
                    <GridCard key={b.id} b={b} type={validType} status="past" />
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
            ["OPEN CALLS", "★", "BUILD & SHIP", "★", "GRANTS & PRIZES", "★", "HACKATHONS", "★"].map((t, i) => (
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
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
      `}</style>
    </main>
  );
}