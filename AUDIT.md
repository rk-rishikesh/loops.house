# LoopsFlow Audit Report

**Date:** 2026-02-24
**Branch:** `feat/backend`
**Scope:** Performance, UX, Routing, Data Layer, Best Practices

---

## Executive Summary

The app suffers from **3 root causes** that compound into the slow, non-dynamic experience:

1. **Broken role-based routing** — All users redirect to `/builder` regardless of role
2. **Client-side waterfall fetching** — Every page is `"use client"` with `useEffect` data fetching, causing blank-then-populate flash
3. **No caching or optimization** — Every navigation hits the DB, `SELECT *` on every query, zero Next.js optimizations configured

---

## CRITICAL: Routing & Auth Issues

### C1. All Users Redirect to `/builder` After Login

**Files:** `app/login/page.tsx:16`, `app/auth/callback/route.ts:4`

Both files hardcode the default redirect:
```typescript
const redirect = searchParams.get("redirect") || "/builder"; // HARDCODED
```

**Impact:** Hosts, judges, viewers, and admins all land on `/builder` after login. No role-aware redirect exists anywhere.

**Fix:** After auth, fetch user role from DB and redirect to role-appropriate dashboard:
- `builder` → `/builder`
- `host` → `/host`
- `viewer` → `/boosters`
- `judge` → `/host/judging`
- `admin` → `/host`

### C2. Middleware Doesn't Enforce Role-Route Access

**File:** `middleware.ts:36-42`

Middleware checks if user exists but **never checks role**. A builder can access `/host` and vice versa.

```typescript
// Current: only checks authentication
if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
  return NextResponse.redirect(loginUrl);
}
// Missing: role-based route enforcement
```

### C3. Duplicate Role Queries on Every Auth Event

**File:** `app/providers.tsx:34-72`

Identical role-fetching code exists in both `loadSession()` and `onAuthStateChange()`. On login, role is queried twice — once on mount, once on auth state change.

---

## HIGH: Performance Issues

### H1. Every Page Is `"use client"` With useEffect Fetching

**Files:** All page components in `app/builder/`, `app/host/`, `app/viewer/`

Every page follows the same anti-pattern:
```typescript
"use client";
useEffect(() => {
  getProjects().then(setProjects);  // Blank page until this resolves
}, []);
```

**Impact:** HTML arrives empty → JS hydrates → fetch fires → data renders. Users see a blank page for 500ms-2s on every navigation. No SSR, no streaming, no SEO.

**Fix:** Convert data-fetching pages to async Server Components, or add React Query/SWR for client-side caching.

### H2. N+1 Query Patterns

**File:** `app/host/page.tsx:14-25`
```typescript
getBoosters().then((bs) => {
  Promise.all(bs.map((b) => getBoosterSubmissions(b.id))).then(...)
});
```
10 boosters = 11 queries. Should be 1-2 with JOINs.

**File:** `app/builder/projects/[id]/page.tsx:46-54`
```typescript
for (const s of subs) {
  const b = await getBooster(s.booster_id); // Sequential await in loop
}
```
5 submissions = 6 sequential queries.

### H3. `SELECT *` on Every Query — No Column Selection

**Files:** All `lib/db/*.ts` modules

Every function fetches all columns:
```typescript
const { data } = await supabase.from("loops_profiles").select("*")
```

The `loops_profiles` table has 25+ columns including `flattened_codebase` (potentially megabytes). List pages only need ~5 columns.

**Impact:** 5-10x more data transferred than needed. Estimated 600KB for viewer page that could be 80KB.

### H4. Zero Caching Strategy

- No React Query / SWR
- No `revalidate` exports on any page
- No HTTP cache headers on data responses
- Every back-navigation re-fetches everything from scratch

### H5. No Pagination

**Files:** `lib/db/profiles.ts`, `lib/db/boosters.ts`, `lib/db/submissions.ts`

All list functions return entire tables with no LIMIT:
```typescript
export async function getProjects(): Promise<ProfileRow[]> {
  const { data } = await supabase.from("loops_profiles").select("*")
    .order("created_at", { ascending: false });
  return data ?? [];  // ALL rows
}
```

### H6. Empty `next.config.ts` — No Optimizations

**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

Missing: image optimization domains, compression, security headers, bundle analysis.

---

## MEDIUM: UX Issues

### M1. No Loading Skeletons on Any Page

Every page starts with empty arrays and renders nothing until data arrives:
```typescript
const [projects, setProjects] = useState<StoredProject[]>([]);
// Renders empty list, then suddenly populates — jarring flash
```

No skeleton loaders, no Suspense boundaries, no progressive loading.

### M2. Inconsistent Loading Indicators

| Page | Loading UX |
|------|-----------|
| `builder/projects/[id]` | Plain text "Loading..." |
| `host/judging` | Spinner on submit button only |
| `host/boosters` | Text in dashed box during AI |
| All other pages | Nothing — blank then populated |

### M3. Raw `<img>` Instead of Next.js `<Image>`

**Files:** `app/builder/page.tsx:77`, `app/viewer/page.tsx:49`

Using `<img>` bypasses Next.js image optimization (AVIF/WebP, lazy loading, responsive sizing). ~30-50% image bandwidth wasted.

### M4. Font Loading Blocks Render

**File:** `app/layout.tsx`

Google Fonts loaded without `display: "swap"`:
```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  // Missing: display: "swap"
});
```

### M5. Fake 1.5s Delay on Submission

**File:** `app/builder/boosters/[id]/submit/page.tsx:35`
```typescript
setTimeout(() => router.push(...), 1500); // Why wait?
```

### M6. Hardcoded Window URL Construction

**Files:** `app/builder/page.tsx:69`, `app/builder/projects/[id]/page.tsx:80`
```typescript
const profileUrl = typeof window !== "undefined"
  ? `${window.location.origin}/viewer/projects/${p.project_id}` : "";
```
Unsafe SSR pattern. Should use relative paths or Next.js router.

### M7. No Error Boundaries

Zero `<ErrorBoundary>` or `error.tsx` files. A single failed DB query crashes the entire page with no fallback.

### M8. SSE APIs Exist But Pages Don't Use Them

API routes implement SSE streaming for AI operations, but client pages (`host/analytics`, `host/judging`) use plain `fetch()` and wait for full response. No progressive result display.

---

## LOW: Code Quality & Best Practices

### L1. Rate Limiter Fails Open

**File:** `lib/db/rate-limiter.ts`
```typescript
if (error || !data?.length) {
  console.error("Rate limit check failed:", error);
  return { allowed: true, ... }; // Allows unlimited access on DB error
}
```

### L2. Silent Error Swallowing

**Files:** `lib/db/knowledge-base.ts`, `lib/db/booster-tracks.ts`

All errors logged to console but return empty arrays. Users never know queries failed.

### L3. Legacy Interface Mapping Overhead

**File:** `lib/storage.ts`

Every DB row is transformed through `profileToStored()` / `boosterToStored()` mappers (30+ lines each). These exist to maintain legacy `StoredProject` interfaces from the localStorage era.

### L4. Missing Database Indexes

**File:** `supabase/migrations/001_initial_schema.sql`

Missing composite indexes for common query patterns:
- `submissions(booster_id, status)` — analytics filtering
- `loops_profiles(team_id, created_at)` — project listing
- `knowledge_base_chunks(project_id, chunk_index)` — sequential reads

### L5. Collision-Prone ID Generation

**File:** `app/host/boosters/page.tsx:98`
```typescript
const id = form.id || `booster_${Date.now()}`; // Not UUID
```

### L6. `useEffect` Dependency Bug

**File:** `app/host/judging/page.tsx:26-34`

`searchParams` used inside effect but missing from dependency array.

### L7. Accessibility Gaps

- Links with `href="#"` fallback (should be disabled or button)
- Icon-only buttons without ARIA labels
- No focus management on route transitions

---

## Performance Impact Estimates

| Page | Current Queries | Current Transfer | Optimized Queries | Optimized Transfer |
|------|----------------|------------------|-------------------|-------------------|
| `/host` | 12 | ~500KB | 2-3 | ~60KB |
| `/builder/projects/[id]` | 8 | ~200KB | 2 | ~30KB |
| `/host/analytics` | 3 | ~400KB | 1 | ~20KB |
| `/viewer` | 1 | ~600KB | 1 | ~80KB |
| `/builder` | 2 | ~300KB | 2 | ~40KB |

---

## Fix Priority (Recommended Order)

### Phase 1: Critical Routing (blocks all testing)
1. Add role-based redirect in `app/auth/callback/route.ts`
2. Add role-based redirect in `app/login/page.tsx`
3. Add role enforcement in `middleware.ts`

### Phase 2: Perceived Performance (biggest UX wins)
4. Add loading skeletons to all list pages
5. Fix waterfall N+1 queries with `Promise.all()` and batch functions
6. Add column selection (replace `SELECT *` with specific columns)
7. Convert `<img>` to `<Image>` components

### Phase 3: Architecture (sustained performance)
8. Add React Query or SWR for client-side caching
9. Configure `next.config.ts` (images, headers, compression)
10. Add `font-display: "swap"` to font config
11. Add pagination to list endpoints
12. Add missing database indexes
13. Add `error.tsx` error boundaries to route segments

### Phase 4: Cleanup
14. Retire legacy `StoredProject`/`StoredBooster` interfaces
15. Fix rate limiter fail-open behavior
16. Replace `Date.now()` IDs with UUIDs
17. Fix `useEffect` dependency arrays
18. Add ARIA labels and fix accessibility
