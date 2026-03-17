"use client";

import { BarChart3, Trophy } from "lucide-react";
import { HackathonLeaderboard } from "@/components/client/hackathon-leaderboard";
import type { LeaderboardEntry } from "@/components/client/hackathon-leaderboard";
import type { HackathonPhase } from "@/lib/hackathon-phase";
import { PX, FN } from "./constants";

interface HackathonResultsSectionProps {
  phase: HackathonPhase;
  entries: LeaderboardEntry[];
}

export function HackathonResultsSection({ phase, entries }: HackathonResultsSectionProps) {
  const isJudging = phase === "judging";

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-8"
        style={{
          fontFamily: PX,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        {isJudging ? "SUBMISSIONS" : "RESULTS"}
      </p>

      {isJudging ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 size={24} style={{ color: "rgba(15,44,35,0.35)", marginBottom: 16 }} />
          <p
            className="text-sm text-center max-w-[400px] leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
          >
            Judging is in progress. Results will be available once judging is complete.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Trophy size={24} style={{ color: "rgba(15,44,35,0.35)", marginBottom: 16 }} />
          <p
            className="text-sm text-center max-w-[400px] leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
          >
            Results have not been published yet.
          </p>
        </div>
      ) : (
        <HackathonLeaderboard entries={entries} />
      )}
    </div>
  );
}
