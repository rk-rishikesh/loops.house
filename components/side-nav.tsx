"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Database,
  Eye,
  FolderOpen,
  Gavel,
  GraduationCap,
  Info,
  LayoutGrid,
  LogOut,
  Mic2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Send,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/providers";
import { signOut } from "@/lib/auth";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function clearAuthCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (
      name.startsWith("sb-") ||
      name === "x-user-role-hint" ||
      name === "x-user-caps" ||
      name === "x-user-caps-hint"
    ) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

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
  { href: "/dashboard", icon: LayoutGrid, label: "Welcome" },
  { href: "/hackathons", icon: Zap, label: "Explore Hackathons" },
  { href: "/builder/projects", icon: FolderOpen, label: "My Projects" },
  { href: "/projects", icon: Eye, label: "Discover Projects" },
  {
    href: "/judge",
    icon: Gavel,
    label: "Judge",
    visible: (caps) => !!caps?.isJudge || !!caps?.isAdmin,
  },
  {
    href: "/host",
    icon: Users,
    label: "Host Navigation",
  },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const HACKATHON_TABS: TabItem[] = [
  { key: "info", icon: Info, label: "About" },
  { key: "speakers", icon: Mic2, label: "Speakers" },
  { key: "schedule", icon: CalendarDays, label: "Schedule" },
  { key: "prizes", icon: Trophy, label: "Tracks" },
  { key: "ideator", icon: Sparkles, label: "Ideate With AI" },
  { key: "mentor", icon: GraduationCap, label: "AI Mentor" },
  { key: "submit", icon: Send, label: "Submit Project" },
];

const PROJECT_TABS: TabItem[] = [
  { key: "edit", icon: Pencil, label: "Edit" },
  { key: "knowledge-base", icon: Database, label: "Knowledge Base" },
  { key: "share", icon: Sparkles, label: "Amplify With AI" },
  { key: "public", icon: Share2, label: "Public URL" },
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
  const hackathonProjectMatch = pathname.match(/^\/hackathons\/([^/]+)\/project\/[^/]+$/);
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
    /^\/builder\/projects\/[^/]+$/.test(pathname) && pathname !== "/builder/projects";
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

  // Host hackathon context: /host/[hackathon_id] (and nested), excluding /host/new
  const hostMatch = pathname.match(/^\/host\/([^/]+)(?:\/.*)?$/);
  if (hostMatch && hostMatch[1] !== "new") {
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

const COLOR_ON = "#E2FEA5";
const COLOR_OFF = "rgba(226,254,165,0.38)";
const ACTIVE_BG = "rgba(226,254,165,0.08)";

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════ */

function ActiveIndicator() {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
      <div
        className="w-[3px] h-5 rounded-full"
        style={{
          backgroundColor: COLOR_ON,
          boxShadow: "0 0 12px rgba(226, 254, 165, 0.5)",
        }}
      />
    </div>
  );
}

function LogoButton({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 rounded-2xl no-underline mb-6 transition-all duration-300"
      style={{ height: 48, paddingLeft: collapsed ? 14 : 14 }}
      title="Home"
    >
      <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
        <Image src="/logo.svg" alt="Loops" width={18} height={18} />
      </div>
      {!collapsed && (
        <span
          className="text-sm font-black tracking-widest uppercase transition-colors"
          style={{ color: COLOR_ON, fontFamily: PX }}
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
      className="group flex items-center gap-3 rounded-2xl no-underline mb-6 transition-all duration-300 hover:bg-white/5"
      style={{
        height: 48,
        paddingLeft: collapsed ? 14 : 14,
      }}
      title={label}
    >
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-[#E2FEA5]/5 text-[#E2FEA5] group-hover:bg-[#E2FEA5]/10 group-hover:-translate-x-0.5 transition-all">
        <ArrowLeft size={16} />
      </div>
      {!collapsed && (
        <span
          className="text-[10px] font-bold tracking-widest uppercase truncate"
          style={{ color: COLOR_OFF, fontFamily: PX }}
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
      <div
        className={`shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
        style={{ color: active ? COLOR_ON : COLOR_OFF }}
      >
        <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
      </div>
      {!collapsed && (
        <span
          className="text-xs font-semibold tracking-wide truncate transition-colors"
          style={{
            color: active ? COLOR_ON : COLOR_OFF,
            fontFamily: FN,
          }}
        >
          {item.label}
        </span>
      )}
      {active && <ActiveIndicator />}
    </>
  );

  const className = `group relative flex items-center gap-4 rounded-2xl no-underline transition-all duration-300 ${
    collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
  }`;

  const styles = {
    backgroundColor: active ? ACTIVE_BG : "transparent",
    border: active ? "1px solid rgba(226, 254, 165, 0.1)" : "1px solid transparent",
  };

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        style={styles}
        title={collapsed ? item.label : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <a className={className} style={styles} title={collapsed ? item.label : undefined}>
      {content}
    </a>
  );
}

function GlobalNavItems({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  const { capabilities } = useAuth();

  return (
    <div className="flex flex-col gap-1.5">
      {GLOBAL_NAV.filter((item) => !item.visible || item.visible(capabilities)).map((item) => {
        const active = isGlobalActive(item.href, pathname);
        return <NavItemRow key={item.href} item={item} active={active} collapsed={collapsed} />;
      })}
    </div>
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
    <div className="flex flex-col gap-1.5">
      {tabs.map((tab) => {
        const active = activeHash === tab.key;
        return (
          <a
            key={tab.key}
            href={`#${tab.key}`}
            className={`group relative flex items-center gap-4 rounded-2xl no-underline transition-all duration-300 ${
              collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
            }`}
            style={{
              backgroundColor: active ? ACTIVE_BG : "transparent",
              border: active ? "1px solid rgba(226, 254, 165, 0.1)" : "1px solid transparent",
            }}
            title={collapsed ? tab.label : undefined}
          >
            <div
              className={`shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
              style={{ color: active ? COLOR_ON : COLOR_OFF }}
            >
              <tab.icon size={18} strokeWidth={active ? 2.5 : 2} />
            </div>
            {!collapsed && (
              <span
                className="text-xs font-semibold tracking-wide truncate transition-colors"
                style={{
                  color: active ? COLOR_ON : COLOR_OFF,
                  fontFamily: FN,
                }}
              >
                {tab.label}
              </span>
            )}
            {active && <ActiveIndicator />}
          </a>
        );
      })}
    </div>
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
      className="fixed left-0 top-0 hidden md:flex flex-col justify-between py-6 px-3 z-50 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width] backdrop-blur-xl border border-white/5 shadow-2xl"
      style={{
        width,
        height: "calc(100vh - 32px)",
        top: 16,
        left: 16,
        backgroundColor: "rgba(15, 44, 35, 0.98)",
        borderRadius: 24,
      }}
    >
      {/* Top section */}
      <div className="flex flex-col">
        {ctx.kind !== "global" ? (
          <BackButton
            href={ctx.backHref}
            label={
              ctx.kind === "hackathon"
                ? "Program Overview"
                : ctx.kind === "project"
                  ? "Project List"
                  : "Command Center"
            }
            collapsed={collapsed}
          />
        ) : (
          <LogoButton collapsed={collapsed} />
        )}

        <div className="mt-2">
          {ctx.kind !== "global" ? (
            <HashTabItems tabs={ctx.tabs} activeHash={activeHash} collapsed={collapsed} />
          ) : (
            <GlobalNavItems pathname={pathname} collapsed={collapsed} />
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={toggle}
          className={`group flex items-center gap-4 rounded-2xl border-none cursor-pointer transition-all duration-300 hover:bg-white/5 ${
            collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
          }`}
          style={{ backgroundColor: "transparent" }}
          title={collapsed ? "Expand Menu" : undefined}
        >
          <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-[#E2FEA5] transition-colors">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </div>
          {!collapsed && (
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: COLOR_OFF, fontFamily: PX }}
            >
              Collapse
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`group flex items-center gap-4 rounded-2xl border-none cursor-pointer transition-all duration-300 hover:bg-red-500/10 disabled:opacity-50 ${
            collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
          }`}
          style={{ backgroundColor: "transparent" }}
          title={collapsed ? "Log out" : undefined}
        >
          <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </div>
          {!collapsed && (
            <span
              className="text-[10px] font-bold tracking-widest uppercase transition-colors group-hover:text-red-400"
              style={{ color: COLOR_OFF, fontFamily: PX }}
            >
              Sign out
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
