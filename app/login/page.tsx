"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hammer, LayoutDashboard, Store, ArrowLeft } from "lucide-react";
import { setRole, type AppRole } from "@/lib/auth";

const ROLES: { role: AppRole; label: string; description: string; href: string; icon: React.ElementType }[] = [
  { role: "builder", label: "Builder", description: "Create projects, ideate, and apply to boosters.", href: "/boosters", icon: Hammer },
  { role: "host", label: "Host", description: "Manage boosters, analytics, and AI judging.", href: "/host", icon: LayoutDashboard },
  { role: "viewer", label: "Viewer", description: "Browse projects and chat with project profiles.", href: "/viewer", icon: Store },
];

export default function LoginPage() {
  const router = useRouter();

  const handleSelect = (role: AppRole, href: string) => {
    setRole(role);
    router.push(href);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to portal
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Login</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Select your role to continue. No password required (demo).
        </p>

        <div className="mt-8 space-y-4">
          {ROLES.map(({ role, label, description, href, icon: Icon }) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelect(role, href)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors text-left"
            >
              <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-zinc-900 dark:text-white">{label}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
              </div>
              <span className="text-violet-600 dark:text-violet-400 text-sm font-medium shrink-0">Continue →</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
