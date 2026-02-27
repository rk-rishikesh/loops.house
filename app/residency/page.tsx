"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/app/providers";

export default function ResidencyLandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleApplyClick = () => {
    if (loading) return;
    if (!user) {
      router.push("/login?redirect=/residency");
      return;
    }
    // For now route to a generic residency id, this can be parameterized later.
    router.push("/residency/default/new");
  };

  return (
    <main className="min-h-screen bg-[#EBECE7] flex items-center justify-center px-4">
      <div className="max-w-3xl w-full rounded-3xl bg-white shadow-sm border border-zinc-200 p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-zinc-400 uppercase">
              Residency
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900">
              Apply to the Loops Residency
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              Turn your hackathon project into a product with dedicated mentoring, boosters,
              and a structured build loop.
            </p>
          </div>
          <div className="sm:text-right">
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-[#20332b] text-[#ECEEE5] px-5 py-2.5 text-sm font-medium hover:bg-[#17241d] disabled:opacity-60"
            >
              Apply now
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && !loading && (
              <p className="mt-2 text-xs text-zinc-500">
                You&apos;ll be asked to log in before continuing.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
