"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { getBoosters, saveBooster, type StoredBooster, type BoosterType } from "@/lib/storage";

const BOOSTER_TYPES: { value: BoosterType; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "momentum", label: "Momentum" },
  { value: "capital", label: "Capital" },
];

export default function HostBoostersPage() {
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [editing, setEditing] = useState<StoredBooster | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    problem_statements: "",
    theme: "",
    sponsor_tracks: "",
    booster_type: "idea" as BoosterType,
  });

  useEffect(() => {
    setBoosters(getBoosters());
  }, []);

  const handleSave = () => {
    const id = form.id || `booster_${Date.now()}`;
    const problem_statements = form.problem_statements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const sponsor_tracks = form.sponsor_tracks
      .split("\n")
      .map((line) => {
        const [sponsor, ...rest] = line.split(":");
        return sponsor && rest.length ? { sponsor: sponsor.trim(), track_description: rest.join(":").trim() } : null;
      })
      .filter(Boolean) as { sponsor: string; track_description: string }[];

    const b: StoredBooster = {
      id,
      name: form.name || "Unnamed booster",
      problem_statements,
      theme: form.theme || undefined,
      sponsor_tracks: sponsor_tracks.length ? sponsor_tracks : undefined,
      booster_type: form.booster_type,
      created_at: editing?.created_at ?? new Date().toISOString(),
    };
    saveBooster(b);
    setBoosters(getBoosters());
    setEditing(null);
    setForm({ id: "", name: "", problem_statements: "", theme: "", sponsor_tracks: "", booster_type: "idea" });
  };

  const startNew = () => {
    setEditing(null);
    setForm({
      id: "",
      name: "",
      problem_statements: "",
      theme: "",
      sponsor_tracks: "",
      booster_type: "idea",
    });
  };

  const edit = (b: StoredBooster) => {
    setEditing(b);
    setForm({
      id: b.id,
      name: b.name,
      problem_statements: b.problem_statements.join("\n"),
      theme: b.theme ?? "",
      sponsor_tracks: b.sponsor_tracks?.map((t) => `${t.sponsor}: ${t.track_description}`).join("\n") ?? "",
      booster_type: b.booster_type ?? "idea",
    });
  };

  return (
    <div>
      <Link
        href="/host"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Boosters</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Create and edit idea, momentum, and capital boosters. Stored in this browser.
      </p>

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Saved boosters</h2>
            <button
              onClick={startNew}
              className="flex items-center gap-1 text-sm text-amber-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
          <ul className="space-y-2">
            {boosters.length === 0 && (
              <li className="text-zinc-500 py-4">No boosters yet. Click New to add one.</li>
            )}
            {boosters.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{b.name}</p>
                  <p className="text-xs text-zinc-500">{b.problem_statements.length} problem statements · {(b.booster_type ?? "idea")}</p>
                </div>
                <button
                  onClick={() => edit(b)}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            {editing ? "Edit booster" : "New booster"}
          </h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Booster name"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ID (optional)</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              placeholder="e.g. booster_2025"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme (optional)</label>
            <input
              type="text"
              value={form.theme}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
              placeholder="e.g. AI for good"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster type</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Choose where this booster appears: Idea, Momentum, or Capital. Each type has its own list for builders.</p>
            <select
              value={form.booster_type}
              onChange={(e) => setForm((f) => ({ ...f, booster_type: e.target.value as BoosterType }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              {BOOSTER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Problem statements (one per line)</label>
            <textarea
              rows={4}
              value={form.problem_statements}
              onChange={(e) => setForm((f) => ({ ...f, problem_statements: e.target.value }))}
              placeholder="Build a tool that...&#10;Solve the problem of..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sponsor tracks (one per line: Sponsor: Description)</label>
            <textarea
              rows={2}
              value={form.sponsor_tracks}
              onChange={(e) => setForm((f) => ({ ...f, sponsor_tracks: e.target.value }))}
              placeholder="Acme: Build with Acme API&#10;Beta: Use Beta SDK for..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
