/**
 * Loops design system — single source of truth for colors, fonts, and tokens.
 * Used by Tailwind via CSS variables and by components for dynamic/project-specific themes.
 */

import type { StoredProject } from "@/lib/storage";

// ─── Default Loops palette (fallback when no project theme) ─────────────────
export const LOOPS_COLORS = {
  ink: "#0F2C23",
  forest: "#3C574B",
  lime: "#E2FEA5",
  cream: "#F5F7EB",
  inkHover: "#1a4033",
  inkLight: "rgba(15, 44, 35, 0.08)",
  inkMuted: "rgba(15, 44, 35, 0.25)",
  limeMuted: "rgba(226, 254, 165, 0.5)",
  limeLight: "rgba(226, 254, 165, 0.1)",
} as const;

export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  pageBg: string;
};

/** Build a palette from project theme-reader colors; falls back to Loops defaults. */
export function makePalette(p: StoredProject): Palette {
  return {
    primary: (p.primary_color as string | undefined) ?? LOOPS_COLORS.ink,
    secondary: (p.secondary_color as string | undefined) ?? LOOPS_COLORS.cream,
    accent: (p.accent_color as string | undefined) ?? LOOPS_COLORS.lime,
    pageBg: (p.secondary_color as string | undefined) ?? LOOPS_COLORS.cream,
  };
}
