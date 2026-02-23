'use client';

import React, { useState } from 'react';
import {
    Github,
    FileText,
    Download,
    Copy,
    Check,
    Settings,
    AlertCircle,
    Loader2,
    Code2,
    Database,
    FileCode
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FlattenRepoRequest, FlattenRepoResponse } from '@/types/github-flattener';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function RepoFlattener() {
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [branch, setBranch] = useState('');
    const [extensions, setExtensions] = useState('');
    const [ignorePatterns, setIgnorePatterns] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<FlattenRepoResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const payload: FlattenRepoRequest = {
                repoUrl: url,
                githubToken: token || undefined,
                branch: branch || undefined,
                includeExtensions: extensions ? extensions.split(',').map(s => s.trim()) : undefined,
                excludePatterns: ignorePatterns ? ignorePatterns.split(',').map(s => s.trim()) : undefined,
            };

            const res = await fetch('/api/flatten-repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to flatten repository');
            }

            setResponse(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (response?.content) {
            navigator.clipboard.writeText(response.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (response?.content) {
            const blob = new Blob([response.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flattened-repo.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-2">
                    Repo Flattener
                </h1>
                <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                    Turn any GitHub repository into a single file LLM context.
                    Prepare your codebase for AI analysis in seconds.
                </p>
            </div>

            {/* Main Input Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="repo-url" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Github className="w-4 h-4" />
                                Repository URL
                            </label>
                            <div className="relative">
                                <input
                                    id="repo-url"
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://github.com/owner/repo"
                                    className={cn(
                                        "w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800",
                                        "bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100",
                                        "focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all",
                                        "placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    )}
                                    required
                                />
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-600 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                            </button>
                        </div>

                        {/* Advanced Options */}
                        <div className={cn(
                            "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ease-in-out",
                            showAdvanced ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"
                        )}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">GitHub Token (Optional)</label>
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_..."
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-zinc-500">Required for private repos or higher rate limits.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Branch (Optional)</label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="main"
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Extensions (Comma separated)</label>
                                <input
                                    type="text"
                                    value={extensions}
                                    onChange={(e) => setExtensions(e.target.value)}
                                    placeholder=".ts, .tsx, .js"
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ignore Patterns</label>
                                <input
                                    type="text"
                                    value={ignorePatterns}
                                    onChange={(e) => setIgnorePatterns(e.target.value)}
                                    placeholder="test, docs, *.png"
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all",
                                loading
                                    ? "bg-zinc-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 active:scale-[0.98]"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Flattening...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Flatten Repository
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="w-full py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-zinc-200 dark:border-zinc-800 opacity-50"></div>
                        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Processing Repository</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">Fetching files from GitHub... this may take a moment.</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {response && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatsCard
                            label="Total Files"
                            value={response.stats.totalFiles.toString()}
                            icon={<FileCode className="w-4 h-4" />}
                        />
                        <StatsCard
                            label="Total Size"
                            value={(response.stats.totalSize / 1024).toFixed(2) + ' KB'}
                            icon={<Database className="w-4 h-4" />}
                        />
                        <StatsCard
                            label="Characters"
                            value={response.stats.totalCharacters.toLocaleString()}
                            icon={<Code2 className="w-4 h-4" />}
                        />
                        <StatsCard
                            label="Est. Tokens"
                            value={'~' + Math.ceil(response.stats.totalCharacters / 4).toLocaleString()}
                            icon={<FileText className="w-4 h-4" />}
                        />
                    </div>

                    {/* Output Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                            <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Flattened Output</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                    title="Download as File"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <textarea
                                value={response.content}
                                readOnly
                                className="w-full h-96 p-4 font-mono text-sm bg-zinc-50 dark:bg-black text-zinc-800 dark:text-zinc-300 resize-none outline-none"
                            />
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-50 dark:from-black to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                {icon}
                {label}
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {value}
            </div>
        </div>
    );
}
