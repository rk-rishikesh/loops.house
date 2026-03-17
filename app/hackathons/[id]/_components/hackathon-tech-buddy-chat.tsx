"use client";

import type { StoredHackathon } from "@/lib/data-mappers";
import { HackathonChatSection } from "./hackathon-chat";

export function HackathonTechBuddyChat({
  hackathonId,
  hackathon,
  isAuthenticated,
}: {
  hackathonId: string;
  hackathon: StoredHackathon;
  isAuthenticated: boolean;
}) {
  return (
    <HackathonChatSection
      section="techbuddy"
      hackathonId={hackathonId}
      hackathon={hackathon}
      isAuthenticated={isAuthenticated}
      apiPath="/api/builder-agents/tech-buddy"
    />
  );
}

