"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { BasicCapabilities } from "@/lib/capabilities";
import { CollapseButton, LogoutButton } from "./bottom-actions";
import { useHackathonTabs } from "./hackathon-tab-store";
import { BackButton, LogoButton } from "./nav-chrome";
import { getHackathonTabs, resolveNavContext } from "./nav-config";
import { GlobalNavItems, HashTabItems, HostNavItems } from "./nav-items";
import { NAV_WIDTH_COLLAPSED, NAV_WIDTH_EXPANDED, useCollapsed } from "./use-collapsed";

export function SideNav({ capabilities }: { capabilities: BasicCapabilities | null }) {
  const pathname = usePathname();
  const ctx = resolveNavContext(pathname);
  const { collapsed, toggle } = useCollapsed();
  const hackathonOverride = useHackathonTabs();

  const hasHashTabs = ctx.kind === "hackathon" || ctx.kind === "project";
  const defaultTab = hasHashTabs ? ctx.defaultTab : "";

  // Dynamic tabs for hackathon context — phase-aware filtering
  const activeTabs =
    ctx.kind === "hackathon"
      ? getHackathonTabs(hackathonOverride)
      : ctx.kind === "project"
        ? ctx.tabs
        : [];
  const [activeHash, setActiveHash] = useState(defaultTab);

  useEffect(() => {
    if (!hasHashTabs) return;
    const read = () => setActiveHash(window.location.hash.replace("#", "") || defaultTab);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [hasHashTabs, defaultTab]);

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
              ctx.kind === "project"
                ? "Project List"
                : ctx.kind === "hostHackathon" && ctx.backHref !== "/host"
                  ? "Dashboard"
                  : "Command Center"
            }
            collapsed={collapsed}
          />
        ) : (
          <LogoButton collapsed={collapsed} />
        )}

        <div className="mt-2">
          {ctx.kind === "hostHackathon" ? (
            <HostNavItems
              items={ctx.items}
              pathname={pathname}
              hackathonId={ctx.hackathonId}
              collapsed={collapsed}
            />
          ) : ctx.kind !== "global" ? (
            <HashTabItems tabs={activeTabs} activeHash={activeHash} collapsed={collapsed} />
          ) : (
            <GlobalNavItems pathname={pathname} collapsed={collapsed} capabilities={capabilities} />
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 pt-6 border-t border-white/5">
        <CollapseButton collapsed={collapsed} onToggle={toggle} />
        <LogoutButton collapsed={collapsed} />
      </div>
    </nav>
  );
}
