import Link from "next/link";
import { Shield, Users, FileCheck, LayoutDashboard } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-red-600">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Loops · Admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-red-600">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </Link>
            <Link href="/admin/users" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-red-600">
              <Users className="w-4 h-4" /> Users
            </Link>
            <Link href="/admin/applications" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-red-600">
              <FileCheck className="w-4 h-4" /> Applications
            </Link>
            <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" aria-hidden />
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
