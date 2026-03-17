// lib/hackathon-phase.ts

export type HackathonPhase = "draft" | "upcoming" | "building" | "judging" | "completed" | "finalized";

/**
 * Compute hackathon phase from dates. No DB status column needed.
 * - upcoming:   now < start_date (or no start_date)
 * - building:   start_date <= now < submission_deadline
 * - judging:    submission_deadline <= now < results_date
 * - completed:  results_date <= now AND finalized_at is null
 * - finalized:  results_date <= now AND finalized_at is set
 */
export function computePhase(hackathon: {
  status?: string | null;
  start_date?: string | null;
  submission_deadline?: string | null;
  results_date?: string | null;
  finalized_at?: string | null;
}): HackathonPhase {
  // Draft is a stored status — not derived from dates
  if (hackathon.status === "draft") return "draft";

  // Finalized is derived from finalized_at timestamp
  if (hackathon.finalized_at) return "finalized";

  const now = new Date();
  const start = hackathon.start_date ? new Date(hackathon.start_date) : null;
  const subDeadline = hackathon.submission_deadline
    ? new Date(hackathon.submission_deadline)
    : null;
  const results = hackathon.results_date ? new Date(hackathon.results_date) : null;

  // Past results date → completed (awaiting finalization)
  if (results && now >= results) return "completed";

  // Past submission deadline → judging
  if (subDeadline && now >= subDeadline) return "judging";

  // Past start date → building
  if (start && now >= start) return "building";

  return "upcoming";
}

/** Phase display labels */
export const PHASE_LABELS: Record<HackathonPhase, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  building: "Building",
  judging: "Judging",
  completed: "Completed",
  finalized: "Finalized",
};

/** Phase display colors (bg, text) */
export const PHASE_COLORS: Record<HackathonPhase, { bg: string; text: string }> = {
  draft: { bg: "rgba(234,179,8,0.12)", text: "#92400E" },
  upcoming: { bg: "rgba(214,168,74,0.12)", text: "#8a6a1a" },
  building: { bg: "rgba(76,175,125,0.12)", text: "#2d7a50" },
  judging: { bg: "rgba(99,133,214,0.12)", text: "#3a5a9e" },
  completed: { bg: "rgba(168,85,214,0.12)", text: "#6b2fa0" },
  finalized: { bg: "rgba(15,44,35,0.08)", text: "rgba(15,44,35,0.55)" },
};

/** Check what actions are allowed in the current phase */
export interface PhasePermissions {
  canSubmit: boolean;
  canEditJudges: boolean;
  canEditSpeakers: boolean;
  canJudge: boolean;
  canRunAiEval: boolean;
  canEditDetails: boolean;
  canEditTimeline: boolean;
  canFinalize: boolean;
}

export function getPhasePermissions(phase: HackathonPhase): PhasePermissions {
  if (phase === "finalized") {
    return {
      canSubmit: false,
      canEditJudges: false,
      canEditSpeakers: false,
      canJudge: false,
      canRunAiEval: false,
      canEditDetails: false,
      canEditTimeline: false,
      canFinalize: false,
    };
  }

  // Draft hackathons allow full editing but no judging/submissions/finalization
  if (phase === "draft") {
    return {
      canSubmit: false,
      canEditJudges: true,
      canEditSpeakers: true,
      canJudge: false,
      canRunAiEval: false,
      canEditDetails: true,
      canEditTimeline: true,
      canFinalize: false,
    };
  }

  return {
    canSubmit: phase === "building",
    canEditJudges: true,
    canEditSpeakers: true,
    canJudge: phase === "judging" || phase === "completed",
    canRunAiEval: phase === "judging" || phase === "completed",
    canEditDetails: true,
    canEditTimeline: true,
    canFinalize: phase === "completed",
  };
}
