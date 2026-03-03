"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

function clearAuthCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name.startsWith("sb-") || name === "x-user-role-hint") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await signOut();
        } catch {
          // Navigator lock timeout — non-fatal
        }
        // Always force-clear cookies so middleware sees no session
        clearAuthCookies();
        window.location.href = "/login";
      }}
      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
