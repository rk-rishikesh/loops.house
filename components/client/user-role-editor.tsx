"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRoleAction } from "@/lib/actions";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  oauth_provider: string | null;
  created_at: string;
};

const ROLES = ["builder", "host", "viewer", "admin", "judge"] as const;

export function UserRoleEditor({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await updateUserRoleAction(userId, newRole);
      router.refresh();
    });
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
                    disabled={isPending}
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
