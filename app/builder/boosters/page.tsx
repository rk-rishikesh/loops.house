import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBoostersServer } from "@/lib/server-data";
import { BoosterTabFilter } from "@/components/client/booster-tab-filter";

export default async function BuilderBoostersPage() {
  const boosters = await getBoostersServer();

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Explore Boosters</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Find opportunities and apply with a project. Idea, momentum, and capital boosters.
      </p>

      <BoosterTabFilter boosters={boosters} />
    </div>
  );
}
