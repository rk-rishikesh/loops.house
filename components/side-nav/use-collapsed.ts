"use client";

import { useEffect, useState } from "react";

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

export function useCollapsed() {
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
