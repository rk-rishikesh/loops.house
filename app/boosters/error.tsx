"use client";

import { useEffect } from "react";

export default function BoostersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Boosters error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700"
      >
        Try again
      </button>
    </div>
  );
}
