import Link from "next/link";
import { LayoutDashboard, BarChart3, Gavel, Settings, UserPlus } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import type { AppRole } from "@/lib/supabase/types";

export function HostNav({ role }: { role: AppRole | null }) {
  const isJudge = role === "judge";

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-amber-600">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-semibold">{isJudge ? "Loops \u00b7 Judge" : "Loops \u00b7 Host"}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {!isJudge && (
            <Link href="/host" className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              Dashboard
            </Link>
          )}
          {!isJudge && (
            <Link href="/host/analytics" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
          )}
          <Link href="/host/judging" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
            <Gavel className="w-4 h-4" /> Judging
          </Link>
          {!isJudge && (
            <Link href="/host/hackathons" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <Settings className="w-4 h-4" /> Hackathons
            </Link>
          )}
          {!isJudge && (
            <Link href="/host/judges" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <UserPlus className="w-4 h-4" /> Judges
            </Link>
          )}
          <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" aria-hidden />
          <LogoutButton segment={false} />
        </nav>
      </div>
    </header>
  );
}
