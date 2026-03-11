"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid, Zap, FolderOpen, Users, Eye, Settings, LogOut, ArrowLeft,
  Sparkles, GraduationCap, Info, Mic2, CalendarDays, Trophy, Send,
  Pencil, Share2, Globe,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/auth";
import { clearAuthCookies } from "@/components/logout-button";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Config — define nav items for each context
   ═══════════════════════════════════════════════════════════════════ */


interface NavItem  { href: string; icon: LucideIcon; label: string }
interface TabItem  { key: string;  icon: LucideIcon; label: string }

const GLOBAL_NAV: NavItem[] = [
  { href: "/builder",          icon: LayoutGrid, label: "Dashboard" },
  { href: "/boosters",         icon: Zap,        label: "Boosters" },
  { href: "/builder/projects", icon: FolderOpen, label: "Projects" },
  { href: "/events",           icon: CalendarDays, label: "My Events" },
  { href: "/host",             icon: Users,      label: "Host" },
  { href: "/viewer",           icon: Eye,        label: "Viewer" },
  { href: "/residency",        icon: Settings,   label: "Residency" },
];

const BOOSTER_TABS: TabItem[] = [
  { key: "ideator",  icon: Sparkles,      label: "Ideator" },
  { key: "mentor",   icon: GraduationCap, label: "Mentor" },
  { key: "info",     icon: Info,          label: "Info" },
  { key: "speakers", icon: Mic2,          label: "Speakers" },
  { key: "schedule", icon: CalendarDays,  label: "Schedule" },
  { key: "prizes",   icon: Trophy,        label: "Prizes" },
  { key: "submit",   icon: Send,          label: "Submit" },
];

const PROJECT_TABS: TabItem[] = [
  { key: "edit",   icon: Pencil, label: "Edit" },
  { key: "share",  icon: Share2, label: "Share" },
  { key: "public", icon: Globe,  label: "Public URL" },
];

/* ═══════════════════════════════════════════════════════════════════
   Route detection helpers
   ═══════════════════════════════════════════════════════════════════ */

type NavContext =
  | { kind: "global" }
  | { kind: "booster"; backHref: string; tabs: TabItem[]; defaultTab: string }
  | { kind: "project"; backHref: string; tabs: TabItem[]; defaultTab: string }
  | { kind: "hostBooster"; backHref: string; tabs: TabItem[]; defaultTab: string };

function resolveNavContext(pathname: string): NavContext {
  // Booster-scoped project editor: /boosters/[type]/[id]/project/[projectId]
  const boosterProjectMatch = pathname.match(
    /^\/boosters\/([^/]+)\/([^/]+)\/project\/[^/]+$/,
  );
  if (boosterProjectMatch) {
    const [, typeSlug, boosterId] = boosterProjectMatch;
    return {
      kind: "project",
      backHref: `/boosters/${typeSlug}/${boosterId}`,
      tabs: PROJECT_TABS,
      defaultTab: "edit",
    };
  }

  // Builder project editor: /builder/projects/[id]
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

  // Booster detail: /boosters/[type]/[id]
  const boosterMatch = pathname.match(/^\/boosters\/([^/]+)\/([^/]+)$/);
  if (boosterMatch) {
    const typeSlug = boosterMatch[1];
    return {
      kind: "booster",
      backHref: `/boosters/${typeSlug}`,
      tabs: BOOSTER_TABS,
      defaultTab: "info",
    };
  }

  // Host booster context: /host/[booster_id] (and nested), excluding /host/application
  const hostMatch = pathname.match(/^\/host\/([^/]+)(?:\/.*)?$/);
  if (hostMatch && hostMatch[1] !== "application") {
    return {
      kind: "hostBooster",
      backHref: "/host",
      tabs: [{ key: "applications", icon: Users, label: "Applications" }],
      defaultTab: "applications",
    };
  }

  return { kind: "global" };
}

function isGlobalActive(href: string, pathname: string) {
  if (href === "/builder") return pathname === "/builder";
  return pathname.startsWith(href);
}

/* ═══════════════════════════════════════════════════════════════════
   Shared style helpers
   ═══════════════════════════════════════════════════════════════════ */

const ACTIVE_BG   = "rgba(226,254,165,0.12)";
const HOVER_BG    = "rgba(226,254,165,0.08)";
const COLOR_ON    = "#E2FEA5";
const COLOR_OFF   = "rgba(226,254,165,0.35)";

function hoverHandlers(hoverBg = HOVER_BG) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = hoverBg; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = "transparent"; },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════ */

function ActiveBar() {
  return (
    <span
      className="absolute right-[-8px] top-1/2 -translate-y-1/2 rounded-full"
      style={{ width: 3, height: 18, backgroundColor: COLOR_ON }}
    />
  );
}

function LogoButton() {
  return (
    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-xl no-underline mb-4" title="Home">
      <Image src="/logo.svg" alt="Loops" width={20} height={20} />
    </Link>
  );
}

function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="w-10 h-10 flex items-center justify-center rounded-xl no-underline mb-4 transition-colors"
      title={label}
      style={{ backgroundColor: "transparent" }}
      {...hoverHandlers()}
    >
      <ArrowLeft size={16} style={{ color: COLOR_ON }} />
    </Link>
  );
}

function GlobalNavItems({ pathname }: { pathname: string }) {
  return (
    <>
      {GLOBAL_NAV.map((item) => {
        const active = isGlobalActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl no-underline transition-colors"
            style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
            title={item.label}
          >
            <item.icon size={18} style={{ color: active ? COLOR_ON : COLOR_OFF }} />
            {active && <ActiveBar />}
          </Link>
        );
      })}
    </>
  );
}

function HashTabItems({ tabs, activeHash }: { tabs: TabItem[]; activeHash: string }) {
  return (
    <>
      {tabs.map((tab) => {
        const active = activeHash === tab.key;
        return (
          <a
            key={tab.key}
            href={`#${tab.key}`}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl no-underline transition-colors"
            style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
            title={tab.label}
          >
            <tab.icon size={18} style={{ color: active ? COLOR_ON : COLOR_OFF }} />
            {active && <ActiveBar />}
          </a>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main SideNav export
   ═══════════════════════════════════════════════════════════════════ */

export function SideNav() {
  const pathname = usePathname();
  const ctx = resolveNavContext(pathname);

  const [loggingOut, setLoggingOut] = useState(false);
  const [activeHash, setActiveHash] = useState(ctx.kind !== "global" ? ctx.defaultTab : "");
  const lockRef = useRef(false);

  useEffect(() => {
    if (ctx.kind === "global") return;
    const read = () => setActiveHash(window.location.hash.replace("#", "") || ctx.defaultTab);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [ctx.kind, ctx.kind !== "global" ? ctx.defaultTab : ""]);

  async function handleLogout() {
    if (lockRef.current) return;
    lockRef.current = true;
    setLoggingOut(true);
    try { await signOut(); } catch { /* non-fatal */ }
    clearAuthCookies();
    window.location.href = "/login";
  }

  return (
    <nav
      className="fixed left-0 top-0 hidden md:flex flex-col items-center justify-between py-5 px-2 z-50"
      style={{ width: 64, height: "calc(100vh - 32px)", top: 16, left: 16, backgroundColor: "#0F2C23", borderRadius: 15 }}
    >
      {/* Top section */}
      <div className="flex flex-col items-center gap-1">
        {ctx.kind !== "global" ? (
          <BackButton
            href={ctx.backHref}
            label={
              ctx.kind === "booster"
                ? "Back to list"
                : ctx.kind === "project"
                ? "Back to projects"
                : "Back to host"
            }
          />
        ) : (
          <LogoButton />
        )}

        <div className="flex flex-col items-center gap-5">
          {ctx.kind !== "global"
            ? <HashTabItems tabs={ctx.tabs} activeHash={activeHash} />
            : <GlobalNavItems pathname={pathname} />
          }
        </div>
      </div>

      {/* Bottom: logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-10 h-10 flex items-center justify-center rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50"
        style={{ backgroundColor: "transparent" }}
        title="Sign out"
        {...hoverHandlers()}
      >
        <LogOut size={17} style={{ color: COLOR_OFF }} />
      </button>
    </nav>
  );
}
