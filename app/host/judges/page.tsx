"use client";

import { useState, useEffect } from "react";
import { getBoosters } from "@/lib/storage";
import type { StoredBooster } from "@/lib/storage";

type JudgeInvite = {
  id: string;
  booster_id: string;
  judge_user_id: string;
  accepted: boolean;
  created_at: string;
  users?: { email: string; display_name: string | null };
};

export default function JudgeManagementPage() {
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [selectedBooster, setSelectedBooster] = useState<string>("");
  const [invites, setInvites] = useState<JudgeInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getBoosters().then(setBoosters);
  }, []);

  useEffect(() => {
    if (!selectedBooster) return;
    fetch(`/api/judge-invites?booster_id=${selectedBooster}`)
      .then((r) => r.json())
      .then(setInvites)
      .catch(() => setInvites([]));
  }, [selectedBooster]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooster || !email) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/judge-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booster_id: selectedBooster,
          judge_email: email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Invited ${email} as judge`);
      setEmail("");
      // Refresh invites
      const updated = await fetch(`/api/judge-invites?booster_id=${selectedBooster}`).then((r) => r.json());
      setInvites(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite judge");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Judge Management
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Invite judges to your Boosters by email. They must have an account on the platform.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Select Booster
        </label>
        <select
          value={selectedBooster}
          onChange={(e) => setSelectedBooster(e.target.value)}
          className="w-full max-w-md rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        >
          <option value="">Choose a booster...</option>
          {boosters.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.booster_type})
            </option>
          ))}
        </select>
      </div>

      {selectedBooster && (
        <>
          <form onSubmit={handleInvite} className="flex items-end gap-3 mb-8">
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Judge Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="judge@example.com"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !email}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {inviting ? "Inviting..." : "Invite Judge"}
            </button>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {success}
            </div>
          )}

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Invited Judges
          </h2>
          {invites.length === 0 ? (
            <p className="text-sm text-zinc-500">No judges invited yet.</p>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                    <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Invited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {invites.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                        {inv.users?.email ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                        {inv.users?.display_name ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            inv.accepted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {inv.accepted ? "Accepted" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-500 text-xs">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
