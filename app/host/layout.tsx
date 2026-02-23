import Link from "next/link";
import { LayoutDashboard, BarChart3, Gavel, Settings } from "lucide-react";

export default function HostLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-amber-600">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-semibold">Loops · Host</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/host" className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600">Dashboard</Link>
            <Link href="/host/analytics" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <Link href="/host/judging" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <Gavel className="w-4 h-4" /> Judging
            </Link>
            <Link href="/host/boosters" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-amber-600">
              <Settings className="w-4 h-4" /> Boosters
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
