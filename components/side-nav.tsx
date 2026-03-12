"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  Zap,
  FolderOpen,
  Users,
  Eye,
  LogOut,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Info,
  Mic2,
  CalendarDays,
  Trophy,
  Send,
  Pencil,
  Share2,
  Globe,
  Gavel,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/auth";
import { clearAuthCookies } from "@/components/logout-button";
import { useAuth } from "@/app/providers";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Config — define nav items for each context
   ═══════════════════════════════════════════════════════════════════ */

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** If set, item is only shown when the predicate returns true */
  visible?: (
    caps: {
      isAdmin: boolean;
      isEventCreator: boolean;
      isCohost: boolean;
      isJudge: boolean;
    } | null,
  ) => boolean;
}
interface TabItem {
  key: string;
  icon: LucideIcon;
  label: string;
}

const GLOBAL_NAV: NavItem[] = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/hackathons", icon: Zap, label: "Hackathons" },
  { href: "/builder/projects", icon: FolderOpen, label: "Projects" },
  { href: "/projects", icon: Eye, label: "Explore" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  {
    href: "/judge",
    icon: Gavel,
    label: "Judge",
    visible: (caps) => !!caps?.isJudge || !!caps?.isAdmin,
  },
  {
    href: "/host",
    icon: Users,
    label: "Host",
    visible: (caps) =>
      !!caps?.isEventCreator || !!caps?.isCohost || !!caps?.isAdmin,
  },
];

const HACKATHON_TABS: TabItem[] = [
  { key: "ideator", icon: Sparkles, label: "Ideator" },
  { key: "mentor", icon: GraduationCap, label: "Mentor" },
  { key: "info", icon: Info, label: "Info" },
  { key: "speakers", icon: Mic2, label: "Speakers" },
  { key: "schedule", icon: CalendarDays, label: "Schedule" },
  { key: "prizes", icon: Trophy, label: "Prizes" },
  { key: "submit", icon: Send, label: "Submit" },
];

const PROJECT_TABS: TabItem[] = [
  { key: "edit", icon: Pencil, label: "Edit" },
  { key: "share", icon: Share2, label: "Share" },
  { key: "public", icon: Globe, label: "Public URL" },
];

/* ═══════════════════════════════════════════════════════════════════
   Collapse state — persisted in localStorage
   ═══════════════════════════════════════════════════════════════════ */

export const NAV_WIDTH_EXPANDED = 220;
export const NAV_WIDTH_COLLAPSED = 64;

/** Tiny pub/sub so LayoutShell can react to toggle without polling */
const listeners = new Set<() => void>();
export function onNavToggle(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notifyToggle() {
  listeners.forEach((cb) => cb());
}

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidenav-collapsed");
    if (saved === "true") {
      setTimeout(() => {
        setCollapsed(true);
      }, 100);
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidenav-collapsed", String(next));
      notifyToggle();
      return next;
    });
  }

  return { collapsed, toggle };
}

/* ═══════════════════════════════════════════════════════════════════
   Route detection helpers
   ═══════════════════════════════════════════════════════════════════ */

type NavContext =
  | { kind: "global" }
  | {
      kind: "hackathon";
      backHref: string;
      tabs: TabItem[];
      defaultTab: string;
    }
  | { kind: "project"; backHref: string; tabs: TabItem[]; defaultTab: string }
  | {
      kind: "hostHackathon";
      backHref: string;
      tabs: TabItem[];
      defaultTab: string;
    };

function resolveNavContext(pathname: string): NavContext {
  // Hackathon-scoped project editor: /hackathons/[id]/project/[projectId]
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

  // Hackathon detail: /hackathons/[id]
  const hackathonMatch = pathname.match(/^\/hackathons\/([^/]+)$/);
  if (hackathonMatch) {
    return {
      kind: "hackathon",
      backHref: "/hackathons",
      tabs: HACKATHON_TABS,
      defaultTab: "info",
    };
  }

  // Host hackathon context: /host/[hackathon_id] (and nested), excluding /host/application
  const hostMatch = pathname.match(/^\/host\/([^/]+)(?:\/.*)?$/);
  if (hostMatch && hostMatch[1] !== "application") {
    return {
      kind: "hostHackathon",
      backHref: "/host",
      tabs: [{ key: "applications", icon: Users, label: "Applications" }],
      defaultTab: "applications",
    };
  }

  return { kind: "global" };
}

function isGlobalActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

/* ═══════════════════════════════════════════════════════════════════
   Shared style helpers
   ═══════════════════════════════════════════════════════════════════ */

const ACTIVE_BG = "rgba(226,254,165,0.12)";
const HOVER_BG = "rgba(226,254,165,0.08)";
const COLOR_ON = "#E2FEA5";
const COLOR_OFF = "rgba(226,254,165,0.35)";

function hoverHandlers(hoverBg = HOVER_BG) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = "transparent";
    },
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

function LogoButton({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-xl no-underline mb-4"
      style={{ height: 40, paddingLeft: collapsed ? 10 : 10 }}
      title="Home"
    >
      <Image src="/logo.svg" alt="Loops" width={20} height={20} />
      {!collapsed && (
        <span
          className="text-sm font-semibold whitespace-nowrap overflow-hidden"
          style={{ color: COLOR_ON }}
        >
          Loops
        </span>
      )}
    </Link>
  );
}

function BackButton({
  href,
  label,
  collapsed,
}: {
  href: string;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl no-underline mb-4 transition-colors"
      style={{
        height: 40,
        backgroundColor: "transparent",
        paddingLeft: collapsed ? 10 : 10,
      }}
      title={label}
      {...hoverHandlers()}
    >
      <ArrowLeft size={16} style={{ color: COLOR_ON, flexShrink: 0 }} />
      {!collapsed && (
        <span
          className="text-xs whitespace-nowrap overflow-hidden"
          style={{ color: COLOR_OFF }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

function NavItemRow({
  item,
  active,
  collapsed,
}: {
  item: { href?: string; icon: LucideIcon; label: string };
  active: boolean;
  collapsed: boolean;
}) {
  const content = (
    <>
      <item.icon
        size={18}
        style={{ color: active ? COLOR_ON : COLOR_OFF, flexShrink: 0 }}
      />
      {!collapsed && (
        <span
          className="text-sm whitespace-nowrap overflow-hidden"
          style={{ color: active ? COLOR_ON : COLOR_OFF }}
        >
          {item.label}
        </span>
      )}
      {active && <ActiveBar />}
    </>
  );

  const className = `relative flex items-center gap-3 rounded-xl no-underline transition-colors ${
    collapsed ? "justify-center w-10 h-10" : "w-full h-10 px-3"
  }`;

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
        title={collapsed ? item.label : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      className={className}
      style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
      title={collapsed ? item.label : undefined}
    >
      {content}
    </a>
  );
}

function GlobalNavItems({
  pathname,
  collapsed,
}: {
  pathname: string;
  collapsed: boolean;
}) {
  const { capabilities } = useAuth();

  return (
    <>
      {GLOBAL_NAV.filter(
        (item) => !item.visible || item.visible(capabilities),
      ).map((item) => {
        const active = isGlobalActive(item.href, pathname);
        return (
          <NavItemRow
            key={item.href}
            item={item}
            active={active}
            collapsed={collapsed}
          />
        );
      })}
    </>
  );
}

function HashTabItems({
  tabs,
  activeHash,
  collapsed,
}: {
  tabs: TabItem[];
  activeHash: string;
  collapsed: boolean;
}) {
  return (
    <>
      {tabs.map((tab) => {
        const active = activeHash === tab.key;
        const className = `relative flex items-center gap-3 rounded-xl no-underline transition-colors ${
          collapsed ? "justify-center w-10 h-10" : "w-full h-10 px-3"
        }`;
        return (
          <a
            key={tab.key}
            href={`#${tab.key}`}
            className={className}
            style={{ backgroundColor: active ? ACTIVE_BG : "transparent" }}
            title={collapsed ? tab.label : undefined}
          >
            <tab.icon
              size={18}
              style={{
                color: active ? COLOR_ON : COLOR_OFF,
                flexShrink: 0,
              }}
            />
            {!collapsed && (
              <span
                className="text-sm whitespace-nowrap overflow-hidden"
                style={{ color: active ? COLOR_ON : COLOR_OFF }}
              >
                {tab.label}
              </span>
            )}
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
  const { collapsed, toggle } = useCollapsed();

  const [loggingOut, setLoggingOut] = useState(false);
  const [activeHash, setActiveHash] = useState(
    ctx.kind !== "global" ? ctx.defaultTab : "",
  );
  const lockRef = useRef(false);

  useEffect(() => {
    if (ctx.kind === "global") return;
    const read = () =>
      setActiveHash(window.location.hash.replace("#", "") || ctx.defaultTab);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [ctx.kind, ctx.kind !== "global" ? ctx.defaultTab : ""]);

  async function handleLogout() {
    if (lockRef.current) return;
    lockRef.current = true;
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      /* non-fatal */
    }
    clearAuthCookies();
    window.location.href = "/login";
  }

  const width = collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED;

  return (
    <nav
      className="fixed left-0 top-0 hidden md:flex flex-col justify-between py-5 px-2 z-50 transition-[width] duration-200"
      style={{
        width,
        height: "calc(100vh - 32px)",
        top: 16,
        left: 16,
        backgroundColor: "#0F2C23",
        borderRadius: 15,
      }}
    >
      {/* Top section */}
      <div className="flex flex-col gap-1">
        {ctx.kind !== "global" ? (
          <BackButton
            href={ctx.backHref}
            label={
              ctx.kind === "hackathon"
                ? "Back to list"
                : ctx.kind === "project"
                  ? "Back to projects"
                  : "Back to host"
            }
            collapsed={collapsed}
          />
        ) : (
          <LogoButton collapsed={collapsed} />
        )}

        <div className="flex flex-col gap-1">
          {ctx.kind !== "global" ? (
            <HashTabItems
              tabs={ctx.tabs}
              activeHash={activeHash}
              collapsed={collapsed}
            />
          ) : (
            <GlobalNavItems pathname={pathname} collapsed={collapsed} />
          )}
        </div>
      </div>

      {/* Bottom: toggle + logout */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-3 rounded-xl border-none cursor-pointer transition-colors ${
            collapsed ? "justify-center w-10 h-10" : "w-full h-10 px-3"
          }`}
          style={{ backgroundColor: "transparent" }}
          title={collapsed ? "Expand" : "Collapse"}
          {...hoverHandlers()}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} style={{ color: COLOR_OFF }} />
          ) : (
            <>
              <PanelLeftClose
                size={17}
                style={{ color: COLOR_OFF, flexShrink: 0 }}
              />
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: COLOR_OFF }}
              >
                Collapse
              </span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`flex items-center gap-3 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 ${
            collapsed ? "justify-center w-10 h-10" : "w-full h-10 px-3"
          }`}
          style={{ backgroundColor: "transparent" }}
          title={collapsed ? "Sign out" : undefined}
          {...hoverHandlers()}
        >
          <LogOut size={17} style={{ color: COLOR_OFF, flexShrink: 0 }} />
          {!collapsed && (
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: COLOR_OFF }}
            >
              Sign out
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
