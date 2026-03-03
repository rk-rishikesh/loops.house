# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
npm run db:gen-types     # Regenerate database.types.ts from live Supabase schema
npm run db:push          # Push migrations to remote Supabase
npm run db:status        # Check database health
npm run db:new-migration -- "name"  # Create new migration file
```

## MCP TOOLS (USE FOR DEBUGGING AND DEVELOPMENT)

Use `next-devtools` for browser automation. Run `next-devtools --help` for all commands.

Use `supabase` for database management. Run `supabase --help` for all commands.

## Browser Automation (IGNORE THIS FOR NOW ONLY IF REALLY NEEDED YOU ARE CONFIDENT THAT ONE INTEGRATION IS WORKING AND YOU NEED TO TEST IT BETTER ASK ME THROUGH CHAT TO VALIDATE THE INTEGRATION)

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

Run development server:

```bash
npm run dev
```

Execute test out the pages recently modified or introduced updates improvements to validate them on localhost 3000.

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

## Architecture

LoopsFlow is an AI-native developer platform ("permanent home for developer projects") built on Next.js 16 App Router. Users have one of five roles (`app_role` enum): builder, host, viewer, admin, judge. Builders submit projects, hosts run boosters (idea/momentum/capital), judges score submissions.

### Three-Layer Backend

1. **Supabase clients** (`lib/supabase/`): Three client variants — `client.ts` (browser singleton), `server.ts` (SSR with cookies), `admin.ts` (service-role, bypasses RLS). Pick the right one based on context.

2. **Data-access layer** (`lib/db/`): CRUD modules (teams, profiles, boosters, submissions, knowledge-base, booster-tracks, storage, rate-limiter). All use the admin client.

3. **`lib/storage.ts`**: Async facade over `lib/db/*` modules that maps legacy `StoredProject`/`StoredBooster`/`StoredTeam` interfaces to DB rows. Client components import from here.

### Auth Flow

- `proxy.ts` (edge): Protects `/builder` and `/host` routes, refreshes Supabase session, redirects to `/login?redirect=`.
- `lib/supabase/middleware.ts`: Exports `requireAuth(allowedRoles?)` for API routes — validates session + role, returns `{user, supabase}` or null.
- `app/providers.tsx`: `AuthContext` with `useAuth()` hook providing `{user, session, role, loading}`.
- Auth methods: Google OAuth, GitHub OAuth, email/password.

### AI Agent Routes (`app/api/`)

All 16 API routes follow the same pattern:

1. `requireAuth(["builder", "host", "admin"])` — role-gated
2. Validate request body
3. Create SSE stream for progress updates
4. Run sub-agents in parallel (code-reader, demo-reader, theme-reader, youtube)
5. Return `sseResponse(stream)`

Route config on every agent endpoint:

```typescript
export const runtime = "nodejs";
export const maxDuration = 90;
export const dynamic = "force-dynamic";
```

Agent categories: `builder-agents/`, `host-agents/`, `viewer-agents/`, `devrel-agents/`, `sub-agents/`.

### Vector Search (pgvector)

- **Embeddings**: `app/api/lib/embeddings.ts` — calls `gemini-embedding-001` (768-dim)
- **Knowledge base build**: `app/api/lib/knowledge-base.ts` → chunks text → embeds → stores via `lib/db/knowledge-base.ts`
- **Semantic search**: Supabase RPC functions `match_kb_chunks` and `match_booster_track_chunks` using cosine similarity
- **Vector store facade**: `app/api/lib/vector-store.ts` delegates to `lib/db/knowledge-base.ts`

### Database

Supabase Postgres with 4 migration files in `supabase/migrations/`. Key tables: users, teams, team_members, loops_profiles, boosters, knowledge_bases, knowledge_base_chunks, booster_track_chunks, submissions, rate_limits, host_applications. RLS enabled on all tables.

Types: `lib/supabase/database.types.ts` (auto-generated, do not edit) re-exported through `lib/supabase/types.ts` with enum aliases.

### Gemini Models

- `gemini-2.5-pro` — complex reasoning tasks
- `gemini-2.0-flash` — fast responses
- `gemini-embedding-001` — 768-dim embeddings

Client at `app/api/lib/gemini-client.ts` with `generateContent`, `generateJSON<T>`, and `streamContent`.

## Environment Variables

See `.env.example`: `GEMINI_API_KEY`, `GITHUB_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Conventions

- **TypeScript strict mode** with path aliases (`@/*`, `@/components/*`, `@/types/*`, `@/lib/*`)
- **Tailwind CSS v4** (PostCSS-based, no tailwind.config)
- **ESLint v9 flat config** (Next.js core web vitals + TypeScript)
- API routes use SSE streaming for long-running AI operations
- Rate limiting is DB-backed via `check_rate_limit` RPC (not in-memory)
