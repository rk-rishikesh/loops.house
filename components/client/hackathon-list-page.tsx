"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy, Zap, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMounted } from "@/hooks/use-is-mounted";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";
const MONO = "'SF Mono','Fira Code','Consolas',monospace";

type EventStatus = "ongoing" | "upcoming" | "past";
type TabId = "ongoing" | "upcoming" | "past";

type Hackathon = {
  id: string;
  name: string;
  theme?: string;
  bounty_pool_summary?: string;
  problem_statements: string[];
  start_date?: string;
  submission_deadline?: string;
  judging_deadline?: string;
  results_date?: string;
};

const TERMINAL_LINES = [
  "> initializing hackathon_agent...",
  "> scanning submissions...",
  "> indexing challenges...",
  "> preparing judging pipeline...",
  "> ready. explore hackathons.",
];

const TAGLINE = "Discover hackathons, build projects, and compete for prizes";

function TerminalTypewriter({ lines }: { lines: string[] }) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 520);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    if (currentLine >= lines.length) return;
    const line = lines[currentLine];
    if (currentChar < line.length) {
      const speed = line[currentChar] === "." ? 120 : 28 + Math.random() * 22;
      const t = setTimeout(() => setCurrentChar((c) => c + 1), speed);
      return () => clearTimeout(t);
    }
    const pause = setTimeout(() => {
      setDisplayedLines((prev) => [...prev, line]);
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
    }, 350);
    return () => clearTimeout(pause);
  }, [currentLine, currentChar, lines]);

  const typing = currentLine < lines.length ? lines[currentLine].slice(0, currentChar) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="px-1 py-1 overflow-hidden"
    >
      <div className="flex items-center gap-1.5 mb-3">
        {["rgba(15,44,35,0.15)", "rgba(15,44,35,0.1)", "rgba(15,44,35,0.1)"].map((c, i) => (
          <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-2 text-[8px] tracking-[0.14em] uppercase font-bold" style={{ fontFamily: PX, color: "rgba(15,44,35,0.25)" }}>
          terminal
        </span>
      </div>
      <div className="flex flex-col gap-0.5" style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.7 }}>
        <AnimatePresence>
          {displayedLines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="m-0"
              style={{ color: line.includes("ready") || line.includes("online") ? "#0F2C23" : "rgba(15,44,35,0.45)" }}
            >
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
        {typing !== null && (
          <p className="m-0" style={{ color: "rgba(15,44,35,0.55)" }}>
            {typing}
            <span style={{ opacity: cursorVisible ? 1 : 0, color: "#0F2C23", fontWeight: 700 }}>▋</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}

const TAB_CONFIG: { id: TabId; label: string }[] = [
  { id: "ongoing",  label: "Open Now" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past",     label: "Past" },
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
    return "past";
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

        <div
          className="flex items-center justify-between px-9 py-5"
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[9px] tracking-[0.16em] uppercase font-bold"
            style={{ fontFamily: PX, backgroundColor: "#E2FEA5", color: "#0F2C23" }}
          >
            View program <ArrowUpRight size={11} />
          </span>
        </div>

        <div className="px-9 pb-9 flex items-end justify-between gap-10">
          <div className="flex-1 min-w-0">
            <h2
              className="font-black text-[#E2FEA5] uppercase leading-[0.88]"
              style={{
                fontFamily: PX,
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

          <div className="flex flex-col justify-center gap-2 shrink-0 uppercase" style={{ minWidth: 180 }}>
            {b.problem_statements.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-xl px-3.5 py-5"
                style={{ backgroundColor: "#3C574B" }}
              >
                <Zap size={11} style={{ color: "#f0c060", flexShrink: 0 }} />
                <span className="text-[11px]" style={{ fontFamily: PX, color: "rgba(226,254,165,0.7)" }}>
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
                <span className="text-[11px] truncate" style={{ fontFamily: PX, color: "rgba(226,254,165,0.7)" }}>
                  {String(b.bounty_pool_summary).slice(0, 32)}
                </span>
              </div>
            )}
            {b.submission_deadline && (
              <div
                className="flex items-center gap-3 rounded-xl px-3.5 py-5"
                style={{ backgroundColor: "#3C574B" }}
              >
                <Clock size={11} style={{ color: "#E2FEA5", flexShrink: 0 }} />
                <span className="text-[11px] truncate" style={{ fontFamily: PX, color: "rgba(226,254,165,0.7)" }}>
                  Due {b.submission_deadline}
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
  const dotColor = isPast ? "rgba(15,44,35,0.2)" : isUpcoming ? "#f0c060" : "#4caf7d";

  return (
    <Link href={`/hackathons/${b.id}`} className="no-underline block h-full group">
      <div
        className={`h-full rounded-2xl p-6 flex flex-col transition-all duration-200 ${!isPast ? "group-hover:scale-[1.01]" : ""}`}
        style={{ backgroundColor: bg, minHeight: 200, opacity: isPast ? 0.6 : 1 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
            <span
              className="text-[8px] tracking-[0.18em] uppercase font-bold"
              style={{ fontFamily: PX, color: fgSub }}
            >
              {statusLabel}
            </span>
          </div>
          <span
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: isPast ? "rgba(15,44,35,0.06)" : "#0F2C23" }}
          >
            <ArrowUpRight size={12} style={{ color: isPast ? "rgba(15,44,35,0.25)" : "#E2FEA5" }} />
          </span>
        </div>

        <h3
          className="font-black uppercase leading-[1.1] mb-2 flex-1"
          style={{
            fontFamily: PX,
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
            {b.theme.length > 72 ? b.theme.slice(0, 72) + "..." : b.theme}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {b.problem_statements.length > 0 && (
            <span
              className="text-[8px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-sm"
              style={{ fontFamily: PX, backgroundColor: isPast ? "rgba(15,44,35,0.06)" : "rgba(15,44,35,0.08)", color: fgSub }}
            >
              {b.problem_statements.length} challenge{b.problem_statements.length !== 1 ? "s" : ""}
            </span>
          )}
          {b.bounty_pool_summary && (
            <span
              className="text-[8px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-sm"
              style={{ fontFamily: PX, backgroundColor: isPast ? "rgba(15,44,35,0.06)" : "rgba(15,44,35,0.08)", color: fgSub }}
            >
              Prize pool
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function HackathonListPage({
  list,
}: {
  list: Hackathon[];
}) {
  const mounted = useIsMounted();
  const withStatus = list.map((h, idx) => ({ ...h, _status: deriveStatus(h, idx) as EventStatus }));

  const featured = withStatus[0] ?? null;

  const bucketed: Record<TabId, typeof withStatus> = {
    ongoing:  withStatus.filter(h => h._status === "ongoing"),
    upcoming: withStatus.filter(h => h._status === "upcoming"),
    past:     withStatus.filter(h => h._status === "past"),
  };
  if (featured && !bucketed.ongoing.find(h => h.id === featured.id)) {
    bucketed.ongoing = [featured, ...bucketed.ongoing];
  }

  const counts: Record<TabId, number> = {
    ongoing:  bucketed.ongoing.length,
    upcoming: bucketed.upcoming.length,
    past:     bucketed.past.length,
  };

  const [activeTab, setActiveTab] = useState<TabId>("ongoing");
  const tabItems = bucketed[activeTab];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>

      <div
        className="px-10 pt-10 pb-24 transition-all duration-500 ease-out"
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
              style={{ fontFamily: FN, fontSize: "clamp(14px, 1.4vw, 17px)", color: "rgba(15,44,35,0.55)" }}
            >
              {TAGLINE}
            </motion.p>
          </div>
          <div className="w-[320px] shrink-0">
            <TerminalTypewriter lines={TERMINAL_LINES} />
          </div>
        </div>

        {/* ── Empty state ── */}
        {list.length === 0 && (
          <div
            className="rounded-3xl p-16 text-center"
            style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
          >
            <Zap size={24} style={{ color: "#0F2C23", opacity: 0.3, margin: "0 auto 16px", display: "block" }} />
            <p
              className="font-black uppercase mb-2"
              style={{ fontFamily: PX, fontSize: 18, letterSpacing: "-0.02em", color: "rgba(15,44,35,0.45)" }}
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
            <div
              className="flex items-center border-t border-b py-4"
              style={{
                borderColor: "rgba(15,44,35,0.12)",
                backgroundColor: "#F8FFE8",
              }}
            >
              {TAB_CONFIG.map(tab => {
                const on = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 border-none cursor-pointer bg-transparent py-0 flex items-center justify-center gap-2 transition-colors"
                    style={{
                      fontFamily: PX,
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: on ? "rgba(15,44,35,0.7)" : "rgba(15,44,35,0.4)",
                    }}
                  >
                    {tab.label}
                    <span style={{ opacity: 0.6 }}>({counts[tab.id]})</span>
                  </button>
                );
              })}
            </div>

            {/* ── Grid ── */}
            {tabItems.length > 0 ? (
              <div className="grid gap-4 mt-8" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {tabItems.map(h => (
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
                  No {activeTab} programs
                </p>
                <p className="text-sm" style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}>
                  Check back soon or explore another tab.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
