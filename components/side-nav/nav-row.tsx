"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { COLOR_ON, COLOR_OFF, ACTIVE_BG, FN } from "./styles";

export function ActiveIndicator() {
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

export function NavItemRow({
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
    border: active
      ? "1px solid rgba(226, 254, 165, 0.1)"
      : "1px solid transparent",
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
    <a
      className={className}
      style={styles}
      title={collapsed ? item.label : undefined}
    >
      {content}
    </a>
  );
}
