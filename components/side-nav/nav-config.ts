import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Database,
  Eye,
  FolderOpen,
  Gavel,
  Info,
  LayoutGrid,
  Mic2,
  Pencil,
  Send,
  Settings,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { BasicCapabilities } from "@/lib/capabilities";
import type { HackathonTabOverride } from "./hackathon-tab-store";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  visible?: (caps: BasicCapabilities | null) => boolean;
}

export interface TabItem {
  key: string;
  icon: LucideIcon;
  label: string;
}

export const GLOBAL_NAV: NavItem[] = [
  { href: "/dashboard", icon: LayoutGrid, label: "Welcome" },
  { href: "/hackathons", icon: Zap, label: "Explore Hackathons" },
  { href: "/projects", icon: Eye, label: "Discover Projects" },
  { href: "/builder/projects", icon: FolderOpen, label: "My Projects" },
  { href: "/host", icon: Users, label: "Host Dashboard" },
  {
    href: "/judge",
    icon: Gavel,
    label: "Judge Dashboard",
    visible: (caps) => !!caps?.isJudge || !!caps?.isAdmin,
  },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export const HACKATHON_TABS: TabItem[] = [
  { key: "info", icon: Info, label: "About" },
  { key: "speakers", icon: Mic2, label: "Speakers" },
  { key: "schedule", icon: CalendarDays, label: "Schedule" },
  { key: "prizes", icon: Trophy, label: "Tracks" },
  { key: "techbuddy", icon: Sparkles, label: "Tech Buddy" },
  { key: "submit", icon: Send, label: "Submit Project" },
];

/**
 * Compute dynamic hackathon tabs based on phase + submission state.
 * Returns static HACKATHON_TABS when override is null (backwards compat).
 */
export function getHackathonTabs(override: HackathonTabOverride | null): TabItem[] {
  if (!override) return HACKATHON_TABS;

  const { phase, hasSubmission } = override;
  const hideAi = phase === "judging" || phase === "completed" || phase === "finalized";

  let tabs = HACKATHON_TABS.filter((t) => {
    if (hideAi && t.key === "techbuddy") return false;
    if (hideAi && t.key === "submit" && !hasSubmission) return false;
    return true;
  });

  // Swap submit label when user already submitted
  if (hasSubmission) {
    tabs = tabs.map((t) =>
      t.key === "submit" ? { key: "submit", icon: Eye, label: "View Submission" } : t,
    );
  }

  // Add results tab after submit
  if (phase === "judging") {
    tabs = [...tabs, { key: "results", icon: BarChart3, label: "Submissions" }];
  } else if (phase === "completed" || phase === "finalized") {
    tabs = [...tabs, { key: "results", icon: Trophy, label: "Results" }];
  }

  return tabs;
}

export const PROJECT_TABS: TabItem[] = [
  { key: "edit", icon: Pencil, label: "Edit" },
  { key: "knowledge-base", icon: Database, label: "Knowledge Base" },
  { key: "share", icon: Sparkles, label: "Amplify With AI" },
  { key: "public", icon: Share2, label: "Public URL" },
];

export type NavContext =
  | { kind: "global" }
  | { kind: "hackathon"; backHref: string; tabs: TabItem[]; defaultTab: string }
  | { kind: "project"; backHref: string; tabs: TabItem[]; defaultTab: string }
  | {
      kind: "hostHackathon";
      backHref: string;
      hackathonId: string;
      items: NavItem[];
    };

export function resolveNavContext(pathname: string): NavContext {
  const hackathonProjectMatch = pathname.match(
    /^\/hackathons\/([^/]+)\/project\/[^/]+$/,
  );
  if (hackathonProjectMatch) {
    const [, hackathonId] = hackathonProjectMatch;
    return {
      kind: "project",
      backHref: `/hackathons/${hackathonId}`,
      tabs: PROJECT_TABS,
      defaultTab: "edit",
    };
  }

  const isBuilderProject =
    /^\/builder\/projects\/[^/]+$/.test(pathname) &&
    pathname !== "/builder/projects";
  if (isBuilderProject) {
    return {
      kind: "project",
      backHref: "/builder/projects",
      tabs: PROJECT_TABS,
      defaultTab: "edit",
    };
  }

  const hackathonMatch = pathname.match(/^\/hackathons\/([^/]+)$/);
  if (hackathonMatch) {
    return {
      kind: "hackathon",
      backHref: "/hackathons",
      tabs: HACKATHON_TABS,
      defaultTab: "info",
    };
  }

  const hostMatch = pathname.match(/^\/host\/([^/]+)(?:\/.*)?$/);
  if (hostMatch && hostMatch[1] !== "new") {
    const hid = hostMatch[1];
    const isManageRoute = pathname.startsWith(`/host/${hid}/manage`);

    if (isManageRoute) {
      return {
        kind: "hostHackathon",
        backHref: `/host/${hid}`,
        hackathonId: hid,
        items: [
          { href: `/host/${hid}/manage`, icon: Settings, label: "Manage" },
          { href: `/host/${hid}/manage/edit`, icon: Pencil, label: "Edit Info" },
          { href: `/host/${hid}/manage/speakers`, icon: Mic2, label: "Speakers" },
          { href: `/host/${hid}/manage/judges`, icon: Gavel, label: "Judges" },
          { href: `/host/${hid}/manage/cohosts`, icon: Users, label: "Cohosts" },
        ],
      };
    }

    return {
      kind: "hostHackathon",
      backHref: "/host",
      hackathonId: hid,
      items: [
        { href: `/host/${hid}`, icon: LayoutGrid, label: "Dashboard" },
        { href: `/host/${hid}/manage`, icon: Settings, label: "Manage" },
        { href: `/host/${hid}/analytics`, icon: BarChart3, label: "Analytics" },
      ],
    };
  }

  return { kind: "global" };
}

export function isGlobalActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}
