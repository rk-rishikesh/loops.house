"use client";

import type { BasicCapabilities } from "@/lib/capabilities";
import { COLOR_ON, COLOR_OFF, ACTIVE_BG, FN } from "./styles";
import { ActiveIndicator, NavItemRow } from "./nav-row";
import { GLOBAL_NAV, isGlobalActive } from "./nav-config";
import type { NavItem, TabItem } from "./nav-config";

export function GlobalNavItems({
  pathname,
  collapsed,
  capabilities,
}: {
  pathname: string;
  collapsed: boolean;
  capabilities: BasicCapabilities | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
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
    </div>
  );
}

export function HostNavItems({
  items,
  pathname,
  hackathonId,
  collapsed,
}: {
  items: NavItem[];
  pathname: string;
  hackathonId: string;
  collapsed: boolean;
}) {
  const dashHref = `/host/${hackathonId}`;
  const managePrefix = `/host/${hackathonId}/manage`;

  function isActive(href: string) {
    if (href === dashHref) return pathname === dashHref;
    if (href === managePrefix) return pathname === managePrefix;
    if (href === `${managePrefix}/edit`) {
      return (
        pathname.startsWith(`${managePrefix}/edit`) ||
        pathname.startsWith(`${managePrefix}/info`)
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <NavItemRow
          key={item.href}
          item={item}
          active={isActive(item.href)}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

export function HashTabItems({
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
              collapsed
                ? "justify-center w-11 h-11 mx-auto"
                : "w-full h-11 px-4"
            }`}
            style={{
              backgroundColor: active ? ACTIVE_BG : "transparent",
              border: active
                ? "1px solid rgba(226, 254, 165, 0.1)"
                : "1px solid transparent",
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
