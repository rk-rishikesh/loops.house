# LoopsFlow (Loops House)

AI-native developer experience platform for hackathons, bounty programs, and project showcases. Built with Next.js 16, React 19, and Supabase.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, pgvector, Storage)
- **AI:** Google Gemini (gemini-2.5-pro, gemini-2.0-flash, gemini-embedding-001)
- **Language:** TypeScript

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GITHUB_TOKEN` | GitHub personal access token (for code flattening) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### 3. Set up the database

You need to run the SQL migrations against your Supabase project. Two options:

**Option A: Supabase CLI (recommended)**

```bash
# Login to Supabase (one-time, opens browser)
npx supabase login

# Link your project (one-time)
npx supabase link --project-ref <your-project-ref>

# Push all migrations
npm run db:push
```

**Option B: Dashboard SQL Editor**

Go to your [Supabase Dashboard](https://supabase.com/dashboard) > SQL Editor and run each file in order:

1. `supabase/migrations/001_initial_schema.sql` — Tables, indexes, extensions (pgvector)
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security policies
3. `supabase/migrations/003_functions.sql` — RPC functions and triggers
4. `supabase/migrations/004_storage_buckets.sql` — Storage buckets and policies

### 4. Verify the database

```bash
npm run db:status
```

This checks all 13 tables, 3 RPC functions, and 3 storage buckets.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Database Management

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run db:status` | Check database health (tables, functions, buckets) |
| `npm run db:push` | Push local migrations to remote Supabase |
| `npm run db:reset` | Drop all tables and re-run migrations (**dev only!**) |
| `npm run db:gen-types` | Auto-generate TypeScript types from live schema |
| `npm run db:new-migration -- "name"` | Create a new timestamped migration file |

### Auto-Generating TypeScript Types

After any schema change, regenerate the types so your code stays in sync:

```bash
# One-time setup
npx supabase login
npx supabase link --project-ref <your-project-ref>

# Generate types from live database
npm run db:gen-types
```

This overwrites `lib/supabase/database.types.ts` with types generated directly from your database schema, including:

- `Database` interface with Row/Insert/Update types for every table
- RPC function argument and return types
- Enum literal unions (app_role, booster_type, etc.)
- `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>` helper types

The barrel file `lib/supabase/types.ts` re-exports everything from `database.types.ts` and adds convenience aliases (`AppRole`, `BoosterType`, etc.) — **never edit `database.types.ts` by hand**.

**Always run `npm run db:gen-types` after pushing a migration.**

### Creating a New Migration

```bash
# Create the migration file
npm run db:new-migration -- "add_user_bio_column"

# Edit the generated SQL file in supabase/migrations/
# Then push it
npm run db:push

# Regenerate types
npm run db:gen-types
```

### Workflow: Making Schema Changes

1. **Create migration:** `npm run db:new-migration -- "description"`
2. **Write SQL** in the generated file
3. **Push:** `npm run db:push`
4. **Regenerate types:** `npm run db:gen-types`
5. **Update code** in `lib/db/` if needed
6. **Commit** migration file + updated types

### Keeping Supabase Up to Date

When pulling changes that include new migration files:

```bash
git pull
npm run db:push        # Apply new migrations
npm run db:gen-types   # Regenerate types
```

---

## Project Structure

```
app/
  api/                      16 AI agent API routes
    builder-agents/         Profile creator, project ideator, social amplifier
    host-agents/            Booster generator, metric analyst, evaluator
    viewer-agents/          Code query, project chat
    devrel-agents/          Tech buddy (RAG-powered)
    sub-agents/             Code/demo/theme readers, YouTube
    lib/                    Shared: gemini client, vector store, rate limiter
  auth/callback/            OAuth callback handler
  builder/                  Builder role pages
  host/                     Host role pages
  viewer/                   Viewer role pages
  boosters/                 Public booster pages
  login/                    Auth page (OAuth + email/password)
  layout.tsx                Root layout with SupabaseProvider
  providers.tsx             Supabase session context
lib/
  auth.ts                   Auth helpers (Supabase session + role lookup)
  storage.ts                Async data layer (delegates to lib/db/)
  db/                       Data-access layer
    teams.ts                Team CRUD
    profiles.ts             Project/profile CRUD
    boosters.ts             Booster CRUD
    submissions.ts          Submission CRUD
    knowledge-base.ts       pgvector KB chunk operations
    booster-tracks.ts       pgvector track chunk operations
    storage.ts              File upload helpers
    rate-limiter.ts         DB-backed rate limiting
  supabase/
    client.ts               Browser Supabase client
    server.ts               Server-side client (cookie-based SSR)
    admin.ts                Service-role client (bypasses RLS)
    middleware.ts            requireAuth() + unauthorized() helpers
    database.types.ts       Auto-generated types (npm run db:gen-types)
    types.ts                Barrel re-exports + convenience enum aliases
middleware.ts               Next.js edge middleware (auth redirects)
supabase/
  config.toml               Supabase CLI config
  migrations/               SQL migration files (run in order)
scripts/
  db-status.mjs             Check database health
  db-push.sh                Push migrations
  db-reset.sh               Reset database (dev only)
  gen-types.sh              Auto-generate TypeScript types
  new-migration.sh          Create new migration file
PLATFORM.md                 Platform requirements & entity docs
```

## Authentication

Supabase Auth with three providers:
- **Google OAuth**
- **GitHub OAuth**
- **Email/Password**

On signup, a trigger creates a `public.users` row with role `builder`. Roles: `builder`, `host`, `viewer`, `admin`, `judge`.

Edge middleware (`middleware.ts`) protects all routes except `/login` and `/auth/callback`.

## API Route Protection

All 16 API routes use `requireAuth()` from `lib/supabase/middleware.ts`:

| Route Group | Required Roles |
|-------------|---------------|
| `builder-agents/*` | builder, host, admin |
| `host-agents/*` | host, admin |
| `host-agents/project-evaluator` | host, judge, admin |
| `devrel-agents/tech-buddy` | any authenticated |
| `viewer-agents/*` | any authenticated |
| `sub-agents/*` | any authenticated |

## Deployment

### Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Add all environment variables from `.env.example`
3. Set up Supabase Auth redirect URLs in your Supabase dashboard:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`
4. Deploy

### Supabase Auth Providers

In your Supabase dashboard under Authentication > Providers:
- **Google:** Add your Google OAuth client ID and secret
- **GitHub:** Add your GitHub OAuth app client ID and secret
