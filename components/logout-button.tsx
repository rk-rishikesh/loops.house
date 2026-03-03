"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export function LogoutButton() {
  const queryClient = useQueryClient();

  return (
    <button
      type="button"
      onClick={async () => {
        queryClient.clear();
        try {
          await signOut();
        } catch {
          // Lock timeout — force-clear Supabase cookies so middleware sees no session
          document.cookie.split(";").forEach((c) => {
            const name = c.trim().split("=")[0];
            if (name.startsWith("sb-") || name === "x-user-role" || name === "x-user-role-hint") {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
          });
        }
        // Hard navigation ensures cookies are cleared before middleware evaluates
        window.location.href = "/login";
      }}
      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
