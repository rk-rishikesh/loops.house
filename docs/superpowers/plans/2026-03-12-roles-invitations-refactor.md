# Roles & Invitations Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-role-per-user system with a multi-role, invitation-based model where users can simultaneously be event creators, cohosts, judges, and project members across different hackathons — with hackathon phase gating for all actions.

**Architecture:** Drop the `app_role` enum and `users.role` column. Add `is_admin` and `is_event_creator` booleans on `users`. Create new `invitations` table (unified, type-discriminated) and `hackathon_cohosts` / per-hackathon role junction tables. Auth context shifts from a single role string to a computed `UserCapabilities` object. Middleware checks capabilities instead of a single role. Side-nav renders conditionally based on capabilities.

**Tech Stack:** Supabase Postgres (migration SQL), Next.js 16 App Router, TypeScript, Zod, TanStack Query, react-hook-form, Tailwind CSS v4.

---

## Scope & Chunk Overview

This plan is divided into 5 chunks:

1. **DB Migration** — New schema, drop old tables/enums, add new tables and RLS policies
2. **Auth & Capabilities Layer** — Replace `AppRole` with `UserCapabilities`, update middleware, server-auth, providers
3. **Server Actions & Data Layer** — Rewrite actions.ts, server-data.ts, db modules for new schema
4. **Invitation System** — New invitation CRUD, acceptance/rejection flows, notification page
5. **UI & Routing** — New side-nav, route restructuring, phase-gated conditional rendering

---

## Chunk 1: Database Migration

### New Schema Design

**Changes to `users` table:**
- DROP column `role` (app_role enum)
- ADD column `is_admin boolean not null default false`
- ADD column `is_event_creator boolean not null default false`

**DROP tables:**
- `host_applications` (replaced by admin-sent invitations)
- `judge_invites` (replaced by unified invitations table)

**DROP enums:**
- `app_role` (after column removal)
- `host_application_status` (no longer needed)

**New table: `invitations`**
```sql
create type invitation_type as enum ('event_host', 'cohost', 'judge', 'project_member');
create type invitation_status as enum ('pending', 'accepted', 'rejected');

create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  type            invitation_type not null,
  email           text not null,              -- invitee email (may not be registered yet)
  invited_by      uuid not null references public.users(id) on delete cascade,
  hackathon_id    uuid references public.hackathons(id) on delete cascade,  -- null for event_host
  project_id      uuid references public.loops_profiles(id) on delete cascade,  -- only for project_member
  status          invitation_status not null default 'pending',
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,  -- when accepted/rejected
  -- Constraints
  check (
    (type = 'event_host' and hackathon_id is null and project_id is null) or
    (type in ('cohost', 'judge') and hackathon_id is not null and project_id is null) or
    (type = 'project_member' and project_id is not null)
  )
);

create index idx_invitations_email on public.invitations(email);
create index idx_invitations_hackathon on public.invitations(hackathon_id) where hackathon_id is not null;
create index idx_invitations_project on public.invitations(project_id) where project_id is not null;
create index idx_invitations_status on public.invitations(status);
-- Prevent duplicate pending invitations
create unique index idx_invitations_unique_pending
  on public.invitations(type, email, coalesce(hackathon_id, '00000000-0000-0000-0000-000000000000'), coalesce(project_id, '00000000-0000-0000-0000-000000000000'))
  where status = 'pending';
```

**New table: `hackathon_cohosts`**
```sql
create table public.hackathon_cohosts (
  hackathon_id  uuid not null references public.hackathons(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);

create index idx_hackathon_cohosts_user on public.hackathon_cohosts(user_id);
```

**New table: `hackathon_judges`**
```sql
create table public.hackathon_judges (
  hackathon_id    uuid not null references public.hackathons(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  assigned_tracks uuid[] default '{}',
  created_at      timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);

create index idx_hackathon_judges_user on public.hackathon_judges(user_id);
```

**Modify `handle_new_user()` trigger:**
- Remove `role` assignment
- Add: lookup pending invitations by email and create notification records

**Modify hackathon RLS policies:**
- `hackathons_insert_host` → check `is_event_creator = true` or `is_admin = true`
- `hackathons_update_host` → check host_id OR cohost
- `hackathons_delete_host` → check host_id only (not cohosts)
- Track/chunk policies → also allow cohosts

**New RLS for new tables:**
- `invitations`: select own (by email or invited_by), insert by authorized roles, update own (accept/reject)
- `hackathon_cohosts`: select public, insert/delete by host_id or admin
- `hackathon_judges`: select public, insert/delete by host_id or cohost or admin

---

### Task 1.1: Create the migration file

**Files:**
- Create: `supabase/migrations/001_roles_invitations_refactor.sql`

- [ ] **Step 1: Create new migration file with enum and table additions**

```sql
-- ============================================================
-- Migration: Roles & Invitations Refactor
-- ============================================================

-- 1. New enums
create type invitation_type as enum ('event_host', 'cohost', 'judge', 'project_member');
create type invitation_status as enum ('pending', 'accepted', 'rejected');

-- 2. New columns on users
alter table public.users add column is_admin boolean not null default false;
alter table public.users add column is_event_creator boolean not null default false;

-- 3. Migrate existing role data
update public.users set is_admin = true where role = 'admin';
update public.users set is_event_creator = true where role = 'host';

-- 4. New tables
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  type            invitation_type not null,
  email           text not null,
  invited_by      uuid not null references public.users(id) on delete cascade,
  hackathon_id    uuid references public.hackathons(id) on delete cascade,
  project_id      uuid references public.loops_profiles(id) on delete cascade,
  status          invitation_status not null default 'pending',
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  check (
    (type = 'event_host' and hackathon_id is null and project_id is null) or
    (type in ('cohost', 'judge') and hackathon_id is not null and project_id is null) or
    (type = 'project_member' and project_id is not null)
  )
);

create index idx_invitations_email on public.invitations(email);
create index idx_invitations_hackathon on public.invitations(hackathon_id) where hackathon_id is not null;
create index idx_invitations_project on public.invitations(project_id) where project_id is not null;
create index idx_invitations_status on public.invitations(status);
create unique index idx_invitations_unique_pending
  on public.invitations(type, email,
    coalesce(hackathon_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pending';

create table public.hackathon_cohosts (
  hackathon_id  uuid not null references public.hackathons(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);
create index idx_hackathon_cohosts_user on public.hackathon_cohosts(user_id);

create table public.hackathon_judges (
  hackathon_id    uuid not null references public.hackathons(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  assigned_tracks uuid[] default '{}',
  created_at      timestamptz not null default now(),
  primary key (hackathon_id, user_id)
);
create index idx_hackathon_judges_user on public.hackathon_judges(user_id);

-- 5. Enable RLS on new tables
alter table public.invitations enable row level security;
alter table public.hackathon_cohosts enable row level security;
alter table public.hackathon_judges enable row level security;

-- 6. RLS policies for invitations
create policy "invitations_select_own"
  on public.invitations for select using (
    email = (select email from public.users where id = auth.uid())
    or invited_by = auth.uid()
  );

create policy "invitations_insert_authorized"
  on public.invitations for insert with check (
    auth.uid() = invited_by
  );

create policy "invitations_update_own"
  on public.invitations for update using (
    email = (select email from public.users where id = auth.uid())
  );

create policy "invitations_delete_inviter"
  on public.invitations for delete using (
    invited_by = auth.uid()
  );

-- 7. RLS policies for hackathon_cohosts
create policy "hackathon_cohosts_select_public"
  on public.hackathon_cohosts for select using (true);

create policy "hackathon_cohosts_insert_host"
  on public.hackathon_cohosts for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_cohosts.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

create policy "hackathon_cohosts_delete_host"
  on public.hackathon_cohosts for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_cohosts.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

-- 8. RLS policies for hackathon_judges
create policy "hackathon_judges_select_public"
  on public.hackathon_judges for select using (true);

create policy "hackathon_judges_insert_host_or_cohost"
  on public.hackathon_judges for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_judges.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_judges.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

create policy "hackathon_judges_delete_host_or_cohost"
  on public.hackathon_judges for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_judges.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_judges.hackathon_id)
    or (select is_admin from public.users where id = auth.uid()) = true
  );

-- 9. Migrate judge_invites data to hackathon_judges (accepted ones)
insert into public.hackathon_judges (hackathon_id, user_id, assigned_tracks, created_at)
select hackathon_id, judge_user_id, assigned_tracks, created_at
from public.judge_invites
where accepted = true
on conflict do nothing;

-- 10. Auto-add event creators (current hosts) as cohosts of their own hackathons
insert into public.hackathon_cohosts (hackathon_id, user_id, created_at)
select h.id, h.host_id, h.created_at
from public.hackathons h
on conflict do nothing;

-- 11. Update hackathon RLS policies
drop policy if exists "hackathons_insert_host" on public.hackathons;
create policy "hackathons_insert_event_creator"
  on public.hackathons for insert with check (
    auth.uid() = host_id
    and (
      (select is_event_creator from public.users where id = auth.uid()) = true
      or (select is_admin from public.users where id = auth.uid()) = true
    )
  );

drop policy if exists "hackathons_update_host" on public.hackathons;
create policy "hackathons_update_host_or_cohost"
  on public.hackathons for update using (
    auth.uid() = host_id
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathons.id)
  );

-- Update track policies to allow cohosts
drop policy if exists "hackathon_tracks_insert_host" on public.hackathon_tracks;
create policy "hackathon_tracks_insert_host_or_cohost"
  on public.hackathon_tracks for insert with check (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

drop policy if exists "hackathon_tracks_update_host" on public.hackathon_tracks;
create policy "hackathon_tracks_update_host_or_cohost"
  on public.hackathon_tracks for update using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

drop policy if exists "hackathon_tracks_delete_host" on public.hackathon_tracks;
create policy "hackathon_tracks_delete_host_or_cohost"
  on public.hackathon_tracks for delete using (
    auth.uid() in (select host_id from public.hackathons where id = hackathon_tracks.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = hackathon_tracks.hackathon_id)
  );

-- Update submission policies to allow judges and cohosts
drop policy if exists "submissions_update_team_or_host" on public.submissions;
create policy "submissions_update_team_host_judge"
  on public.submissions for update using (
    auth.uid() in (select user_id from public.team_members where team_id = submissions.team_id)
    or auth.uid() in (select host_id from public.hackathons where id = submissions.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_cohosts where hackathon_id = submissions.hackathon_id)
    or auth.uid() in (select user_id from public.hackathon_judges where hackathon_id = submissions.hackathon_id)
  );

-- 12. Update handle_new_user trigger — remove role assignment
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url, oauth_provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  );
  return new;
end;
$$;

-- 13. Drop old tables and enum (after migration)
drop table if exists public.judge_invites cascade;
drop table if exists public.host_applications cascade;

-- Drop the role column (must come before dropping the enum)
alter table public.users drop column role;

-- Drop old enums
drop type if exists app_role;
drop type if exists host_application_status;
```

- [ ] **Step 2: Verify migration syntax is valid**

Run: `cd /Users/nick-w3/loops.house && npx supabase db lint`
Expected: No syntax errors

- [ ] **Step 3: Commit migration**

```bash
git add supabase/migrations/001_roles_invitations_refactor.sql
git commit -m "feat: add roles & invitations refactor migration

Replaces single app_role with is_admin/is_event_creator booleans,
unified invitations table, hackathon_cohosts, and hackathon_judges."
```

---

### Task 1.2: Regenerate database types

**Files:**
- Modify: `lib/supabase/database.types.ts` (auto-generated)

- [ ] **Step 1: Push migration and regenerate types**

Run: `npm run db:push && npm run db:gen-types`
Expected: Types regenerated with new tables, no `app_role` references

- [ ] **Step 2: Commit regenerated types**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore: regenerate database types after roles refactor migration"
```

---

## Chunk 2: Auth & Capabilities Layer

### Design: UserCapabilities

Replace the single `AppRole` with a capabilities object:

```typescript
export interface UserCapabilities {
  isAdmin: boolean;
  isEventCreator: boolean;
  // Per-hackathon roles (populated on demand)
  cohostOf: string[];      // hackathon IDs
  judgeOf: string[];       // hackathon IDs
  // Per-project roles (populated on demand)
  memberOf: string[];      // project IDs via team_members
  ownerOf: string[];       // team IDs where user is owner
}
```

### Task 2.1: Update type exports

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Remove AppRole, add new type exports**

Replace contents of `lib/supabase/types.ts`:

```typescript
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

import type { Database } from "./database.types";

// Convenience enum aliases
export type HackathonStatus = Database["public"]["Enums"]["hackathon_status"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
export type InvitationType = Database["public"]["Enums"]["invitation_type"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "refactor: update type exports for new role system"
```

---

### Task 2.2: Create capabilities module

**Files:**
- Create: `lib/capabilities.ts`

- [ ] **Step 1: Write the capabilities module**

```typescript
/**
 * UserCapabilities — replaces the single AppRole.
 *
 * Computed from DB state. Cached in cookie for middleware fast-path.
 * Full capabilities loaded on demand in server components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserCapabilities {
  isAdmin: boolean;
  isEventCreator: boolean;
  cohostOf: string[];
  judgeOf: string[];
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  capabilities: UserCapabilities;
}

/** Minimal capabilities from users table only (fast, for middleware) */
export async function getBasicCapabilities(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ isAdmin: boolean; isEventCreator: boolean } | null> {
  const { data } = await supabase
    .from("users")
    .select("is_admin, is_event_creator")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    isAdmin: data.is_admin,
    isEventCreator: data.is_event_creator,
  };
}

/** Full capabilities including per-hackathon roles */
export async function getFullCapabilities(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserCapabilities | null> {
  const [userResult, cohostResult, judgeResult] = await Promise.all([
    supabase
      .from("users")
      .select("is_admin, is_event_creator")
      .eq("id", userId)
      .single(),
    supabase
      .from("hackathon_cohosts")
      .select("hackathon_id")
      .eq("user_id", userId),
    supabase
      .from("hackathon_judges")
      .select("hackathon_id")
      .eq("user_id", userId),
  ]);

  if (!userResult.data) return null;

  return {
    isAdmin: userResult.data.is_admin,
    isEventCreator: userResult.data.is_event_creator,
    cohostOf: (cohostResult.data ?? []).map((r) => r.hackathon_id),
    judgeOf: (judgeResult.data ?? []).map((r) => r.hackathon_id),
  };
}

/** Encode minimal capabilities into a cookie string: "userId:admin,event_creator" */
export function encodeCapsForCookie(userId: string, caps: { isAdmin: boolean; isEventCreator: boolean }): string {
  const flags: string[] = [];
  if (caps.isAdmin) flags.push("admin");
  if (caps.isEventCreator) flags.push("event_creator");
  return `${userId}:${flags.join(",")}`;
}

/** Decode capabilities from cookie string */
export function decodeCapsFromCookie(cookie: string, expectedUserId: string): { isAdmin: boolean; isEventCreator: boolean } | null {
  const sep = cookie.indexOf(":");
  if (sep === -1) return null;
  const uid = cookie.slice(0, sep);
  if (uid !== expectedUserId) return null;
  const flags = cookie.slice(sep + 1).split(",");
  return {
    isAdmin: flags.includes("admin"),
    isEventCreator: flags.includes("event_creator"),
  };
}

/** Check if user can manage a specific hackathon (host or cohost) */
export function canManageHackathon(
  caps: UserCapabilities,
  hackathonHostId: string,
  userId: string,
  hackathonId: string,
): boolean {
  return caps.isAdmin || hackathonHostId === userId || caps.cohostOf.includes(hackathonId);
}

/** Check if user can judge a specific hackathon */
export function canJudgeHackathon(caps: UserCapabilities, hackathonId: string): boolean {
  return caps.isAdmin || caps.judgeOf.includes(hackathonId);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/capabilities.ts
git commit -m "feat: add UserCapabilities module replacing AppRole"
```

---

### Task 2.3: Update server-auth.ts

**Files:**
- Modify: `lib/server-auth.ts`

- [ ] **Step 1: Rewrite to use capabilities**

```typescript
/**
 * Server-side auth helper for server components.
 *
 * Returns UserCapabilities instead of a single role.
 * Uses cookie for fast path, falls back to DB.
 */

import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  getFullCapabilities,
  decodeCapsFromCookie,
  type UserCapabilities,
} from "@/lib/capabilities";

export type { UserCapabilities };

export interface ServerAuth {
  userId: string;
  email: string;
  capabilities: UserCapabilities;
}

export async function getServerAuth(): Promise<ServerAuth | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Try cookie fast path for basic caps
  const cookieStore = await cookies();
  const capsCookie = cookieStore.get("x-user-caps")?.value;
  let basicCaps: { isAdmin: boolean; isEventCreator: boolean } | null = null;
  if (capsCookie) {
    basicCaps = decodeCapsFromCookie(capsCookie, user.id);
  }

  // Always fetch full capabilities for server components (includes per-hackathon roles)
  const caps = await getFullCapabilities(supabase, user.id);
  if (!caps) return null;

  return { userId: user.id, email: user.email ?? "", capabilities: caps };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/server-auth.ts
git commit -m "refactor: server-auth uses UserCapabilities instead of AppRole"
```

---

### Task 2.4: Update middleware.ts

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Rewrite middleware for capabilities-based routing**

The middleware needs to:
1. Remove all `app_role` / single-role logic
2. Use `is_admin` and `is_event_creator` from DB or cookie
3. Protected routes: `/admin` → admin only, `/host` → event_creator or cohost or admin, `/builder` → any authenticated user, `/judge` → any authenticated user (page itself checks per-hackathon)
4. Cookie format changes to capabilities encoding

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { encodeCapsForCookie, decodeCapsFromCookie } from "@/lib/capabilities";

const PUBLIC = ["/hackathons", "/residency", "/events", "/projects"];

const CAPS_COOKIE = "x-user-caps";
const CAPS_HINT_COOKIE = "x-user-caps-hint"; // JS-readable twin
const CAPS_COOKIE_TTL = 30;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isStaticAssetRequest = /\.[^/]+$/.test(pathname);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Authenticated user hitting /login → redirect to dashboard
  if (session && pathname === "/login") {
    const explicit = request.nextUrl.searchParams.get("redirect");
    if (explicit) {
      return NextResponse.redirect(new URL(explicit, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on a public route → let through
  const isPublicRoute = PUBLIC.some((p) => pathname.startsWith(p));
  if (!session && pathname !== "/login" && !isStaticAssetRequest && !isPublicRoute) {
    // Unauthenticated on protected route → login
    if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/admin") ||
        pathname.startsWith("/host") || pathname.startsWith("/builder") ||
        pathname.startsWith("/judge") || pathname.startsWith("/notifications")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.cookies.delete(CAPS_COOKIE);
      redirect.cookies.delete(CAPS_HINT_COOKIE);
      return redirect;
    }
    return response;
  }

  if (!session) return response;

  // Extract user ID from JWT
  const userId = JSON.parse(atob(session.access_token.split(".")[1])).sub as string;

  // Resolve capabilities — cookie first, then DB
  let caps: { isAdmin: boolean; isEventCreator: boolean } | null = null;
  const cached = request.cookies.get(CAPS_COOKIE)?.value;
  if (cached) {
    caps = decodeCapsFromCookie(cached, userId);
  }
  if (!caps) {
    const { data } = await supabase
      .from("users")
      .select("is_admin, is_event_creator")
      .eq("id", userId)
      .single();
    caps = {
      isAdmin: data?.is_admin ?? false,
      isEventCreator: data?.is_event_creator ?? false,
    };
    const cookieValue = encodeCapsForCookie(userId, caps);
    response.cookies.set(CAPS_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CAPS_COOKIE_TTL,
      path: "/",
    });
    response.cookies.set(CAPS_HINT_COOKIE, `${caps.isAdmin ? "1" : "0"},${caps.isEventCreator ? "1" : "0"}`, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CAPS_COOKIE_TTL,
      path: "/",
    });
  }

  // Route protection
  if (pathname.startsWith("/admin") && !caps.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /host routes (except creating new) — actual hackathon-level auth is done in page
  // Only block if user is definitely not event_creator AND not admin
  // (cohost check happens at page level since we need hackathon_id)
  if (pathname === "/host/new" && !caps.isEventCreator && !caps.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/(dashboard|builder|host|admin|judge|notifications|login|hackathons|residency|events|projects)(.*)"],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "refactor: middleware uses capabilities instead of single role"
```

---

### Task 2.5: Update AuthProvider (providers.tsx)

**Files:**
- Modify: `app/providers.tsx`

- [ ] **Step 1: Replace role with capabilities in auth context**

Change the auth state to expose capabilities instead of a single role. The hint cookie format changes to `isAdmin,isEventCreator` (two bits).

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CACHE_CONFIG } from "@/lib/cache-config";
import type { User, Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ClientCapabilities {
  isAdmin: boolean;
  isEventCreator: boolean;
}

function getCapsHint(): ClientCapabilities | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)x-user-caps-hint=([^;]+)/);
  if (!match?.[1]) return null;
  const [admin, ec] = match[1].split(",");
  return { isAdmin: admin === "1", isEventCreator: ec === "1" };
}

type AuthState = {
  user: User | null;
  session: Session | null;
  capabilities: ClientCapabilities | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  capabilities: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchCaps(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientCapabilities | null> {
  const { data } = await supabase
    .from("users")
    .select("is_admin, is_event_creator")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return { isAdmin: data.is_admin, isEventCreator: data.is_event_creator };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    capabilities: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let lastUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      if (user?.id === lastUserId && lastUserId !== null) {
        setState((prev) => ({ ...prev, session, user, loading: false }));
        return;
      }
      lastUserId = user?.id ?? null;

      if (!user) {
        setState({ user: null, session: null, capabilities: null, loading: false });
        return;
      }

      const hint = getCapsHint();
      if (hint) {
        setState({ user, session, capabilities: hint, loading: false });
        fetchCaps(supabase, user.id).then((dbCaps) => {
          if (dbCaps && (dbCaps.isAdmin !== hint.isAdmin || dbCaps.isEventCreator !== hint.isEventCreator)) {
            setState((prev) => ({ ...prev, capabilities: dbCaps }));
          }
        });
      } else {
        const caps = await fetchCaps(supabase, user.id);
        setState({ user, session, capabilities: caps, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: CACHE_CONFIG } });
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/providers.tsx
git commit -m "refactor: AuthProvider exposes capabilities instead of single role"
```

---

## Chunk 3: Server Actions & Data Layer

### Task 3.1: Update validation schemas

**Files:**
- Modify: `lib/validations/schemas.ts`

- [ ] **Step 1: Remove appRoleSchema, add invitation schemas**

Remove: `appRoleSchema`, `hostApplicationCreateSchema`, `hostApplicationReviewSchema`, `adminRoleUpdateSchema` (replace with new schemas).

Add:
```typescript
// Invitations
export const invitationTypeSchema = z.enum(["event_host", "cohost", "judge", "project_member"]);

export const createInvitationSchema = z.object({
  type: invitationTypeSchema,
  email: z.string().email("Valid email required"),
  hackathon_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
}).refine((data) => {
  if (data.type === "event_host") return !data.hackathon_id && !data.project_id;
  if (data.type === "cohost" || data.type === "judge") return !!data.hackathon_id && !data.project_id;
  if (data.type === "project_member") return !!data.project_id;
  return false;
}, { message: "Invalid invitation parameters for type" });

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;

export const respondInvitationSchema = z.object({
  invitation_id: z.string().uuid(),
  accept: z.boolean(),
});
export type RespondInvitationSchema = z.infer<typeof respondInvitationSchema>;

// Admin
export const adminToggleEventCreatorSchema = z.object({
  user_id: z.string().uuid(),
  is_event_creator: z.boolean(),
});

export const adminToggleAdminSchema = z.object({
  user_id: z.string().uuid(),
  is_admin: z.boolean(),
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/schemas.ts
git commit -m "refactor: replace role schemas with invitation and capability schemas"
```

---

### Task 3.2: Update data-mappers.ts

**Files:**
- Modify: `lib/data-mappers.ts`

- [ ] **Step 1: Remove AppRole/HostApplicationStatus references, add invitation types**

Remove: `HostApplicationStatus`, `HostApplicationRow`, `HostAppWithUser`, `JudgeInviteRow`, `JudgeInviteWithUser` type exports.

Add:
```typescript
export type InvitationType = Database["public"]["Enums"]["invitation_type"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
export type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
export type HackathonCohostRow = Database["public"]["Tables"]["hackathon_cohosts"]["Row"];
export type HackathonJudgeRow = Database["public"]["Tables"]["hackathon_judges"]["Row"];
```

Remove `UserRow`'s dependency on `role` field — it will have `is_admin` and `is_event_creator` instead.

- [ ] **Step 2: Commit**

```bash
git add lib/data-mappers.ts
git commit -m "refactor: data-mappers updated for new schema types"
```

---

### Task 3.3: Rewrite actions.ts

**Files:**
- Modify: `lib/actions.ts`

- [ ] **Step 1: Update getAuthUser to return capabilities**

Replace:
```typescript
async function getAuthUser() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, is_event_creator")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return { id: user.id, email: user.email ?? "", isAdmin: profile.is_admin, isEventCreator: profile.is_event_creator };
}
```

- [ ] **Step 2: Update saveHackathonAction auth check**

Replace `!["host", "admin"].includes(user.role)` with `!user.isEventCreator && !user.isAdmin`.

Also add cohost check: if updating an existing hackathon, check if user is host_id or in hackathon_cohosts.

- [ ] **Step 3: Update saveEvaluationAction auth check**

Replace role check with: check if user is admin, or is a judge on this hackathon, or is host/cohost of this hackathon.

```typescript
export async function saveEvaluationAction(data: {
  project_id: string;
  hackathon_id: string;
  ai_score?: Record<string, unknown>;
  human_score?: Record<string, unknown>;
  status?: string;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Check if user can evaluate: admin, judge of this hackathon, or host/cohost
  if (!user.isAdmin) {
    const supabase = await createServerSupabase();
    const [judgeCheck, cohostCheck, hostCheck] = await Promise.all([
      supabaseAdmin.from("hackathon_judges").select("user_id").eq("hackathon_id", data.hackathon_id).eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("hackathon_cohosts").select("user_id").eq("hackathon_id", data.hackathon_id).eq("user_id", user.id).maybeSingle(),
      supabaseAdmin.from("hackathons").select("host_id").eq("id", data.hackathon_id).eq("host_id", user.id).maybeSingle(),
    ]);
    if (!judgeCheck.data && !cohostCheck.data && !hostCheck.data) {
      return { success: false, error: "Unauthorized" };
    }
  }
  // ... rest unchanged
}
```

- [ ] **Step 4: Remove host application actions, add invitation actions**

Remove: `submitHostApplicationAction`, `reviewHostApplicationAction`, `updateUserRoleAction`.

Add:
```typescript
export async function createInvitationAction(data: {
  type: string;
  email: string;
  hackathon_id?: string;
  project_id?: string;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = createInvitationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Authorization check based on invitation type
  const { type, email, hackathon_id, project_id } = parsed.data;

  if (type === "event_host" && !user.isAdmin) {
    return { success: false, error: "Only admins can invite event hosts" };
  }

  if (type === "cohost") {
    // Only event creator (host_id) or admin can add cohosts
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return { success: false, error: "Hackathon not found" };
    if (hackathon.host_id !== user.id && !user.isAdmin) {
      return { success: false, error: "Only the event creator or admin can add cohosts" };
    }
  }

  if (type === "judge") {
    // Host, cohost, or admin can invite judges
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return { success: false, error: "Hackathon not found" };
    if (hackathon.host_id !== user.id && !user.isAdmin) {
      const { data: cohost } = await supabaseAdmin
        .from("hackathon_cohosts")
        .select("user_id")
        .eq("hackathon_id", hackathon_id!)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cohost) return { success: false, error: "Only host, cohost, or admin can invite judges" };
    }
  }

  if (type === "project_member") {
    // Only project owner (team owner) or admin can invite
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (!project) return { success: false, error: "Project not found" };
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("owner_id")
      .eq("id", project.team_id)
      .single();
    if (!team || (team.owner_id !== user.id && !user.isAdmin)) {
      return { success: false, error: "Only the project owner or admin can invite members" };
    }
  }

  const { error } = await supabaseAdmin
    .from("invitations")
    .insert({
      type: type as any,
      email,
      invited_by: user.id,
      hackathon_id: hackathon_id ?? null,
      project_id: project_id ?? null,
    });

  // TODO: Send email notification to invitee using Resend
  if (error) return { success: false, error: error.message };

  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function respondToInvitationAction(data: {
  invitation_id: string;
  accept: boolean;
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = respondInvitationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Fetch invitation
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("id", parsed.data.invitation_id)
    .eq("status", "pending")
    .single();

  if (fetchError || !invitation) return { success: false, error: "Invitation not found or already resolved" };

  // Verify this user's email matches the invitation
  if (invitation.email !== user.email) {
    return { success: false, error: "This invitation is not for you" };
  }

  // Verify the inviter still has permission
  const inviterValid = await verifyInviterStillAuthorized(invitation);
  if (!inviterValid) {
    // Delete the stale invitation
    await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);
    return { success: false, error: "The person who invited you no longer has permission. Invitation removed." };
  }

  if (!parsed.data.accept) {
    // Reject — delete the invitation
    await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);
    revalidatePath("/notifications");
    return { success: true, data: undefined };
  }

  // Accept — apply the role change, then delete invitation
  const { type, hackathon_id, project_id } = invitation;

  if (type === "event_host") {
    await supabaseAdmin
      .from("users")
      .update({ is_event_creator: true })
      .eq("id", user.id);
  } else if (type === "cohost") {
    await supabaseAdmin
      .from("hackathon_cohosts")
      .upsert({ hackathon_id: hackathon_id!, user_id: user.id }, { onConflict: "hackathon_id,user_id" });
  } else if (type === "judge") {
    await supabaseAdmin
      .from("hackathon_judges")
      .upsert({ hackathon_id: hackathon_id!, user_id: user.id }, { onConflict: "hackathon_id,user_id" });
  } else if (type === "project_member") {
    // Find project's team, add as member
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (project) {
      await supabaseAdmin
        .from("team_members")
        .upsert({ team_id: project.team_id, user_id: user.id, role: "member" }, { onConflict: "team_id,user_id" });
    }
  }

  // Delete the invitation after acceptance
  await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

/** Verify the inviter still holds the capability that authorized the invitation */
async function verifyInviterStillAuthorized(
  invitation: { type: string; invited_by: string; hackathon_id: string | null; project_id: string | null },
): Promise<boolean> {
  const { type, invited_by, hackathon_id, project_id } = invitation;

  if (type === "event_host") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return data?.is_admin === true;
  }

  if (type === "cohost") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return false;
    if (hackathon.host_id === invited_by) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  if (type === "judge") {
    const { data: hackathon } = await supabaseAdmin
      .from("hackathons")
      .select("host_id")
      .eq("id", hackathon_id!)
      .single();
    if (!hackathon) return false;
    if (hackathon.host_id === invited_by) return true;
    const { data: cohost } = await supabaseAdmin
      .from("hackathon_cohosts")
      .select("user_id")
      .eq("hackathon_id", hackathon_id!)
      .eq("user_id", invited_by)
      .maybeSingle();
    if (cohost) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  if (type === "project_member") {
    const { data: project } = await supabaseAdmin
      .from("loops_profiles")
      .select("team_id")
      .eq("id", project_id!)
      .single();
    if (!project) return false;
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("owner_id")
      .eq("id", project.team_id)
      .single();
    if (!team) return false;
    if (team.owner_id === invited_by) return true;
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", invited_by)
      .single();
    return admin?.is_admin === true;
  }

  return false;
}

// --- Admin actions (new) ---

export async function adminToggleEventCreatorAction(
  userId: string,
  isEventCreator: boolean,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ is_event_creator: isEventCreator })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function adminToggleAdminAction(
  userId: string,
  isAdmin: boolean,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ is_admin: isAdmin })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/actions.ts
git commit -m "refactor: actions.ts uses capabilities, adds invitation CRUD"
```

---

### Task 3.4: Update server-data.ts

**Files:**
- Modify: `lib/server-data.ts`

- [ ] **Step 1: Add invitation and role-context fetch functions**

Add to server-data.ts:
```typescript
// --- Invitations ---

export async function getPendingInvitationsServer(email: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("invitations")
    .select("*, users!invited_by(email, display_name)")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) console.error("[server-data] getPendingInvitationsServer:", error.message);
  return data ?? [];
}

export async function getPendingInvitationCountServer(email: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count, error } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .eq("status", "pending");
  if (error) console.error("[server-data] getPendingInvitationCountServer:", error.message);
  return count ?? 0;
}

// --- Hackathon role queries ---

export async function getUserCohostHackathonsServer(userId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathon_cohosts")
    .select("hackathon_id")
    .eq("user_id", userId);
  if (error) console.error("[server-data] getUserCohostHackathonsServer:", error.message);
  return (data ?? []).map((r) => r.hackathon_id);
}

export async function getUserJudgeHackathonsServer(userId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathon_judges")
    .select("hackathon_id")
    .eq("user_id", userId);
  if (error) console.error("[server-data] getUserJudgeHackathonsServer:", error.message);
  return (data ?? []).map((r) => r.hackathon_id);
}

export async function getHackathonCohostsServer(hackathonId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathon_cohosts")
    .select("user_id, users(email, display_name, avatar_url)")
    .eq("hackathon_id", hackathonId);
  if (error) console.error("[server-data] getHackathonCohostsServer:", error.message);
  return data ?? [];
}

export async function getHackathonJudgesServer(hackathonId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hackathon_judges")
    .select("user_id, assigned_tracks, users(email, display_name, avatar_url)")
    .eq("hackathon_id", hackathonId);
  if (error) console.error("[server-data] getHackathonJudgesServer:", error.message);
  return data ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/server-data.ts
git commit -m "feat: add invitation and role-context queries to server-data"
```

---

### Task 3.5: Delete obsolete db modules

**Files:**
- Delete: `lib/db/host-applications.ts`
- Delete: `lib/db/judge-invites.ts`

- [ ] **Step 1: Remove files and all imports**

Search for all imports of these modules and remove them:
- `lib/db/host-applications.ts` — referenced from `app/api/host-applications/`
- `lib/db/judge-invites.ts` — referenced from `app/api/judge-invites/`

Also delete/rewrite the API routes:
- `app/api/host-applications/route.ts` — DELETE entirely
- `app/api/judge-invites/route.ts` — DELETE entirely

Replace with new invitation API route if needed (or rely on server actions).

- [ ] **Step 2: Commit**

```bash
git rm lib/db/host-applications.ts lib/db/judge-invites.ts
git rm -r app/api/host-applications/ app/api/judge-invites/
git commit -m "chore: remove obsolete host-applications and judge-invites modules"
```

---

### Task 3.6: Update API route auth (supabase middleware)

**Files:**
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1: Replace role-based requireAuth with capabilities**

Update `requireAuth(allowedRoles?)` to `requireAuth()` that returns user + capabilities. Individual API routes check capabilities themselves.

```typescript
export async function requireAuth() {
  // ... existing session check ...
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, is_event_creator, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return {
    user,
    supabase,
    isAdmin: profile.is_admin,
    isEventCreator: profile.is_event_creator,
    email: profile.email,
  };
}
```

- [ ] **Step 2: Update all API routes that call requireAuth**

Grep for `requireAuth(` across `app/api/` and update each call.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/middleware.ts app/api/
git commit -m "refactor: API route auth uses capabilities instead of roles"
```

---

## Chunk 4: Hackathon Phase Gating

### Design

The `hackathon_status` enum already has: `draft`, `active`, `judging`, `completed`, `archived`.

Map these to phases:
- **Building phase**: `active` — applications open, submissions open
- **Judging phase**: `judging` — submissions closed, judging open
- **Finalization phase**: status transitions from `judging` → `completed` by host — edit judges disabled, edit judgements disabled
- **Completed phase**: `completed` — results go live, leaderboard shown

### Task 4.1: Create phase utilities

**Files:**
- Create: `lib/hackathon-phases.ts`

- [ ] **Step 1: Write phase logic**

```typescript
import type { HackathonStatus } from "@/lib/supabase/types";

export type HackathonPhase = "draft" | "building" | "judging" | "finalization" | "completed";

export function getHackathonPhase(status: HackathonStatus): HackathonPhase {
  switch (status) {
    case "draft": return "draft";
    case "active": return "building";
    case "judging": return "judging";
    case "completed": return "completed";
    case "archived": return "completed";
    default: return "draft";
  }
}

export interface PhasePermissions {
  canApply: boolean;
  canSubmit: boolean;
  canJudge: boolean;
  canEditJudges: boolean;
  canEditJudgements: boolean;
  canEditHackathon: boolean;
  showResults: boolean;
  showLeaderboard: boolean;
}

export function getPhasePermissions(phase: HackathonPhase): PhasePermissions {
  return {
    canApply: phase === "building",
    canSubmit: phase === "building",
    canJudge: phase === "judging",
    canEditJudges: phase === "building" || phase === "judging",
    canEditJudgements: phase === "judging",
    canEditHackathon: phase === "draft" || phase === "building",
    showResults: phase === "completed",
    showLeaderboard: phase === "completed",
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hackathon-phases.ts
git commit -m "feat: add hackathon phase utilities for action gating"
```

---

## Chunk 5: UI & Routing

### Task 5.1: Restructure routes

**New route structure:**

```
app/
  (public)/                      # No auth required
    hackathons/                  # Public hackathon listing
    hackathons/[id]/             # Public hackathon detail
    projects/                    # Public project listing
    projects/[id]/               # Public project detail
    residency/                   # Residency info
    events/                      # Public events listing
  (auth)/                        # Auth required (any logged-in user)
    dashboard/                   # Main dashboard (recent hackathons, etc.)
    builder/                     # Builder views
      projects/                  # My projects
      projects/[id]/             # Edit project
      teams/                     # My teams
    notifications/               # Invitation inbox
    host/                        # Event creator views
      new/                       # Create hackathon (event_creator only)
      [hackathon_id]/            # Manage hackathon (host/cohost)
        edit/                    # Edit hackathon details
        judges/                  # Manage judges
        analytics/               # Analytics
        judging/[project_id]/    # Score project
    judge/                       # Judge views
      [hackathon_id]/            # Judging for specific hackathon
        [project_id]/            # Judge specific project
    admin/                       # Admin views
      users/                     # User management
```

**Key changes from current:**
- `/viewer` routes already moved to `/projects` — no change needed
- Add `/dashboard` as unified dashboard
- Add `/judge` route tree
- Add `/notifications` route
- `/host/application` removed (replaced by invitation system)
- Side-nav renders based on capabilities

- [ ] **Step 1: Create new route files**

Create the following new pages:
- `app/dashboard/page.tsx` — unified dashboard
- `app/notifications/page.tsx` — invitation inbox
- `app/judge/page.tsx` — judge dashboard (list hackathons)
- `app/judge/[hackathon_id]/page.tsx` — judge hackathon projects
- `app/judge/[hackathon_id]/[project_id]/page.tsx` — judge specific project

- [ ] **Step 2: Commit route structure**

```bash
git add app/dashboard/ app/notifications/ app/judge/
git commit -m "feat: add dashboard, notifications, and judge route structure"
```

---

### Task 5.2: Rewrite side-nav

**Files:**
- Modify: `components/side-nav.tsx`

- [ ] **Step 1: Implement expanded/collapsible sidebar with role-conditional items**

Key changes:
1. Expanded by default with icon + label
2. Toggle to collapse (icon only)
3. Auto-collapse on smaller screens
4. Render items conditionally based on capabilities
5. Show notification badge

Nav sections:
- **Public** (always visible): Dashboard, Hackathons, Projects, Events, Residency
- **Builder** (any logged-in user): My Projects, My Teams
- **Host** (event_creator or cohost): My Hackathons, Create Hackathon (event_creator only)
- **Judge** (judgeOf.length > 0): Judge Dashboard
- **Admin** (isAdmin): Admin Panel
- **Notifications** (always when logged in): Bell icon with count badge

- [ ] **Step 2: Commit**

```bash
git add components/side-nav.tsx
git commit -m "feat: rewrite side-nav with capabilities-based rendering and expand/collapse"
```

---

### Task 5.3: Create notifications page

**Files:**
- Create: `app/notifications/page.tsx`
- Create: `components/client/invitation-inbox.tsx`

- [ ] **Step 1: Server page that fetches pending invitations**

```typescript
// app/notifications/page.tsx
import { getServerAuth } from "@/lib/server-auth";
import { getPendingInvitationsServer } from "@/lib/server-data";
import { redirect } from "next/navigation";
import { InvitationInbox } from "@/components/client/invitation-inbox";

export default async function NotificationsPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/notifications");

  const invitations = await getPendingInvitationsServer(auth.email);
  return <InvitationInbox invitations={invitations} />;
}
```

- [ ] **Step 2: Client component with accept/reject buttons**

The `InvitationInbox` component renders each invitation with context (type, hackathon name, inviter name) and accept/reject buttons that call `respondToInvitationAction`.

- [ ] **Step 3: Commit**

```bash
git add app/notifications/ components/client/invitation-inbox.tsx
git commit -m "feat: add notifications page with invitation accept/reject"
```

---

### Task 5.4: Create dashboard page

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Unified dashboard showing recent/upcoming hackathons**

```typescript
// app/dashboard/page.tsx
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonsServer, getPendingInvitationCountServer } from "@/lib/server-data";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/dashboard");

  const [hackathons, invitationCount] = await Promise.all([
    getHackathonsServer(),
    getPendingInvitationCountServer(auth.email),
  ]);

  const upcoming = hackathons.filter((h) => h.status === "active" || h.status === "draft");
  const recent = hackathons.filter((h) => h.status === "completed").slice(0, 5);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {invitationCount > 0 && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          You have {invitationCount} pending invitation{invitationCount > 1 ? "s" : ""}.{" "}
          <a href="/notifications" className="underline">View</a>
        </div>
      )}
      {/* Upcoming hackathons section */}
      {/* Recent hackathons section */}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add unified dashboard page"
```

---

### Task 5.5: Create judge pages

**Files:**
- Create: `app/judge/page.tsx`
- Create: `app/judge/[hackathon_id]/page.tsx`
- Create: `app/judge/[hackathon_id]/[project_id]/page.tsx`

- [ ] **Step 1: Judge dashboard listing hackathons**

Lists hackathons where user is a judge, with judging status (pending/in-progress/complete).

- [ ] **Step 2: Judge hackathon page listing projects**

Lists projects submitted to this hackathon with their judging status.

- [ ] **Step 3: Judge project page with scoring form**

Reuse/adapt the existing judging form from `app/host/[hackathon_id]/judging/[project_id]/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/judge/
git commit -m "feat: add judge route pages"
```

---

### Task 5.6: Update admin pages

**Files:**
- Modify: `app/admin/users/page.tsx`
- Modify: `app/admin/page.tsx`
- Delete: `app/admin/applications/page.tsx` (host applications removed)

- [ ] **Step 1: Admin user management — toggle is_admin and is_event_creator**

Replace the single role dropdown with two toggle switches:
- "Admin" toggle → calls `adminToggleAdminAction`
- "Event Creator" toggle → calls `adminToggleEventCreatorAction`

Or admin can send event_host invitations directly from the users page.

- [ ] **Step 2: Remove applications page**

Delete `app/admin/applications/page.tsx` — no longer needed.

- [ ] **Step 3: Commit**

```bash
git add app/admin/
git commit -m "refactor: admin pages use capability toggles, remove applications"
```

---

### Task 5.7: Update all components referencing AppRole

**Files to grep and update:**
- All files importing `AppRole` from `@/lib/supabase/types` or `@/lib/server-auth`
- All files referencing `user.role`, `role === 'host'`, etc.
- `components/client/host-application-form.tsx` — DELETE (no longer needed)
- `components/client/judging-form.tsx` — update auth checks

- [ ] **Step 1: Find all references**

Run: `grep -r "AppRole\|app_role\|user\.role\|role.*host\|role.*judge\|role.*builder\|role.*viewer\|role.*admin" --include="*.ts" --include="*.tsx" lib/ app/ components/`

- [ ] **Step 2: Update each file**

For each file, replace role checks with capability checks using the `useAuth()` hook (client) or `getServerAuth()` (server).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: replace all AppRole references with capabilities"
```

---

### Task 5.8: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update architecture section**

Update the following sections:
- Role system description (remove app_role, describe capabilities)
- Auth flow (middleware uses capabilities cookie)
- Database section (new tables: invitations, hackathon_cohosts, hackathon_judges)
- Route structure (new routes)
- Remove references to builder/host/viewer/judge roles as route-gating mechanism

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for new roles and capabilities architecture"
```

---

## Execution Order & Dependencies

```
Chunk 1 (DB Migration) → must complete first
  ↓
Chunk 2 (Auth & Capabilities) → depends on new schema
  ↓
Chunk 3 (Actions & Data Layer) → depends on capabilities module
  ↓
Chunk 4 (Phase Gating) → can run in parallel with Chunk 3
  ↓
Chunk 5 (UI & Routing) → depends on Chunks 2-4
```

**Parallelizable tasks:**
- Task 4.1 (phase utilities) can run alongside Tasks 3.1-3.6
- Tasks 5.3, 5.4, 5.5 (new pages) can run in parallel once Chunk 3 is done
- Task 5.7 (grep & replace) should run last as a sweep
