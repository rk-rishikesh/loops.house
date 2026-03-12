"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminToggleEventCreatorAction, adminToggleAdminAction } from "@/lib/actions";
import type { UserListItem } from "@/lib/data-mappers";

export function UserRoleEditor({ users }: { users: UserListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleAdmin(userId: string, checked: boolean) {
    startTransition(async () => {
      await adminToggleAdminAction(userId, checked);
      router.refresh();
    });
  }

  function handleToggleEventCreator(userId: string, checked: boolean) {
    startTransition(async () => {
      await adminToggleEventCreatorAction(userId, checked);
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
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Admin</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-600 dark:text-zinc-400">Event Creator</th>
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
                  {u.display_name ?? "\u2014"}
                </td>
                <td className="px-4 py-2.5 text-zinc-500 text-xs">
                  {u.oauth_provider ?? "email"}
                </td>
                <td className="px-4 py-2.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={u.is_admin}
                      onChange={(e) => handleToggleAdmin(u.id, e.target.checked)}
                      disabled={isPending}
                      className="rounded border-zinc-300 dark:border-zinc-700"
                    />
                    <span className="text-xs text-zinc-500">{u.is_admin ? "Yes" : "No"}</span>
                  </label>
                </td>
                <td className="px-4 py-2.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={u.is_event_creator}
                      onChange={(e) => handleToggleEventCreator(u.id, e.target.checked)}
                      disabled={isPending}
                      className="rounded border-zinc-300 dark:border-zinc-700"
                    />
                    <span className="text-xs text-zinc-500">{u.is_event_creator ? "Yes" : "No"}</span>
                  </label>
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
