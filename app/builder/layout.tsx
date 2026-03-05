// import Link from "next/link";
// import { Hammer, Lightbulb, FolderOpen, Users, Share2, MessageSquare, FlaskConical } from "lucide-react";
// import { LogoutButton } from "@/components/logout-button";

export default function BuilderLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-violet-600">
            <Hammer className="w-5 h-5" />
            <span className="font-semibold">Loops · Builder</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/builder" className="px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              Dashboard
            </Link>
            <Link href="/boosters" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <Lightbulb className="w-4 h-4" /> Boosters
            </Link>
            <Link href="/builder/projects" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <FolderOpen className="w-4 h-4" /> Projects
            </Link>
            <Link href="/builder/teams" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <Users className="w-4 h-4" /> Teams
            </Link>
            <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" aria-hidden />
            <Link href="/builder/share" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <Share2 className="w-4 h-4" /> Share
            </Link>
            <Link href="/builder/ideate" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <MessageSquare className="w-4 h-4" /> Ideate
            </Link>
            <Link href="/builder/test" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" title="Test agents">
              <FlaskConical className="w-4 h-4" />
            </Link>
            <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" aria-hidden />
            <LogoutButton />
          </nav>
        </div>
      </header> */}
      <main>{children}</main>
    </div>
  );
}
