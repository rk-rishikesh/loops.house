---
name: loops-cli
description: Loops House CLI for managing hackathon projects, browsing hackathons, AI-powered ideation, and submission — from the terminal or as an AI agent tool. Use when building projects for hackathons, submitting to hackathons, ideating project ideas, or managing Loops House projects programmatically. Triggers on "loops", "hackathon", "submit project", "ideate", "Loops House".
---

# Loops House CLI

Manage the full hackathon builder lifecycle from terminal or AI agent.

## Prerequisites

```bash
# No install needed — use npx:
npx loopshouse auth login

# Or install globally:
npm i -g loopshouse
loops auth login

# For local dev, override the platform URL:
export LOOPS_PLATFORM_URL="http://localhost:3000"
```

## Authentication

```bash
loops auth login          # Browser OAuth (Google/GitHub) → saves to ~/.loops/credentials.json
loops auth status         # Check current session
loops auth logout         # Clear stored credentials
```

All commands below require authentication.

## Core Workflow

### 1. Browse open hackathons

```bash
loops hackathon list              # Shows building + upcoming hackathons only
loops hackathon list --all        # Include judging/completed/finalized
```

Output includes: id, name, theme, phase, problem_statements, dates.

### 2. Create or update a project

```bash
# Create (minimal)
loops project create --name "My DApp" --description "On-chain analytics"

# Create (full)
loops project create \
  --name "My DApp" \
  --description "On-chain analytics dashboard" \
  --tagline "Real-time DeFi insights" \
  --category "DeFi" \
  --githubUrl https://github.com/user/repo \
  --youtubeUrl https://youtube.com/watch?v=demo \
  --websiteUrl https://mydapp.xyz \
  --logoUrl https://mydapp.xyz/logo.png \
  --techStack "React,Solidity,The Graph,IPFS" \
  --keyFeatures "On-chain analytics,Real-time alerts,Portfolio tracking" \
  --screenshotUrls "https://i.imgur.com/a.png,https://i.imgur.com/b.png" \
  --additionalLinks '[{"label":"Docs","url":"https://docs.mydapp.xyz"}]' \
  --socialLinks '[{"label":"Twitter","url":"https://twitter.com/mydapp"}]'

# Update
loops project update --id <project-id> --description "Updated desc" --techStack "React,Rust,WASM"

# List your projects
loops project list
```

**Create/Update fields:**

| Flag | Description | Format |
|------|-------------|--------|
| `--name` | Project name | string |
| `--description` | Full description | string |
| `--tagline` | Short tagline | string |
| `--category` | Category (DeFi, NFT, DAO, etc.) | string |
| `--githubUrl` | GitHub repo URL | URL |
| `--youtubeUrl` | YouTube demo URL | URL |
| `--websiteUrl` | Project website | URL |
| `--logoUrl` | Logo image URL | URL |
| `--techStack` | Tech stack | comma-separated |
| `--keyFeatures` | Key features | comma-separated |
| `--screenshotUrls` | Screenshot URLs | comma-separated |
| `--additionalLinks` | Extra links | JSON `[{label,url}]` |
| `--socialLinks` | Social links | JSON `[{label,url}]` |
| `--teamId` | Team ID (create only) | UUID |
| `--hackathonId` | Hackathon ID (create only) | UUID |

### 3. Ideate with AI mentor

Brainstorm project ideas for a specific hackathon. The AI mentor knows the hackathon's problem statements, theme, and sponsor tracks. Pass `--projectId` to include your project details for contextual feedback on alignment and progress.

```bash
# General ideation
loops hackathon ideate \
  --hackathonId <hackathon-id> \
  --message "I want to build something with AI and blockchain"

# Ideation with project context (recommended)
loops hackathon ideate \
  --hackathonId <hackathon-id> \
  --projectId <project-id> \
  --message "How does my project align with this hackathon?"
```

For multi-turn conversations, pass prior history as JSON:

```bash
loops hackathon ideate \
  --hackathonId <id> \
  --projectId <project-id> \
  --message "What about a decentralized identity solution?" \
  --history '[{"role":"user","content":"I want to build with AI"},{"role":"assistant","content":"Great! Consider..."}]'
```

### 4. Submit to hackathon

```bash
loops hackathon submit \
  --hackathonId <hackathon-id> \
  --projectId <project-id>
```

Phase-gated: only works during the `building` phase (between start_date and submission_deadline). Team ID is auto-resolved from the project.

## MCP Mode

Register as an MCP server for AI agent integration:

```bash
loops mcp add
loops --mcp    # Start as MCP stdio server
```

## Aliases

| Long flag | Short |
|-----------|-------|
| `--name` | `-n` |
| `--description` | `-d` |
| `--githubUrl` | `-g` |
| `--hackathonId` | `-h` |
| `--projectId` | `-p` |
| `--message` | `-m` |
| `--teamId` | `-t` |
| `--id` (update) | `-i` |

## Architecture

- **Auth**: Supabase PKCE OAuth flow, tokens stored at `~/.loops/credentials.json`, auto-refreshed on use
- **Data commands** (list, create, update, submit): Direct Supabase client queries with user RLS context
- **AI commands** (ideate): Call platform API route (`/api/builder-agents/project-ideator`) with Bearer token auth, optionally including project snapshot for contextual feedback
- **Framework**: Built with [incur](https://github.com/nichochar/incur) — typed CLI + MCP + skill generation
