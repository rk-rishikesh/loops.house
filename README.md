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

Go to your [Supabase Dashboard](https://supabase.com/dashboard) > SQL Editor and run:

1. `supabase/migrations/000_full_schema.sql` — Complete schema (tables, indexes, RLS, functions, storage buckets)

### 4. Verify the database

```bash
npm run db:status
```

This checks all 13 tables, 5 RPC functions, and 3 storage buckets.

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
| `npm run db:seed` | Seed database with test data |
| `npm run db:setup-storage` | Create storage buckets and policies |

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
  api/                      19 API routes (12 AI agents + 4 sub-agents + 3 REST)
    builder-agents/         Profile creator, project ideator, social amplifier
    host-agents/            Booster generator, metric analyst, evaluator, resource provisioner, save-evaluation
    viewer-agents/          Code query, project chat
    devrel-agents/          Tech buddy (RAG-powered)
    agents/                 YouTube direct-source agent
    sub-agents/             Code/demo/theme readers, YouTube
    lib/                    Shared: gemini client, vector store, SSE, rate limiter, embeddings
  admin/                    Admin dashboard (users, applications)
  auth/callback/            OAuth callback handler
  builder/                  Builder role pages
  host/                     Host role pages
  viewer/                   Viewer role pages
  boosters/                 Public booster pages
  residency/                Residency program pages
  login/                    Auth page (OAuth + email/password)
  layout.tsx                Root layout with SupabaseProvider
  providers.tsx             Supabase session context
lib/
  actions.ts                Server Actions (mutations with Zod validation)
  auth.ts                   Auth helpers (Supabase session + role lookup)
  cache-config.ts           TanStack Query cache settings
  data-mappers.ts           DB row <-> StoredXxx mappers
  github-utils.ts           GitHub URL parsing and file fetching
  queries.ts                TanStack Query hooks (useProjects, useBoosters, etc.)
  server-auth.ts            Server component auth (getServerAuth)
  server-data.ts            Server-side data fetching (mirrors storage.ts)
  storage.ts                Async data layer for client components (delegates to lib/db/)
  theme.ts                  Theme utilities
  agents/
    youtube.ts              YouTube analysis with transcript fallback
  db/                       Data-access layer (10 modules)
    boosters.ts             Booster CRUD
    booster-tracks.ts       Booster track operations
    host-applications.ts    Host application CRUD
    judge-invites.ts        Judge invite CRUD
    knowledge-base.ts       pgvector KB chunk operations
    profiles.ts             Project/profile CRUD
    rate-limiter.ts         DB-backed rate limiting
    storage.ts              File upload helpers
    submissions.ts          Submission CRUD
    teams.ts                Team CRUD
  supabase/
    client.ts               Browser Supabase client
    server.ts               Server-side client (cookie-based SSR)
    admin.ts                Service-role client (bypasses RLS)
    middleware.ts            requireAuth() + unauthorized() helpers
    database.types.ts       Auto-generated types (npm run db:gen-types)
    types.ts                Barrel re-exports + convenience enum aliases
  types/
    json-schemas.ts         Typed schemas for JSON columns
  validations/
    schemas.ts              Zod schemas (forms, API validation, admin)
middleware.ts               Next.js edge middleware (role-based route protection)
supabase/
  config.toml               Supabase CLI config
  migrations/               SQL migration file (000_full_schema.sql)
scripts/
  db-status.mjs             Check database health
  db-push.sh                Push migrations
  db-reset.sh               Reset database (dev only)
  gen-types.sh              Auto-generate TypeScript types
  new-migration.sh          Create new migration file
  seed-db.mjs               Seed database with test data
  setup-storage.mjs         Set up storage buckets
PLATFORM.md                 Platform requirements & entity docs
AGENTS.md                   AI agent architecture documentation
```

## Authentication

Supabase Auth with three providers:
- **Google OAuth**
- **GitHub OAuth**
- **Email/Password**

On signup, a trigger creates a `public.users` row with role `builder`. Roles: `builder`, `host`, `viewer`, `admin`, `judge`.

Edge middleware (`middleware.ts`) protects all routes except `/login` and `/auth/callback`.

## API Route Protection

All 19 API routes use `requireAuth()` from `lib/supabase/middleware.ts`:

| Route Group | Required Roles |
|-------------|---------------|
| `builder-agents/*` | builder, host, admin |
| `host-agents/booster-generator` | host, admin |
| `host-agents/metric-analyst` | host, admin |
| `host-agents/project-evaluator` | host, judge, admin |
| `host-agents/resource-provisioner` | host, admin |
| `host-agents/save-evaluation` | host, judge, admin |
| `devrel-agents/tech-buddy` | any authenticated |
| `viewer-agents/*` | any authenticated |
| `sub-agents/*` | any authenticated |
| `agents/youtube` | any authenticated |
| `admin` | admin |
| `host-applications` | any authenticated (POST/GET), admin (PATCH) |
| `judge-invites` | host/admin (POST), any authenticated (GET/PATCH) |

## Contributing Guide

### SSR Data Flow

This app is **server-first**. Pages are async server components that fetch data and pass it as props to `"use client"` components.

```
app/[role]/page.tsx          → async server component, fetches data
  lib/server-data.ts         → getProjectsServer(), getBoostersServer(), etc.
    lib/data-mappers.ts      → DB rows → StoredProject/StoredBooster/StoredTeam
  <ClientComponent data={} /> → receives server data as props
    lib/actions.ts           → Server Actions for all mutations
```

### Page Pattern

```typescript
// app/host/page.tsx — async server component
export default async function HostPage() {
  // 1. Parallel data fetching
  const [boosters, projects] = await Promise.all([
    getBoostersServer(),
    getProjectsServer(),
  ]);

  // 2. Pre-join on server (avoid N+1 in client)
  const projectMap: Record<string, StoredProject> = {};
  projects.forEach((p) => { projectMap[p.project_id] = p; });

  // 3. Pass as props — client receives fully hydrated data
  return <HostDashboard boosters={boosters} projectMap={projectMap} />;
}
```

### Mutation Pattern

All writes go through **Server Actions** in `lib/actions.ts` — never call Supabase directly from a client component to mutate data.

```typescript
// lib/actions.ts
"use server";
export async function saveProjectAction(project: StoredProject): Promise<ActionResult<string>> {
  const user = await getAuthUser();          // 1. Authenticate
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = projectSchema.safeParse(project); // 2. Validate with Zod
  if (!parsed.success) return { success: false, error: parsed.error.message };

  // 3. Mutate via server Supabase client
  const { error } = await supabase.from("loops_profiles").upsert(row);
  if (error) return { success: false, error: error.message };

  revalidatePath("/builder/projects");       // 4. Invalidate SSR cache
  return { success: true, data: project.project_id };
}
```

### Form Pattern

```typescript
// components/client/some-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { someSchema } from "@/lib/validations/schemas";
import { someAction } from "@/lib/actions";

export function SomeForm({ data }: { data: ServerData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(someSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    startTransition(async () => {
      const result = await someAction(values);
      if (result.success) {
        reset();
        router.refresh();  // Re-runs server component with fresh data
      }
    });
  });
  // ...
}
```

### Supabase Client Selection

| Context | Client | Import |
|---------|--------|--------|
| Server components / `page.tsx` | `createServerSupabase()` | `lib/supabase/server.ts` |
| Server Actions | `createServerSupabase()` | `lib/supabase/server.ts` |
| API routes | `requireAuth()` | `lib/supabase/middleware.ts` |
| Data-access layer (`lib/db/*`) | `supabaseAdmin` | `lib/supabase/admin.ts` |
| Browser client components | `sb()` via `lib/storage.ts` | `lib/supabase/client.ts` |

### Rules

- Fetch data in server components using `lib/server-data.ts` — never `useEffect` + fetch on mount
- Use `Promise.all()` for parallel queries — never sequential awaits for independent data
- All mutations go through `lib/actions.ts` Server Actions — never write directly from client components
- Server Actions must: authenticate, validate with Zod, mutate, call `revalidatePath()`
- Return `ActionResult<T>` from Server Actions — never throw errors
- Use `useTransition()` for form pending state — no extra `useState({ loading })`
- Call `router.refresh()` after successful Server Actions to get fresh SSR data
- Use `getServerAuth()` for auth in server components (reads role cookie, zero DB round-trip)
- Pre-join data on the server before passing as props — avoid N+1 queries in the client

---

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
