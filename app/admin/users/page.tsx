"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  oauth_provider: string | null;
  created_at: string;
};

const ROLES = ["builder", "host", "viewer", "admin", "judge"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin?view=users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 animate-pulse">Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        User Management
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        {users.length} registered users
      </p>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Provider</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                  {u.email}
                </td>
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {u.display_name ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-zinc-500 text-xs">
                  {u.oauth_provider ?? "email"}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={updatingId === u.id}
                    className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-zinc-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
