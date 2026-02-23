// types/github-flattener.ts
// Shared TypeScript types for GitHub Repository Flattener

export interface FlattenRepoRequest {
    repoUrl: string;
    githubToken?: string;
    maxFileSize?: number;
    branch?: string;
    includeExtensions?: string[];
    excludePatterns?: string[];
    format?: 'markdown' | 'xml';
}

export interface FileData {
    path: string;
    content: string;
    size: number;
}

export interface FileInfo {
    path: string;
    size: number;
}

export interface FileTypeStats {
    [extension: string]: number;
}

export interface RepoStats {
    totalFiles: number;
    totalSize: number;
    totalCharacters: number;
    fileTypes: FileTypeStats;
    repository: string;
    branch: string;
}

export interface FlattenRepoResponse {
    success: boolean;
    content: string;
    stats: RepoStats;
    files: FileInfo[];
}

export interface ErrorResponse {
    error: string;
    message?: string;
}

export interface ParsedGitHubUrl {
    owner: string | null;
    repo: string | null;
}

export interface GitHubTreeItem {
    path?: string;
    mode?: string;
    type?: string;
    sha?: string;
    size?: number;
    url?: string;
}

export type OutputFormat = 'markdown' | 'xml';

export const DEFAULT_CONFIG = {
    maxFileSize: 100000,
    format: 'markdown' as OutputFormat,
    allowedExtensions: [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
        '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
        '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml',
        '.md', '.txt', '.sh', '.bash', '.sql', '.r', '.m', '.dart',
        '.vue', '.svelte', '.astro', '.lua', '.pl', '.jl', 'Dockerfile'
    ],
    ignorePatterns: [
        'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        '.DS_Store', '__pycache__', '.pytest_cache', '.env', '.vscode',
        '.idea', 'vendor', 'target', 'bin', 'obj', 'out', '.gradle',
        '.mvn', 'venv', 'env', '__mocks__', 'test-results'
    ]
} as const;