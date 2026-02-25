"use client";

import { useEffect, useState } from "react";

type HostApp = {
  id: string;
  user_id: string;
  booster_type: string;
  event_name: string;
  expected_participants: number | null;
  contact: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  created_at: string;
  users?: { email: string; display_name: string | null };
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<HostApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/host-applications")
      .then((r) => r.json())
      .then((data) => {
        setApps(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setProcessingId(id);
    try {
      const res = await fetch("/api/host-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a)),
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 animate-pulse">Loading applications...</p>
      </div>
    );
  }

  const pending = apps.filter((a) => a.status === "pending");
  const processed = apps.filter((a) => a.status !== "pending");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Host Applications
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        {pending.length} pending, {processed.length} processed
      </p>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Pending Review
          </h2>
          <div className="space-y-4">
            {pending.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {app.event_name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {app.users?.email ?? app.user_id} &middot;{" "}
                      <span className="capitalize">{app.booster_type}</span> Booster
                      {app.expected_participants && ` · ${app.expected_participants} expected`}
                    </p>
                    {app.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        {app.description}
                      </p>
                    )}
                    {app.contact && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Contact: {app.contact}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(app.id, "approved")}
                      disabled={processingId === app.id}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(app.id, "rejected")}
                      disabled={processingId === app.id}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {processed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Processed
          </h2>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Event</th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Applicant</th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {processed.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {app.event_name}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {app.users?.email ?? app.user_id}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs capitalize">
                      {app.booster_type}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {apps.length === 0 && (
        <p className="text-zinc-500 text-center py-12">No applications yet.</p>
      )}
    </div>
  );
}
