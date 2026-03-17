"use client";

import { useEffect, useState } from "react";
import type { StoredHackathon, StoredProject, StoredSpeaker, StoredSubmission } from "@/lib/data-mappers";
import type { LeaderboardEntry } from "@/components/client/hackathon-leaderboard";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { setHackathonTabOverride } from "@/components/side-nav/hackathon-tab-store";
import { HackathonInfoSection } from "@/app/hackathons/[id]/_components/hackathon-info";
import { HackathonChatSection } from "@/app/hackathons/[id]/_components/hackathon-chat";
import { HackathonSpeakersSection } from "@/app/hackathons/[id]/_components/hackathon-speakers";
import { HackathonScheduleSection } from "@/app/hackathons/[id]/_components/hackathon-schedule";
import { HackathonPrizesSection } from "@/app/hackathons/[id]/_components/hackathon-prizes";
import { HackathonSubmitSection } from "@/app/hackathons/[id]/_components/hackathon-submit";
import { HackathonResultsSection } from "@/app/hackathons/[id]/_components/hackathon-results";
import {
  PX,
  FN,
  WATERMARKS,
  SECTION_META,
  SIMPLE_SECTIONS,
} from "@/app/hackathons/[id]/_components/constants";
import type { SectionKey } from "@/app/hackathons/[id]/_components/constants";

interface BuilderHackathonDetailProps {
  hackathonId: string;
  hackathon: StoredHackathon | null;
  speakers: StoredSpeaker[];
  projects: StoredProject[];
  submissions: StoredSubmission[];
  isAuthenticated: boolean;
  results?: LeaderboardEntry[];
}

export function BuilderHackathonDetail({
  hackathonId,
  hackathon,
  speakers,
  projects,
  submissions,
  isAuthenticated,
  results = [],
}: BuilderHackathonDetailProps) {
  const [section, setSection] = useState<SectionKey>("info");

  // Compute whether user has a submission for this hackathon
  const userProjectIds = new Set(projects.map((p) => p.project_id));
  const hasSubmission = submissions.some(
    (s) => s.hackathon_id === hackathonId && userProjectIds.has(s.project_id),
  );

  // Set hackathon tab override for dynamic side-nav tabs
  useEffect(() => {
    if (!hackathon) return;
    setHackathonTabOverride({ phase: hackathon.phase, hasSubmission });
    return () => setHackathonTabOverride(null);
  }, [hackathon, hasSubmission]);

  // Hash routing
  useEffect(() => {
    const hideAi =
      hackathon &&
      (hackathon.phase === "judging" ||
        hackathon.phase === "completed" ||
        hackathon.phase === "finalized");

    const validKeys: SectionKey[] = [
      "info",
      "speakers",
      "schedule",
      "prizes",
      "submit",
      ...(hideAi ? [] : (["ideator", "mentor"] as SectionKey[])),
      ...(hackathon &&
      (hackathon.phase === "judging" ||
        hackathon.phase === "completed" ||
        hackathon.phase === "finalized")
        ? (["results"] as SectionKey[])
        : []),
    ];

    const read = () => {
      const h = (window.location.hash.replace("#", "") || "info") as SectionKey;
      setSection(validKeys.includes(h) ? h : "info");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [hackathon]);

  if (hackathon === null) {
    return (
      <div
        className="flex flex-col h-screen overflow-hidden p-4"
        style={{ backgroundColor: "#F8FFE8" }}
      >
        <div
          className="flex-1 rounded-[15px] flex items-center justify-center"
          style={{ backgroundColor: "#0F2C23" }}
        >
          <p style={{ fontFamily: FN, color: "rgba(226,254,165,0.5)" }}>Opportunity not found.</p>
        </div>
      </div>
    );
  }

  const h = hackathon;

  function renderTopBar() {
    const m = SECTION_META[section];
    return (
      <div
        className="shrink-0 flex items-center justify-between px-10 py-4"
        style={{ borderBottom: "1px solid rgba(226,254,165,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <p
            className="text-[9px] tracking-[0.25em] uppercase font-bold"
            style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}
          >
            {m.label} — {h.name}
          </p>
          <HackathonPhaseBadge phase={h.phase} size="sm" />
        </div>
        <p
          className="text-[9px] tracking-[0.18em] uppercase font-bold"
          style={{ fontFamily: PX, color: "rgba(226,254,165,0.2)" }}
        >
          {WATERMARKS[section]}
        </p>
      </div>
    );
  }

  function renderSection() {
    switch (section) {
      case "ideator":
      case "mentor":
        return (
          <HackathonChatSection
            section={section}
            hackathonId={hackathonId}
            hackathon={h}
            isAuthenticated={isAuthenticated}
          />
        );
      case "info":
        return <HackathonInfoSection hackathon={h} />;
      case "speakers":
        return <HackathonSpeakersSection speakers={speakers} />;
      case "schedule":
        return <HackathonScheduleSection hackathon={h} />;
      case "prizes":
        return <HackathonPrizesSection hackathon={h} />;
      case "submit":
        return (
          <HackathonSubmitSection
            hackathonId={hackathonId}
            hackathon={h}
            projects={projects}
            submissions={submissions}
            isAuthenticated={isAuthenticated}
          />
        );
      case "results":
        return <HackathonResultsSection phase={h.phase} entries={results} />;
    }
  }

  // Simple sections render on the light background
  if (SIMPLE_SECTIONS.includes(section)) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
        {renderSection()}
      </main>
    );
  }

  // Dark container layout for ideator / mentor / submit
  return (
    <div
      className="flex flex-col h-screen overflow-hidden p-4"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <div
        className="flex-1 rounded-[15px] overflow-hidden flex flex-col min-h-0"
        style={{ backgroundColor: "#0F2C23" }}
      >
        {section !== "submit" && renderTopBar()}
        {renderSection()}
      </div>
    </div>
  );
}
