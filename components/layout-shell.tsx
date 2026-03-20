"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { BasicCapabilities } from "@/lib/capabilities";
import {
  NAV_WIDTH_COLLAPSED,
  NAV_WIDTH_EXPANDED,
  onNavToggle,
  SideNav,
} from "@/components/side-nav";

function useNavWidth() {
  const collapsed = useSyncExternalStore(
    onNavToggle,
    () => localStorage.getItem("sidenav-collapsed") === "true",
    () => false,
  );
  return collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED;
}

export function LayoutShell({
  children,
  capabilities,
}: {
  children: React.ReactNode;
  capabilities: BasicCapabilities | null;
}) {
  const pathname = usePathname();
  const isLanding =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/shanghai" ||
    pathname.startsWith("/shanghai/") ||
    pathname.startsWith("/v/");
  const navWidth = useNavWidth();

  if (isLanding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div
      className="hidden md:block min-h-screen transition-[margin] duration-200"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <SideNav capabilities={capabilities} />
      <div style={{ marginLeft: navWidth + 32 }}>{children}</div>
    </div>
  );
}
