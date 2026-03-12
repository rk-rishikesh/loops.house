# Loops House

Hackathon management platform with AI-powered project evaluation. Hosts create hackathons, builders submit projects, judges evaluate submissions (human + AI scoring), and the platform computes leaderboards and results.

Built with Next.js 16, React 19, Supabase, and Google Gemini.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, pgvector, Storage)
- **AI:** Google Gemini (gemini-2.5-pro, gemini-2.0-flash, gemini-embedding-001)
- **Language:** TypeScript

## Features

- **Hackathon lifecycle management** — create, configure, open for submissions, judging, finalization
- **Phase-driven permissions** — actions gated by computed hackathon phase (upcoming → building → judging → completed → finalized)
- **Capability-based roles** — admin, event creator, cohost (per-hackathon), judge (per-hackathon), builder, viewer
- **AI project evaluation** — Gemini-powered scoring against configurable rubric criteria
- **Human judge evaluation** — per-judge scoring with individual evaluation tracking
- **Analytics dashboard** — submission stats, category breakdowns, tech stack analysis, momentum scores
- **Project profiles** — AI-enriched profiles from GitHub repos, YouTube demos, and screenshots
- **RAG-powered Q&A** — semantic search over project codebases and sponsor documentation
- **Speakers management** — manage hackathon speaker roster
- **Leaderboard & finalization** — compute final rankings, publish results

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Required variables:

| Variable                        | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `GEMINI_API_KEY`                | Google Gemini API key                              |
| `GITHUB_TOKEN`                  | GitHub personal access token (for code flattening) |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-side only)       |

### 3. Set up the database

**Option A: Supabase CLI (recommended)**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```

**Option B: Dashboard SQL Editor**

Run migrations in order from `supabase/migrations/`.

### 4. Verify & seed

```bash
npm run db:status    # Check tables, functions, buckets
npm run db:seed      # Seed with test hackathons in different phases
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Management

| Script                               | Description                                         |
| ------------------------------------ | --------------------------------------------------- |
| `npm run db:status`                  | Check database health (tables, functions, buckets)  |
| `npm run db:push`                    | Push local migrations to remote Supabase            |
| `npm run db:reset`                   | Drop all tables and re-run migrations (**dev only**)|
| `npm run db:gen-types`               | Auto-generate TypeScript types from live schema     |
| `npm run db:new-migration -- "name"` | Create a new timestamped migration file             |
| `npm run db:seed`                    | Seed database with test data                        |
| `npm run db:setup-storage`           | Create storage buckets and policies                 |

### Schema Change Workflow

1. `npm run db:new-migration -- "description"`
2. Write SQL in the generated file
3. `npm run db:push`
4. `npm run db:gen-types`
5. Update code in `lib/db/` if needed
6. Commit migration file + updated types

---

## Project Structure

```
app/
  api/                        19 API routes (12 AI agents + 4 sub-agents + 3 REST)
    builder-agents/           Profile creator, project ideator, social amplifier
    host-agents/              Hackathon generator, metric analyst, evaluator, save-evaluation
    viewer-agents/            Code query, project chat
    devrel-agents/            Tech buddy (RAG-powered)
    agents/                   YouTube direct-source agent
    sub-agents/               Code/demo/theme readers, YouTube
    lib/                      Shared: gemini client, vector store, SSE, rate limiter, embeddings
  admin/                      Admin dashboard
  builder/                    Builder pages (projects, teams)
  dashboard/                  Unified role-aware dashboard
  hackathons/                 Public hackathon listings and detail
    [id]/submit/              Submit project to hackathon
    [id]/project/[projectId]/ Project within hackathon context
  host/                       Host management
    [hackathon_id]/analytics/ Submission analytics
    [hackathon_id]/manage/    Edit hackathon, judges, speakers
    [hackathon_id]/finalize/  Finalization & leaderboard
    [hackathon_id]/judging/   AI/human evaluation interface
  judge/                      Judge evaluation pages
    [hackathon_id]/[project_id]/ Evaluate specific project
  notifications/              Notification center
  projects/                   Public project browsing & detail
lib/
  actions.ts                  Server Actions (mutations with Zod validation)
  capabilities.ts             Capability-based authorization system
  hackathon-phase.ts          Phase computation & permission logic
  server-auth.ts              Server component auth (getServerAuth)
  server-data.ts              Server-side data fetching
  data-mappers.ts             DB row ↔ frontend type mappers
  storage.ts                  Async data layer for client components
  queries.ts                  TanStack Query hooks
  db/                         Data-access layer
    hackathons.ts             Hackathon CRUD
    hackathon-tracks.ts       Track operations
    hackathon-speakers.ts     Speaker management
    hackathon-results.ts      Results & leaderboard
    submissions.ts            Submission CRUD
    profiles.ts               Project/profile CRUD
    teams.ts                  Team CRUD
    knowledge-base.ts         pgvector KB chunk operations
    rate-limiter.ts           DB-backed rate limiting
    storage.ts                File upload helpers
  supabase/                   Client variants (browser, server, admin)
  validations/                Zod schemas
supabase/
  migrations/                 SQL migration files
scripts/
  seed-db.mjs                 Seed DB with test hackathons (submission/judging/finalized phases)
  db-push.sh, gen-types.sh    Dev scripts
AGENTS.md                     Full architecture & development guide
```

## Authentication

Supabase Auth with three providers: **Google OAuth**, **GitHub OAuth**, **Email/Password**.

Edge middleware (`middleware.ts`) protects `/builder`, `/host`, `/judge`, and `/admin` routes, encoding user capabilities into cookies for zero-DB-round-trip auth checks in server components.

## Deployment

### Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Add all environment variables from `.env.example`
3. Set up Supabase Auth redirect URLs:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`
4. Deploy

### Supabase Auth Providers

In your Supabase dashboard under Authentication > Providers:

- **Google:** Add your Google OAuth client ID and secret
- **GitHub:** Add your GitHub OAuth app client ID and secret
