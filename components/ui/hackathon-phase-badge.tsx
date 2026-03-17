"use client";

import {
  type HackathonPhase,
  PHASE_COLORS,
  PHASE_LABELS,
} from "@/lib/hackathon-phase";

interface HackathonPhaseBadgeProps {
  phase: HackathonPhase;
  size?: "sm" | "md";
}

export function HackathonPhaseBadge({
  phase,
  size = "sm",
}: HackathonPhaseBadgeProps) {
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
