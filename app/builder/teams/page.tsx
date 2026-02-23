"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { getTeams, saveTeam } from "@/lib/storage";

export default function BuilderTeamsPage() {
  const [teams, setTeams] = useState(getTeams());
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    saveTeam({
      id: `team_${Date.now()}`,
      name: newName.trim(),
      created_at: new Date().toISOString(),
    });
    setTeams(getTeams());
    setNewName("");
    setAdding(false);
  };

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My teams</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Create a team, then create Loops profiles (projects) under that team.
      </p>

      <div className="mt-8 max-w-md">
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-3.5 text-zinc-600 dark:text-zinc-400 hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 hover:text-violet-600 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Create team
          </button>
        ) : (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Team name"
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(""); }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-zinc-600 dark:text-zinc-400"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <ul className="mt-8 space-y-3">
        {teams.length === 0 && !adding && (
          <li className="text-zinc-500 dark:text-zinc-400 py-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5">
            No teams yet. Create one above, then create a new project and select the team.
          </li>
        )}
        {teams.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
          >
            <Users className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.id}</p>
            </div>
            <Link
              href={`/builder/new?team_id=${t.id}`}
              className="ml-auto text-sm text-violet-600 hover:underline"
            >
              New profile →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
