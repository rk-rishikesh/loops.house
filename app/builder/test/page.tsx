"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, Video, Palette, Loader2, Check, X } from "lucide-react";

type TabId = "code" | "demo" | "theme";

export default function SubAgentsTestPage() {
  const [activeTab, setActiveTab] = useState<TabId>("code");

  const [codeUrl, setCodeUrl] = useState("https://github.com/vercel/next.js");
  const [codeToken, setCodeToken] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeResult, setCodeResult] = useState<Record<string, unknown> | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [demoUrl, setDemoUrl] = useState("");
  const [demoProblem, setDemoProblem] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<Record<string, unknown> | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const [themeLogo, setThemeLogo] = useState("");
  const [themeScreenshots, setThemeScreenshots] = useState("");
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeResult, setThemeResult] = useState<Record<string, unknown> | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);

  const runCodeReader = async () => {
    setCodeLoading(true);
    setCodeResult(null);
    setCodeError(null);
    try {
      const res = await fetch("/api/sub-agents/code-reader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_url: codeUrl,
          github_token: codeToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Code reader failed");
      setCodeResult(data);
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setCodeLoading(false);
    }
  };

  const runDemoReader = async () => {
    setDemoLoading(true);
    setDemoResult(null);
    setDemoError(null);
    try {
      const res = await fetch("/api/sub-agents/demo-reader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: demoUrl,
          problem_statement: demoProblem || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Demo reader failed");
      setDemoResult(data);
    } catch (e) {
      setDemoError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setDemoLoading(false);
    }
  };

  const runThemeReader = async () => {
    setThemeLoading(true);
    setThemeResult(null);
    setThemeError(null);
    try {
      const screenshots = themeScreenshots
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/sub-agents/theme-reader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: themeLogo || undefined,
          screenshot_urls: screenshots,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Theme reader failed");
      setThemeResult(data);
    } catch (e) {
      setThemeError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setThemeLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "code", label: "Code reader", icon: Code2 },
    { id: "demo", label: "Demo reader", icon: Video },
    { id: "theme", label: "Theme reader", icon: Palette },
  ];

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sub-agents test</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Test code-reader, demo-reader, and theme-reader individually before running the full profile creator.
      </p>

      <div className="mt-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl">
        {activeTab === "code" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">GitHub repo URL *</label>
              <input
                type="url"
                value={codeUrl}
                onChange={(e) => setCodeUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">GitHub token (optional, for private repos)</label>
              <input
                type="password"
                value={codeToken}
                onChange={(e) => setCodeToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <button
              onClick={runCodeReader}
              disabled={codeLoading || !codeUrl.trim()}
              className="flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
              Run code reader
            </button>
            {codeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <X className="w-4 h-4 shrink-0" />
                {codeError}
              </div>
            )}
            {codeResult && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <Check className="w-4 h-4" /> Success
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tech stack</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(codeResult.tech_stack) ? codeResult.tech_stack : []).length > 0 ? (
                      (codeResult.tech_stack as string[]).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 text-xs">None detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Flattened codebase (file-by-file)</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    {typeof codeResult.flattened_codebase === "string"
                      ? `${(codeResult.flattened_codebase.length / 1024).toFixed(1)} KB total · scroll to browse`
                      : ""}
                  </p>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 max-h-[480px] overflow-auto">
                    <pre className="p-4 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words font-mono">
                      {typeof codeResult.flattened_codebase === "string"
                        ? codeResult.flattened_codebase.length > 120000
                          ? codeResult.flattened_codebase.slice(0, 120000) + "\n\n... (truncated for display)"
                          : codeResult.flattened_codebase
                        : ""}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "demo" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">YouTube URL *</label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Problem statement (optional)</label>
              <textarea
                value={demoProblem}
                onChange={(e) => setDemoProblem(e.target.value)}
                placeholder="For alignment check"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <button
              onClick={runDemoReader}
              disabled={demoLoading || !demoUrl.trim()}
              className="flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              Run demo reader
            </button>
            {demoError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <X className="w-4 h-4 shrink-0" />
                {demoError}
              </div>
            )}
            {demoResult && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <Check className="w-4 h-4" /> Success
                </div>
                <pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
                  {JSON.stringify(demoResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "theme" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Logo URL (optional)</label>
              <input
                type="url"
                value={themeLogo}
                onChange={(e) => setThemeLogo(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Screenshot URLs (one per line, optional)</label>
              <textarea
                value={themeScreenshots}
                onChange={(e) => setThemeScreenshots(e.target.value)}
                placeholder="https://example.com/screenshot1.png"
                rows={3}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <button
              onClick={runThemeReader}
              disabled={themeLoading}
              className="flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {themeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
              Run theme reader
            </button>
            {themeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <X className="w-4 h-4 shrink-0" />
                {themeError}
              </div>
            )}
            {themeResult && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <Check className="w-4 h-4" /> Success
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  {Boolean(themeResult.primary_color) && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-12 h-12 rounded-lg border border-zinc-300" style={{ backgroundColor: String(themeResult.primary_color) }} />
                      <span className="text-xs text-zinc-500">Primary</span>
                    </div>
                  )}
                  {Boolean(themeResult.accent_color) && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-12 h-12 rounded-lg border border-zinc-300" style={{ backgroundColor: String(themeResult.accent_color) }} />
                      <span className="text-xs text-zinc-500">Accent</span>
                    </div>
                  )}
                  {Boolean(themeResult.secondary_color) && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-12 h-12 rounded-lg border border-zinc-300" style={{ backgroundColor: String(themeResult.secondary_color) }} />
                      <span className="text-xs text-zinc-500">Secondary</span>
                    </div>
                  )}
                </div>
                <pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(themeResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
