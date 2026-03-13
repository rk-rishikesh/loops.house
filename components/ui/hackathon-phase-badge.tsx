"use client";

import {
  computePhase,
  type HackathonPhase,
  PHASE_COLORS,
  PHASE_LABELS,
} from "@/lib/hackathon-phase";

interface HackathonPhaseBadgeProps {
  hackathon: {
    start_date?: string | null;
    submission_deadline?: string | null;
    results_date?: string | null;
    finalized_at?: string | null;
  };
  /** Override computed phase (for preview/testing) */
  phase?: HackathonPhase;
  size?: "sm" | "md";
}

export function HackathonPhaseBadge({
  hackathon,
  phase: overridePhase,
  size = "sm",
}: HackathonPhaseBadgeProps) {
  const phase = overridePhase ?? computePhase(hackathon);
  const colors = PHASE_COLORS[phase];
  const label = PHASE_LABELS[phase];

  const sizeClasses = size === "sm" ? "px-1.5 py-1.5 text-xs" : "px-2.5 py-2 text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
