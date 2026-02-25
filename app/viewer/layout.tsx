import Link from "next/link";
import { Store } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function ViewerLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600">
            <Store className="w-5 h-5" />
            <span className="font-semibold">Loops · Store</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/viewer" className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600">
              Browse projects
            </Link>
            <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" aria-hidden />
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
