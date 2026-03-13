# loopshouse

CLI and MCP server for [Loops House](https://loops.house) — manage hackathon projects, brainstorm with AI, and submit from your terminal or AI agent.

## Quick Start

```bash
# Run directly (no install)
npx loopshouse auth login

# Or install globally
npm i -g loopshouse
loops auth login
```

## Authentication

The CLI uses browser-based OAuth (Google or GitHub) via Supabase PKCE. Tokens are stored at `~/.loops/credentials.json` and auto-refresh on use.

```bash
# Log in (opens browser)
loops auth login
loops auth login --provider github

# Check status
loops auth status

# Log out
loops auth logout
```

## Commands

### Projects

```bash
# List your projects
loops project list

# Create a project
loops project create --name "My DeFi App" --description "On-chain analytics tool"

# Create with full details
loops project create \
  --name "My App" \
  --description "Description" \
  --githubUrl https://github.com/user/repo \
  --techStack "React,Solidity,IPFS" \
  --category DeFi

# Update a project
loops project update --id <project-id> --name "New Name" --techStack "React,Rust"
```

### Hackathons

```bash
# List hackathons accepting submissions
loops hackathon list

# List all hackathons (including past)
loops hackathon list --all

# AI-powered ideation for a hackathon
loops hackathon ideate -h <hackathon-id> -m "I want to build something with AI and blockchain"

# Ideate with your project context
loops hackathon ideate -h <hackathon-id> -p <project-id> -m "How does my project fit?"

# Submit to a hackathon
loops hackathon submit -h <hackathon-id> -p <project-id>
```

## MCP Server (AI Agent Integration)

Use the Loops CLI as an MCP tool server in Claude Code, Cursor, Windsurf, or any MCP-compatible agent.

### Claude Code

```bash
# Auto-configure
loops mcp add

# Or manually — add to .mcp.json in your project root:
```

```json
{
  "mcpServers": {
    "loops": {
      "command": "npx",
      "args": ["loopshouse", "--mcp"]
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "mcpServers": {
    "loops": {
      "command": "npx",
      "args": ["loopshouse", "--mcp"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `auth_login` | Authenticate via browser OAuth |
| `auth_status` | Check authentication status |
| `auth_logout` | Clear stored credentials |
| `project_list` | List your projects |
| `project_create` | Create a new project |
| `project_update` | Update project details |
| `hackathon_list` | Browse open hackathons |
| `hackathon_ideate` | AI brainstorming for a hackathon |
| `hackathon_submit` | Submit a project to a hackathon |

### Example Agent Usage

Once configured, your AI agent can:

> "List my Loops House projects"
> "Submit my project to the Shanghai hackathon"
> "Help me brainstorm ideas for the upcoming hackathon"

The agent calls the MCP tools automatically — no manual CLI commands needed.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOPS_PLATFORM_URL` | `https://loops.house` | Override the platform API URL (for local dev) |

## Development

```bash
# Clone and install
cd skill && bun install

# Run in dev mode
bun run dev -- auth status

# Build for npm
bun run build

# Test compiled output
node dist/loops.js --help
```

## License

MIT
