"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, Lightbulb, Zap, DollarSign, Sparkles } from "lucide-react";
import { useBoosters } from "@/lib/queries";
import type { BoosterType } from "@/lib/storage";
import Image from "next/image";

const TYPES: BoosterType[] = ["idea", "momentum", "capital"];

const TYPE_META: Record<BoosterType, {
  label: string;
  sublabel: string;
  tagline: string;
  icon: React.ElementType;
  index: string;
}> = {
  idea: {
    label: "IDEA",
    sublabel: "BOOSTERS",
    tagline: "Validate before you scale.",
    icon: Lightbulb,
    index: "01",
  },
  momentum: {
    label: "MOMENTUM",
    sublabel: "BOOSTERS",
    tagline: "Ship with conviction.",
    icon: Zap,
    index: "02",
  },
  capital: {
    label: "CAPITAL",
    sublabel: "BOOSTERS",
    tagline: "Build for the long term.",
    icon: DollarSign,
    index: "03",
  },
};

function ArrowCircle({ size = 48 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-[#2d4a3e] text-[#f0ebe0] shrink-0"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl px-8 py-7 flex items-center gap-6 animate-pulse"
      style={{ backgroundColor: "#d6cfc0" }}
    >
      <div className="w-14 h-10 rounded bg-[#2d4a3e]/10" />
      <div>
        <div className="w-40 h-3 rounded bg-[#2d4a3e]/10 mb-2" />
        <div className="w-24 h-2.5 rounded bg-[#2d4a3e]/07" />
      </div>
    </div>
  );
}

export default function BoosterTypePage() {
  const params = useParams();
  const type = (params.type as string)?.toLowerCase() || "idea";
  const validType = TYPES.includes(type as BoosterType) ? (type as BoosterType) : "idea";
  const { data: list = [], isLoading: loading } = useBoosters(validType);
  const meta = TYPE_META[validType];
  const TypeIcon = meta.icon;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <div className="px-10 pt-8 flex items-center justify-between">
        <Link
          href="/boosters"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Hub
        </Link>
        {/* User avatar placeholder — bottom-left in image but nav works too */}
      </div>

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div className="flex gap-6 px-10 pt-10 pb-20 min-h-[calc(100vh-60px)] items-start">

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div className="flex flex-col flex-1 min-w-0 basis-[480px]">

          {/* Big stacked heading */}
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] mb-12 uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(56px, 8.5vw, 120px)",
              letterSpacing: "-0.02em",
            }}
          >
            {meta.label}
            <br />
            {meta.sublabel}
          </h1>

          {/* Booster cards */}
          <div className="flex flex-col gap-4 max-w-[580px]">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : list.length === 0 ? (
              <div
                className="rounded-2xl p-10 border-2 border-dashed border-[#2d4a3e]/20 text-center"
                style={{ backgroundColor: "#e8e2d4" }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ backgroundColor: "rgba(45,74,62,0.1)" }}
                >
                  <TypeIcon size={20} style={{ color: "#2d4a3e" }} />
                </div>
                <p
                  className="font-bold text-[#2d4a3e] mb-2"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}
                >
                  No boosters yet.
                </p>
                <p
                  className="text-sm text-[#2d4a3e]/55 mb-8 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Hosts can add boosters from the Host dashboard.
                </p>
                <Link
                  href="/boosters"
                  className="inline-flex items-center gap-2 rounded-full no-underline text-[#f0ebe0] text-[10px] tracking-widest uppercase font-bold px-6 py-3"
                  style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
                >
                  <ArrowLeft size={11} /> All Boosters
                </Link>
              </div>
            ) : (
              list.map((b, idx) => (
                <Link
                  key={b.id}
                  href={`/boosters/${validType}/${b.id}`}
                  className="no-underline group"
                >
                  <div
                    className="rounded-2xl px-8 py-7 flex items-center gap-7 transition-transform duration-200 group-hover:scale-[1.015]"
                    style={{ backgroundColor: "#d6cfc0" }}
                  >
                    {/* Index */}
                    <span
                      className="font-black text-[#2d4a3e] leading-none shrink-0"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(36px, 5vw, 56px)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Name + theme */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-[#2d4a3e] uppercase tracking-[0.15em] mb-1 truncate"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "clamp(10px, 1.2vw, 13px)",
                        }}
                      >
                        {b.name}
                      </p>
                      {b.theme && (
                        <p
                          className="text-[#2d4a3e]/50 text-xs"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {b.theme}
                        </p>
                      )}
                      {b.problem_statements?.length > 0 && (
                        <p
                          className="inline-flex items-center gap-1 text-[11px] text-[#2d4a3e]/40 mt-1"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          <FileText size={10} />
                          {b.problem_statements.length} problem statement{b.problem_statements.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Bottom-left avatar (as seen in image) */}
          <div className="mt-auto pt-16">
            <div
              className="w-10 h-10 rounded-full bg-[#2d4a3e] flex items-center justify-center text-[#f0ebe0] text-xs font-bold"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              N
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN — large poster card ════════════════════════════════ */}
        <div
          className="shrink-0 sticky top-10"
          style={{ width: "clamp(320px, 42vw, 620px)" }}
        >
          <div
            className="relative w-full rounded-3xl overflow-hidden"
            style={{
              aspectRatio: "3/4",
              backgroundColor: "#d6cfc0",
            }}
          >
            {/* Arrow circle — top right */}
            <div className="absolute top-5 right-5 z-10">
              <ArrowCircle size={52} />
            </div>

            {/* Large faint index watermark */}
            <span
              className="absolute inset-0 flex items-center justify-center select-none pointer-events-none font-black text-[#2d4a3e]/05"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(160px, 22vw, 320px)",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              {meta.index}
            </span>

            {/* Bottom labels */}
            <div className="absolute bottom-8 left-8 z-10">
              <p
                className="text-[10px] tracking-[0.22em] uppercase font-bold text-[#2d4a3e]/60 mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {meta.label} {meta.sublabel.slice(0, -1)}
              </p>
              <p
                className="text-[11px] text-[#2d4a3e]/40"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {loading ? "…" : `${list.length} booster${list.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            ["VALIDATE BEFORE YOU SCALE", "★", "SHIP WITH CONVICTION", "★", "BUILD FOR THE LONG TERM", "★"].map(
              (t, i) => (
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
              )
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%  { transform: translateX(0); }
          100%{ transform: translateX(-33.333%); }
        }
      `}</style>
    </main>
  );
}