"use client";

import { useSyncExternalStore } from "react";
import { onNavToggle } from "@/components/side-nav";

function useNavCollapsed() {
  return useSyncExternalStore(
    onNavToggle,
    () => localStorage.getItem("sidenav-collapsed") === "true",
    () => false,
  );
}

export function NotificationsCenterContainer({ children }: { children: React.ReactNode }) {
  const collapsed = useNavCollapsed();
  return (
    <div className={`${collapsed ? "max-w-7xl" : "max-w-5xl"} w-full flex-1 grid place-items-center`}>
      {children}
    </div>
  );
}

