// lib/github-utils.ts
// Utility functions for GitHub repository processing

import { Octokit } from '@octokit/rest';
import type {
    ParsedGitHubUrl,
    FileData,
    FileTypeStats
} from '@/types/github-flattener';

/**
 * Parse various GitHub URL formats
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
    const patterns: RegExp[] = [
        /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/,
        /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)/,
        /github\.com\/([^\/]+)\/([^\/]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace('.git', '').split('?')[0]
            };
        }
    }

    return { owner: null, repo: null };
}

/**
 * Check if a file path should be ignored
 */
export function shouldIgnore(path: string, patterns: readonly string[]): boolean {
    const parts = path.split('/');
    return parts.some(part =>
        patterns.includes(part) ||
        (part.startsWith('.') && part !== '.')
    );
}

/**
 * Check if file has an allowed extension
 */
export function hasAllowedExtension(path: string, extensions: readonly string[]): boolean {
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    return extensions.includes(ext);
}

/**
 * Fetch file content from GitHub
 */
export async function fetchFileContent(
    octokit: Octokit,
    owner: string,
    repo: string,
    path: string,
    sha: string
): Promise<string | null> {
    try {
        const { data } = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: sha
        });

        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error fetching ${path}:`, error.message);
        }
        return null;
    }
}

/**
 * Get file extension from path
 */
export function getFileExtension(path: string): string {
    return path.substring(path.lastIndexOf('.')).toLowerCase();
}

/**
 * Get language identifier for syntax highlighting
 */
export function getLanguageIdentifier(path: string): string {
    const ext = getFileExtension(path);

    const languageMap: Record<string, string> = {
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.json': 'json',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.sh': 'bash',
        '.bash': 'bash',
        '.sql': 'sql',
        '.r': 'r',
        '.dart': 'dart',
        '.vue': 'vue',
        '.svelte': 'svelte'
    };

    return languageMap[ext] || ext.substring(1);
}

/**
 * Calculate file type statistics
 */
export function getFileTypeStats(files: FileData[]): FileTypeStats {
    const stats: FileTypeStats = {};

    for (const file of files) {
        const ext = getFileExtension(file.path);
        stats[ext] = (stats[ext] || 0) + 1;
    }

    return Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
}

/**
 * Generate Markdown output
 */
export function generateMarkdownOutput(
    files: FileData[],
    owner: string,
    repo: string,
    branch: string
): string {
    let output = `# Repository: ${owner}/${repo}\n`;
    output += `Branch: ${branch}\n`;
    output += `Total Files: ${files.length}\n\n`;

    output += `## Directory Structure\n\n`;
    output += '```\n';
    output += files.map(f => f.path).join('\n');
    output += '\n```\n\n';

    output += `## File Contents\n\n`;

    for (const file of files) {
        const lang = getLanguageIdentifier(file.path);
        output += `### ${file.path}\n\n`;
        output += `\`\`\`${lang}\n`;
        output += file.content;
        output += '\n```\n\n';
    }

    return output;
}

/**
 * Escape XML special characters
 */
export function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generate XML output
 */
export function generateXMLOutput(
    files: FileData[],
    owner: string,
    repo: string,
    branch: string
): string {
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n';
    output += '<repository>\n';
    output += `  <metadata>\n`;
    output += `    <owner>${escapeXml(owner)}</owner>\n`;
    output += `    <name>${escapeXml(repo)}</name>\n`;
    output += `    <branch>${escapeXml(branch)}</branch>\n`;
    output += `    <fileCount>${files.length}</fileCount>\n`;
    output += `  </metadata>\n`;
    output += `  <files>\n`;

    for (const file of files) {
        output += `    <file path="${escapeXml(file.path)}" size="${file.size}">\n`;
        output += `      <content><![CDATA[\n${file.content}\n]]></content>\n`;
        output += `    </file>\n`;
    }

    output += `  </files>\n`;
    output += '</repository>\n';

    return output;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate GitHub URL format
 */
export function isValidGitHubUrl(url: string): boolean {
    const { owner, repo } = parseGitHubUrl(url);
    return owner !== null && repo !== null;
}

/**
 * Create file tree structure from flat file list
 */
export function createFileTree(files: FileData[]): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const file of files) {
        const parts = file.path.split('/');
        let current = tree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === parts.length - 1) {
                // Leaf node (file)
                current[part] = file;
            } else {
                // Directory node
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }

    return tree;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
}