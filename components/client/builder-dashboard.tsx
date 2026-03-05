"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Zap, ArrowLeft } from "lucide-react";
import type { StoredBooster, BoosterType } from "@/lib/data-mappers";
import { LogoutButton } from "@/components/logout-button";
import { useIsMounted } from "@/hooks/use-is-mounted";

/* ─── Primary feature card ───────────────────────────────────────── */
function FeatureCard({
  href, label, sublabel, description, dark = false, wide = false,
}: {
  href: string; label: string; sublabel?: string;
  description?: string; dark?: boolean; wide?: boolean;
}) {
  return (
    <Link href={href} className="no-underline group block">
      <div
        className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.015] ${wide ? "h-full" : ""}`}
        style={{ backgroundColor: dark ? "#2d4a3e" : "#d6cfc0", minHeight: 220, position: "relative", overflow: "hidden" }}
      >
        {/* Watermark */}
        <span className="absolute right-4 bottom-0 select-none pointer-events-none font-black"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(80px, 10vw, 140px)", letterSpacing: "-0.05em", lineHeight: 0.85, color: dark ? "rgba(240,235,224,0.04)" : "rgba(45,74,62,0.05)" }}>
          {label.slice(0, 2).toUpperCase()}
        </span>

        {/* Arrow top-right */}
        <div className="flex justify-end">
          <span className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{ backgroundColor: dark ? "#d6cfc0" : "#2d4a3e" }}>
            <ArrowUpRight size={16} style={{ color: dark ? "#2d4a3e" : "#f0ebe0" }} />
          </span>
        </div>

        {/* Content */}
        <div>
          {sublabel && (
            <p className="text-[9px] tracking-[0.2em] uppercase font-bold mb-2"
              style={{ fontFamily: "'Inter', sans-serif", color: dark ? "rgba(240,235,224,0.38)" : "rgba(45,74,62,0.45)" }}>
              {sublabel}
            </p>
          )}
          <h2 className="font-black uppercase leading-tight"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(22px, 3vw, 34px)",
              letterSpacing: "-0.025em",
              color: dark ? "#f0ebe0" : "#2d4a3e",
            }}>
            {label}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif", color: dark ? "rgba(240,235,224,0.5)" : "rgba(45,74,62,0.6)" }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
/* ─── Page ────────────────────────────────────────────────────────── */
export function BuilderDashboard({ allBoosters }: { allBoosters: StoredBooster[] }) {
  const router  = useRouter();
  const mounted = useIsMounted();

  const [activeType, setActiveType] = useState<BoosterType>("idea");
  const boosters = allBoosters.filter((b) => (b.booster_type ?? "idea") === activeType);

  const TYPE_LABELS: Record<BoosterType, string> = {
    idea:     "Early Stage",
    momentum: "Build Phase",
    capital:  "Scale Up",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div>
          <div
            className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Left: back */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] bg-transparent hover:bg-[#e1dbcf] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft size={11} />
                <span>Portal</span>
              </span>
            </button>

            {/* Center: title */}
            <div className="flex-1 min-w-0 py-8 flex items-center justify-center px-6 border-r border-[#1a1a1a]">
              <span>Builder Hub</span>
            </div>

            {/* Right: logout — entire segment clickable, same hover as Portal */}
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="mb-24 flex flex-row justify-between">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(52px, 9vw, 138px)",
              letterSpacing: "-0.025em",
            }}
          >
            BUILDER
            <br />
            HUB.
          </h1>
        <div className="flex justify-end mt-6">
          <p
            className="text-[#2d4a3e]/55 max-w-[360px] text-right leading-relaxed"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(14px, 1.4vw, 17px)",
            }}
          >
            Spin up projects, refine ideas, and ship faster with agent-assisted boosters.
          </p>
        </div>
        </div>

        {/* ── Three primary CTAs ───────────────────────────────────────── */}
        <div className="grid gap-4 mb-10" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>

          {/* Project Hub — hero dark card */}
          <FeatureCard
            href="/builder/projects"
            label="Project Hub"
            sublabel="My workspace"
            description="Create, manage, and submit your projects to open programs."
            dark
          />

          {/* Explore Boosters */}
          <FeatureCard
            href="/boosters"
            label="Explore Boosters"
            sublabel="Boost Your Project"
            description="Browse hackathons, grants, and build programs."
          />

          {/* Residency */}
          <FeatureCard
            href="/residency"
            label="Residency"
            sublabel="Product cohorts"
            description="Join a cohort, find collaborators, and build together."
          />
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["BUILDER HUB", "★", "PROJECT HUB", "★", "OPEN CALLS", "★", "RESIDENCY", "★"].map((t, i) => (
              <span key={`${ri}-${i}`} className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}>
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}