"use client";

import { HackathonAboutSection } from "@/components/hackathon-sections";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import type { StoredHackathon } from "@/lib/data-mappers";
import { PX } from "./constants";

export function HackathonInfoSection({ hackathon }: { hackathon: StoredHackathon }) {
  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <div className="rounded-2xl p-10" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p
            className="text-[9px] tracking-[0.25em] uppercase font-bold"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.55)" }}
          >
            About the hackathon
          </p>
          <HackathonPhaseBadge size="sm" phase={hackathon.phase} />
        </div>

        <HackathonAboutSection hackathon={hackathon} />
      </div>
    </div>
  );
}
