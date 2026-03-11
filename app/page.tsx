import Link from "next/link";
import { LogIn, Lightbulb, LayoutGrid } from "lucide-react";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 selection:bg-violet-200 selection:text-violet-900 dark:selection:bg-violet-900 dark:selection:text-violet-100">
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Loops
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Build, host, and discover hackathon projects.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/login"
            className="group flex flex-col items-center p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
          >
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Login</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Sign in and select your role (Builder, Host, or Viewer).
            </p>
          </Link>

          <Link
            href="/hackathons"
            className="group flex flex-col items-center p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
          >
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Explore Hackathons</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Browse hackathons and apply with your project.
            </p>
          </Link>

          <Link
            href="/viewer"
            className="group flex flex-col items-center p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
          >
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Explore Projects</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Browse all projects. Chat and ask questions about code.
            </p>
          </Link>
        </div>

        <footer className="relative z-10 mt-20 py-8 text-center text-zinc-400 text-sm">
          <p>© {new Date().getFullYear()} Loops.</p>
        </footer>
      </div>
    </main>
  );
}
