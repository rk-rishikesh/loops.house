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
npm run db:seed          # Seed database with test data
npm run db:setup-storage # Create storage buckets and policies
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

2. **Data-access layer** (`lib/db/`): 10 CRUD modules — `teams`, `profiles`, `boosters`, `submissions`, `knowledge-base`, `hackathon-tracks`, `storage`, `rate-limiter`, `host-applications`, `judge-invites`. All use the admin client.

3. **`lib/storage.ts`**: Async facade over `lib/db/*` modules that maps legacy `StoredProject`/`StoredBooster`/`StoredTeam` interfaces to DB rows. Client components import from here.

### Server-Side Data Layer

- **`lib/actions.ts`**: Server Actions for mutations — creates projects, teams, boosters, submissions. Uses Zod validation from `lib/validations/schemas.ts`.
- **`lib/server-auth.ts`**: `getServerAuth()` — server component auth helper, returns `{ user, role }` or redirects.
- **`lib/server-data.ts`**: Server-side data fetching — mirrors `storage.ts` functions for use in server components and page loaders.
- **`lib/data-mappers.ts`**: Maps DB rows (`Tables<"loops_profiles">`) to frontend `StoredProject`/`StoredBooster`/`StoredTeam` interfaces.

### Form & Cache Layer

- **`lib/validations/schemas.ts`**: Zod schemas for all forms and API validation (project, hackathon, team, admin, host-application, judge-invite).
- **`lib/types/json-schemas.ts`**: Typed schemas for JSON columns (`ColorsJson`, `LinkItem`, `SocialLinks`, etc.).
- **`lib/queries.ts`**: TanStack Query hooks (`useProjects`, `useBoosters`, `useTeams`, etc.) with stale-while-revalidate caching.
- **`lib/cache-config.ts`**: TanStack Query cache timing constants and default options.

### Auth Flow

- **`middleware.ts` (root, edge)**: Protects `/builder`, `/host`, and `/admin` routes. Refreshes Supabase session, checks role, redirects to `/login?redirect=`. Role mappings: `/builder` → builder, admin; `/host` → host, admin, judge; `/admin` → admin.
- **`lib/supabase/middleware.ts`**: Exports `requireAuth(allowedRoles?)` for API routes — validates session + role, returns `{user, supabase}` or null.
- **`app/providers.tsx`**: `AuthContext` with `useAuth()` hook providing `{user, session, role, loading}`.
- Auth methods: Google OAuth, GitHub OAuth, email/password.

### App Pages

```
app/
  admin/        Admin dashboard (users, applications)
  builder/      Builder role pages (projects, boosters, submissions)
  host/         Host role pages (hackathon management, judging)
  viewer/       Viewer role pages (project browsing)
  boosters/     Public hackathon listings
  residency/    Residency program pages
  login/        Auth page (OAuth + email/password)
  auth/callback OAuth callback handler
```

### AI Agent Routes (`app/api/`)

19 API routes total: 12 AI agent routes, 4 sub-agent utility routes, and 3 CRUD REST endpoints.

All AI routes follow a common pattern:

1. `requireAuth(allowedRoles?)` — role-gated authentication
2. Validate request body
3. Call Gemini (`generateJSON`, `generateContent`, or `streamContent`)
4. Return JSON or SSE stream

Route config on agent endpoints:

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

Agent categories: `builder-agents/`, `host-agents/`, `viewer-agents/`, `devrel-agents/`, `sub-agents/`, `agents/`.

#### Gemini Client (`app/api/lib/gemini-client.ts`)

| Export                                               | Description                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ai`                                                 | `GoogleGenAI` instance                                                                    |
| `MODELS`                                             | `{ pro: "gemini-2.5-pro", flash: "gemini-2.0-flash", embedding: "gemini-embedding-001" }` |
| `generateContent(model, contents, config?)`          | Single-turn generation                                                                    |
| `generateJSON<T>(model, prompt, systemInstruction?)` | Structured JSON output (temperature 0.2)                                                  |
| `streamContent(model, contents, config?)`            | Streaming generation                                                                      |

Model tier is always passed explicitly: `"pro"`, `"flash"`, or `"embedding"`. Can be overridden via env vars.

#### Shared Infrastructure (`app/api/lib/`)

| File                | Purpose                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| `sse.ts`            | `createSSEStream()` + `sseResponse()` for event-stream responses                |
| `rate-limiter.ts`   | `checkRateLimit(key, max, windowMs)` — delegates to DB                          |
| `embeddings.ts`     | `embedText()`, `embedBatch()`, `cosineSimilarity()` — 768-dim                   |
| `knowledge-base.ts` | `buildKnowledgeBase()`, `chunkText()` — chunks text, embeds, stores in pgvector |
| `vector-store.ts`   | `upsertChunks()`, `getChunks()`, `queryTopK()`, `hasProject()`                  |

#### Builder Agents (`app/api/builder-agents/`)

- **profile-creator** — Create a full project profile with AI enrichment. Orchestrates `code-reader`, `demo-reader`, `theme-reader` in parallel. Model: `"pro"`. SSE stream.
- **project-ideator** — Conversational brainstorming mentor for project ideas. Model: `"flash"` streaming. SSE stream.
- **social-amplifier** — Generate LinkedIn/Twitter posts. Model: `"flash"`. JSON. maxDuration: 10s.

#### Host Agents (`app/api/host-agents/`)

- **hackathon-generator** — Generate a full hackathon program draft. Model: `"flash"`. JSON. Rate limit: 5/day.
- **metric-analyst** — Analytics reports for hackathon submissions. Model: `"flash"`. JSON.
- **project-evaluator** — AI judging against rubric criteria. Model: `"pro"`. JSON. Persists `ai_score` to submissions.
- **resource-provisioner** — Technical resource plan for builders. Model: `"flash"`. JSON. Rate limit: 5/day.
- **save-evaluation** — Persist evaluation scores (no AI, pure CRUD). JSON.

#### DevRel Agents (`app/api/devrel-agents/`)

- **tech-buddy** — RAG-powered resource assistant from sponsor docs. Model: `"pro"` streaming. SSE stream. In-memory embedding cache.

#### Viewer Agents (`app/api/viewer-agents/`)

- **code-query** — Answer questions about a project's codebase. Model: `"pro"`. JSON. maxDuration: 30s. Rate limit: 20/hr.
- **project-chat** — Conversational Q&A using project knowledge base. Model: `"pro"` streaming. SSE stream.

#### Standalone Agents (`app/api/agents/`)

- **youtube** — YouTube video analysis (direct Gemini video input or transcript fallback). Uses `gemini-3-flash-preview` with `gemini-2.0-flash` fallback. JSON. maxDuration: 120s.

#### Sub-Agents (`app/api/sub-agents/`)

Reusable building blocks exposing both exported functions (in-process) and HTTP POST endpoints:

- **code-reader** — Flatten GitHub repo + extract tech stack. Models: `"flash"` (tech), `"pro"` (Q&A).
- **demo-reader** — Analyze YouTube demo video. Model: `"pro"` (direct video).
- **theme-reader** — Extract visual theme from screenshots/logo. Model: `"flash"` (multimodal).
- **youtube** — YouTube transcript + analysis wrapper.

Sub-agent orchestration: profile-creator runs code-reader, demo-reader, theme-reader in parallel via exported functions (not HTTP), merges results, builds knowledge base, generates tagline/category, persists to DB.

#### CRUD REST Endpoints

- **admin** (`app/api/admin/`) — GET (metrics/users), PATCH (update role). Admin only.
- **host-applications** (`app/api/host-applications/`) — POST/GET (any auth), PATCH (admin). Approval promotes to host.
- **judge-invites** (`app/api/judge-invites/`) — POST (host/admin), GET/PATCH (any auth). Acceptance promotes to judge.

### Vector Search (pgvector)

- **Embeddings**: `app/api/lib/embeddings.ts` — calls `gemini-embedding-001` (768-dim)
- **Knowledge base build**: `app/api/lib/knowledge-base.ts` → chunks text → embeds → stores via `lib/db/knowledge-base.ts`
- **Semantic search**: Supabase RPC functions `match_kb_chunks` and `match_booster_track_chunks` using cosine similarity
- **Vector store facade**: `app/api/lib/vector-store.ts` delegates to `lib/db/knowledge-base.ts`

### Database

Supabase Postgres with a single consolidated migration `supabase/migrations/000_full_schema.sql`. 13 tables, 5 RPC functions, 3 storage buckets, 5 enums. Key tables: users, teams, team_members, loops_profiles, boosters, booster_tracks, knowledge_bases, knowledge_base_chunks, booster_track_chunks, submissions, host_applications, judge_invites, rate_limits. RLS enabled on all tables.

Types: `lib/supabase/database.types.ts` (auto-generated, do not edit) re-exported through `lib/supabase/types.ts` with enum aliases.

### Gemini Models

- `gemini-2.5-pro` — complex reasoning tasks (project evaluation, code Q&A, RAG)
- `gemini-2.0-flash` — fast responses (generation, streaming chat, tech stack detection)
- `gemini-embedding-001` — 768-dim embeddings
- `gemini-3-flash-preview` — YouTube direct video analysis (lib/agents/youtube.ts only)

Client at `app/api/lib/gemini-client.ts` with `generateContent`, `generateJSON<T>`, and `streamContent`.

## Environment Variables

See `.env.example`: `GEMINI_API_KEY`, `GITHUB_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## SSR Rules & Data Flow

This app is **server-first**. Pages are async server components that fetch data and pass it as props to `"use client"` components. Mutations always go through Server Actions in `lib/actions.ts`, never direct client-side Supabase calls.

### Data Flow

```
Page request
  → app/[role]/page.tsx (async server component)
    → Promise.all([ getXxxServer(), ... ])           // lib/server-data.ts
      → createServerSupabase() → Supabase query      // lib/supabase/server.ts
      → map rows via data-mappers.ts                  // lib/data-mappers.ts
    → <ClientComponent data={serverData} />           // props, no waterfall
      → user interaction → form submit
        → react-hook-form validates with Zod           // lib/validations/schemas.ts
        → startTransition() → saveXxxAction()         // lib/actions.ts
          → auth check → Zod revalidation → DB mutation → revalidatePath()
        → router.refresh()                             // re-runs server component
```

### Rules

**Data fetching — always server-side for page loads:**

- Fetch in `page.tsx` using `lib/server-data.ts` functions (`getProjectsServer()`, `getBoostersServer()`, etc.)
- Use `Promise.all()` for parallel queries — never sequential awaits when data is independent
- Pre-join/map data on the server before passing as props (e.g., build a `projectMap` Record for O(1) lookups)
- Never use `useQuery()` for initial page data — TanStack Query is for secondary/interactive data only

**Mutations — always Server Actions, never client-side:**

- All writes go through `lib/actions.ts` Server Actions (e.g., `saveProjectAction`, `saveTeamAction`)
- Server Actions authenticate with `getAuthUser()`, validate with Zod, mutate, then call `revalidatePath()`
- Return `ActionResult<T>` (`{ success: true, data } | { success: false, error }`) — never throw
- Client calls `router.refresh()` after a successful action to get fresh SSR data

**Forms — react-hook-form + Zod + Server Action:**

- Use `useForm({ resolver: zodResolver(schema) })` from `lib/validations/schemas.ts`
- Wrap Server Action call in `useTransition()` for pending state — no extra `useState` for loading
- On success: `reset()` form + `router.refresh()` or navigate
- On error: display `result.error` in the UI

**Supabase client selection:**

| Context                           | Client                      | Import                       |
| --------------------------------- | --------------------------- | ---------------------------- |
| Server components / `page.tsx`    | `createServerSupabase()`    | `lib/supabase/server.ts`     |
| Server Actions (`lib/actions.ts`) | `createServerSupabase()`    | `lib/supabase/server.ts`     |
| API routes                        | `requireAuth()`             | `lib/supabase/middleware.ts` |
| Data-access layer (`lib/db/*`)    | `supabaseAdmin`             | `lib/supabase/admin.ts`      |
| Browser client components         | `sb()` via `lib/storage.ts` | `lib/supabase/client.ts`     |

**Auth in server components:**

- Use `getServerAuth()` from `lib/server-auth.ts` — reads the `x-user-role` cookie set by middleware (zero DB round-trip)
- Falls back to DB query if cookie is missing
- Returns `{ userId, role }` or `null`

### Anti-Patterns (do NOT do these)

- Calling Supabase directly from a `"use client"` component to write data — use a Server Action
- Using `lib/storage.ts` in server components — use `lib/server-data.ts` instead
- Fetching data in `useEffect` on mount when the page could be a server component
- Skipping Zod validation in Server Actions
- Forgetting `revalidatePath()` after a mutation — the page will show stale data
- N+1 queries in server components — use bulk functions like `getSubmissionsForBoostersServer(ids)`
- Storing auth state in localStorage — use session cookies via `app/providers.tsx`

## Conventions

- **TypeScript strict mode** with path aliases (`@/*`, `@/components/*`, `@/types/*`, `@/lib/*`)
- **Tailwind CSS v4** (PostCSS-based, no tailwind.config)
- **ESLint v9 flat config** (Next.js core web vitals + TypeScript)
- **react-hook-form** + **@hookform/resolvers** + **Zod** for form validation
- **TanStack Query** (`@tanstack/react-query`) for client-side data fetching and caching
- API routes use SSE streaming for long-running AI operations
- Rate limiting is DB-backed via `check_rate_limit` RPC (not in-memory)
