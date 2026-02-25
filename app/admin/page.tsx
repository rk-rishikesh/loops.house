"use client";

import { useEffect, useState } from "react";
import { Users, FolderOpen, Rocket, FileText, Clock } from "lucide-react";

type Metrics = {
  total_users: number;
  total_profiles: number;
  total_boosters: number;
  total_submissions: number;
  pending_host_applications: number;
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin?view=metrics")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized or fetch error");
        return r.json();
      })
      .then(setMetrics)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-zinc-500 mt-2">
          You need admin role to access this page.
        </p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 animate-pulse">Loading metrics...</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: metrics.total_users, icon: Users, color: "text-blue-600" },
    { label: "Loops Profiles", value: metrics.total_profiles, icon: FolderOpen, color: "text-violet-600" },
    { label: "Boosters", value: metrics.total_boosters, icon: Rocket, color: "text-amber-600" },
    { label: "Submissions", value: metrics.total_submissions, icon: FileText, color: "text-green-600" },
    { label: "Pending Applications", value: metrics.pending_host_applications, icon: Clock, color: "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
        Platform Overview
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
