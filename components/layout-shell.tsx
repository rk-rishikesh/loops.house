"use client";

import { usePathname } from "next/navigation";
import { SideNav } from "@/components/side-nav";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/login";

  if (isLanding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div
      className="hidden md:block min-h-screen"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <SideNav />
      <div style={{ marginLeft: 96 }}>{children}</div>
    </div>
  );
}
