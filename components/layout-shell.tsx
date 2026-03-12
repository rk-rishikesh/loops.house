"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
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

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/login";
  const navWidth = useNavWidth();

  if (isLanding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div
      className="hidden md:block min-h-screen transition-[margin] duration-200"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <SideNav />
      <div style={{ marginLeft: navWidth + 32 }}>{children}</div>
    </div>
  );
}
