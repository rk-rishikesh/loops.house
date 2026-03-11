"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoredBooster } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function FeatureCard({
  href, label, sublabel, description, dark = false,
}: {
  href: string; label: string; sublabel?: string;
  description?: string; dark?: boolean;
}) {
  const bg   = dark ? "#163528" : "#F8FFE8";
  const fg   = dark ? "#E2FEA5" : "#0F2C23";
  const sub  = dark ? "rgba(226,254,165,0.4)" : "rgba(15,44,35,0.45)";
  const descC = dark ? "rgba(226,254,165,0.5)" : "rgba(15,44,35,0.55)";
  const wm   = dark ? "rgba(226,254,165,0.04)" : "rgba(15,44,35,0.04)";
  const arrBg = dark ? "#E2FEA5" : "#0F2C23";
  const arrFg = dark ? "#0F2C23" : "#F8FFE8";

  return (
    <Link href={href} className="no-underline group block">
      <div
        className="rounded-2xl p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-200 group-hover:scale-[1.015]"
        style={{ backgroundColor: bg }}
      >
        <span
          className="absolute right-4 bottom-0 select-none pointer-events-none font-black"
          style={{ fontFamily: PX, fontSize: "clamp(80px, 10vw, 140px)", letterSpacing: "-0.05em", lineHeight: 0.85, color: wm }}
        >
          {`<`}<br />{`>`}
        </span>

        <div className="flex justify-end">
          <span className="w-11 h-11 flex items-center justify-center rounded-full" style={{ backgroundColor: arrBg }}>
            <ArrowUpRight size={16} style={{ color: arrFg }} />
          </span>
        </div>

        <div>
          {sublabel && (
            <p className="text-[9px] tracking-[0.2em] uppercase font-bold mb-2" style={{ fontFamily: PX, color: sub }}>
              {sublabel}
            </p>
          )}
          <h2 className="font-black uppercase leading-tight" style={{ fontFamily: PX, fontSize: "clamp(22px, 3vw, 34px)", letterSpacing: "-0.025em", color: fg }}>
            {label}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed" style={{ fontFamily: FN, color: descC }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function BuilderDashboard({  }: { allBoosters: StoredBooster[] }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden p-4" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="flex-1 flex flex-col rounded-[15px] overflow-hidden min-h-0" style={{ backgroundColor: "#0F2C23" }}>

        <div className="flex-1 flex items-end px-14 pb-10 min-h-0">
          <div className="flex flex-row justify-between items-end w-full">
            <h1
              className="font-black leading-[0.85] uppercase"
              style={{
                fontFamily: PX,
                fontSize: "clamp(64px, 10vw, 160px)",
                letterSpacing: "-0.03em",
                color: "#E2FEA5",
              }}
            >
              BUILDER
              <br />
              HUB.
            </h1>
            <p
              className="max-w-[380px] text-right leading-relaxed"
              style={{
                fontFamily: FN,
                fontSize: "clamp(15px, 1.5vw, 19px)",
                color: "rgba(226,254,165,0.45)",
              }}
            >
              Spin up projects, refine ideas, and ship faster with agent-assisted boosters.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-14 pb-8 pt-8 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <FeatureCard
            href="/builder/projects"
            label="My Project Repository"
            sublabel="My workspace"
            description="Create, manage, and submit your projects to open programs."
            dark
          />
          <FeatureCard
            href="/boosters"
            label="Explore Hackathons"
            sublabel="Boost Your Project"
            description="Browse hackathons, grants, and build programs to accelerate your project."
          />
          <FeatureCard
            href="/residency"
            label="Explore Residency"
            sublabel="Product cohorts"
            description="Join a cohort, find collaborators, and build together."
          />
        </div>
      </div>
    </div>
  );
}
