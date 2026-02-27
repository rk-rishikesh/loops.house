"use client";

import { Suspense } from "react";
import NewProfileContent from "@/app/builder/new/page";

export default function ResidencyNewPage() {
  // We simply reuse the existing multi-step project creation flow.
  // URL params (team_id, booster_id) and AI agents remain the same.
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <NewProfileContent />
    </Suspense>
  );
}

