"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Hides the global "Switch to Desktop" overlay only on /v/:id screens.
 */
export function MobileBlockerBypass() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/v/")) return;
    const el = document.getElementById("loops-mobile-blocker");
    if (el) el.style.display = "none";
  }, [pathname]);

  return null;
}
