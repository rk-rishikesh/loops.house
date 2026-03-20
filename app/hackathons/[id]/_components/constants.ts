export const PX = "var(--font-pixelify-sans), sans-serif";
export const FN = "var(--font-funnel-sans), sans-serif";

export type SectionKey =
  | "techbuddy"
  | "info"
  | "speakers"
  | "schedule"
  | "prizes"
  | "submit"
  | "results";

export type Message = { role: "user" | "assistant"; content: string };

export const WATERMARKS: Record<SectionKey, string> = {
  techbuddy: "TECH BUDDY",
  info: "INFO",
  speakers: "SPEAKERS",
  schedule: "SCHEDULE",
  prizes: "PRIZES",
  submit: "SUBMIT",
  results: "RESULTS",
};

export const SECTION_META: Record<
  SectionKey,
  { label: string; accent: string; accentFaint: string; panelBg: string; panelBorder: string }
> = {
  techbuddy: {
    label: "Tech Buddy",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(226,254,165,0.04)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  info: {
    label: "About",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(60,87,75,0.55)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  speakers: {
    label: "Speakers",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(60,87,75,0.55)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  schedule: {
    label: "Schedule",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(226,254,165,0.04)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  prizes: {
    label: "Prizes + Challenges",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(226,254,165,0.04)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  submit: {
    label: "Submit",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(60,87,75,0.55)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
  results: {
    label: "Results",
    accent: "#E2FEA5",
    accentFaint: "rgba(226,254,165,0.35)",
    panelBg: "rgba(60,87,75,0.55)",
    panelBorder: "1px solid rgba(226,254,165,0.06)",
  },
};

/** Sections rendered on light background (no dark container) */
export const SIMPLE_SECTIONS: SectionKey[] = ["info", "speakers", "schedule", "prizes", "submit", "results"];
