# Changelog

## Modular Side-Nav + Phase-Aware Hackathon Tabs

### Side-Nav Modularization (`components/side-nav/`)

Split the monolithic `components/side-nav.tsx` (632 lines) into 8 focused modules:

- **`side-nav.tsx`** — Root component, composes NavChrome + NavItems + BottomActions
- **`nav-config.ts`** — All route/tab definitions, `getNavSections()`, `getHackathonTabs()`, hash tab configs
- **`nav-items.tsx`** — Renders sections, link items, and hash tab items
- **`nav-row.tsx`** — Single nav row with icon, label, active state, collapse behavior
- **`nav-chrome.tsx`** — Shell layout (header, scrollable content, bottom actions)
- **`bottom-actions.tsx`** — Theme toggle, collapse toggle, logout button
- **`use-collapsed.ts`** — `useSyncExternalStore`-based collapse state (shared across instances)
- **`styles.ts`** — Shared Tailwind class constants
- **`index.ts`** — Public re-export barrel

### Phase-Aware Hackathon Detail Tabs

- **`hackathon-tab-store.ts`** — Module-level pub/sub store for hackathon phase + submission state, consumed by side-nav via `useSyncExternalStore`
- Side-nav dynamically resolves hackathon tabs based on phase:
  - Hides "AI Mentor" and "Ideate with AI" after building phase ends
  - Shows "View Submission" instead of "Submit Project" when user has already submitted
  - Shows "Results" tab when hackathon is completed/finalized
- `getHackathonTabs(override?)` in `nav-config.ts` merges base tabs with phase-driven overrides

### Builder Hackathon Detail Split (`app/hackathons/[id]/_components/`)

Split `builder-hackathon-detail.tsx` (1200+ lines) into focused components:

- **`constants.ts`** — Tab definitions, default colors, helper functions
- **`hackathon-info.tsx`** — Info section with phase badge
- **`hackathon-schedule.tsx`** — Timeline/schedule display
- **`hackathon-speakers.tsx`** — Speaker cards grid
- **`hackathon-prizes.tsx`** — Tracks and prizes display
- **`hackathon-submit.tsx`** — Submit/view submission section
- **`hackathon-chat.tsx`** — AI mentor chat interface
- **`hackathon-results.tsx`** — Results/leaderboard section (new)

### Other Changes

- Deleted stale `app/hackathons/[id]/project/[projectId]/page.tsx` (replaced by `/projects/[id]` route)
- `builder-hackathon-detail.tsx` reduced from ~1200 lines to ~100 lines (orchestrator only)

---

## Centralized Hackathon Phase into StoredHackathon

### Phase System (`lib/hackathon-phase.ts`)

- Added `"draft"` to `HackathonPhase` type — hackathons with `status !== "approved"` now get `phase: "draft"` instead of falling through to date-based computation
- `computePhase()` now accepts optional `status` parameter
- Added `"draft"` entry to `PhasePermissions` (all permissions false)

### Data Mapper (`lib/data-mappers.ts`)

- `StoredHackathon` now includes a `phase` field, computed once in `hackathonToStored()`
- Single source of truth — consumers read `hackathon.phase` instead of recalculating

### Consumer Updates (18 files)

All pages that previously called `computePhase()` with hackathon dates now use the pre-computed `hackathon.phase`:

- **Host pages**: overview, analytics, manage, edit, speakers, judges, cohosts, finalize
- **Judge pages**: judge dashboard, project evaluation
- **Builder pages**: hackathon detail, submit page
- **Components**: `HackathonPhaseBadge` simplified — accepts `phase` prop directly instead of computing from dates
- **Host list** (`app/host/page.tsx`): groups hackathons by `phase` instead of `status`

### Analytics Fix

- AI analysis button now visible during `judging` and `completed` phases (was incorrectly gated on `status === "approved"`)
- Removed misleading "AI analysis is available during the judging phase" hint — button simply doesn't render outside allowed phases

---

## Judge Dashboard Phase Grouping & Client-Side Cleanup

### Judge Dashboard (`/judge`)

- Hackathons now grouped by phase: **Active — Ready to Judge**, **Upcoming**, **Building Phase**, **Past — Awaiting Finalization**, **Past — Finalized**
- Each section has a descriptive header and subtitle
- Phase badges with color-coded labels and icons (from `lib/hackathon-phase.ts`)
- Active (judging) cards use dark theme with lime accent border; inactive cards use light muted theme
- Only judging-phase hackathons link to `/judge/[id]`; all others link to the public hackathon page

### Deleted Files (Client-Side Data Layer Removal)

- **`lib/storage.ts`** — Async facade over `lib/db/*` modules (276 lines)
- **`lib/queries.ts`** — TanStack Query mutation hooks (`useSaveProject`, `useSaveHackathon`, etc.)
- **`lib/db/hackathons.ts`**, **`lib/db/profiles.ts`**, **`lib/db/storage.ts`**, **`lib/db/submissions.ts`**, **`lib/db/teams.ts`** — Dead CRUD modules replaced by Server Actions + `lib/server-data.ts`

### Migrated to Server Actions

- **`new-profile-form.tsx`** — `useSaveProject` → `saveProjectAction`
- **`residency-application-form.tsx`** — `useSaveProject` → `saveProjectAction`
- **`hackathon-form.tsx`** — `useSaveHackathon` → `saveHackathonAction` (removed `userId` prop)
- **`judging-form.tsx`** — Removed dead `getProject`/`getHackathon` imports from `lib/storage`
- **`social-generator.tsx`** — Removed dead `lib/storage` import
- **`projects-listing.tsx`** — Removed dead `lib/storage` imports

### AGENTS.md Updates

- Removed references to `lib/storage.ts`, `lib/queries.ts`, and deleted `lib/db/*` modules
- Updated data-access layer description to reflect current modules
- Updated anti-patterns to warn against importing from deleted files

---

## Remove Client-Side Auth — SSR-Only Auth Refactor

Deleted `useAuth()` hook and `AuthProvider` context. All auth now flows through `getServerAuth()` in server components.

### Removed
- `AuthContext`, `AuthProvider`, `useAuth()`, `getCapsHint()`, `fetchCaps()` from `app/providers.tsx`
- All `useAuth` imports across the codebase

### Changed
- **`app/providers.tsx`** — Now exports only `SupabaseProvider` wrapping `QueryClientProvider` (no auth context)
- **`components/side-nav.tsx`** — `SideNav` accepts `capabilities` prop instead of calling `useAuth()`
- **`components/layout-shell.tsx`** — Accepts and forwards `capabilities` prop to `SideNav`
- **`app/layout.tsx`** — Now async; fetches `getServerAuth()` and passes capabilities to `LayoutShell`
- **`lib/queries.ts`** — Removed `useAuth().loading` gating from all query hooks; queries are always enabled based on their own params
- **`app/login/page.tsx`** — Split into server component (redirect if authenticated) + `LoginForm` client component
- **`app/residency/[id]/application/page.tsx`** — Split into server component (fetches user/teams/hackathons) + `ResidencyApplicationForm` client component
- **`CLAUDE.md`** — Updated auth flow docs to reflect SSR-only pattern

### New Files
- `app/login/login-form.tsx` — Client login form extracted from page
- `app/residency/[id]/application/residency-application-form.tsx` — Client form with teams/hackathons passed as props

---

## Host Dashboard UX Overhaul (in progress)

### Side Navigation

- Replaced single "Applications" hash tab with Link-based navigation for all host routes
- Host dashboard level shows: **Dashboard**, **Manage**, **Analytics**
- Manage level shows: **Manage**, **Edit Info**, **Speakers**, **Judges**, **Cohosts** with a back button to the hackathon dashboard
- Global nav reordered: grouped Explore/Discover, My Projects, Host Dashboard, Judge Dashboard

### Host Dashboard (`/host/[id]`)

- Removed 3 navigation cards (Analytics, Manage, Invite Judges)
- Added 4 inline stat cards: Submissions, Judges, AI Evaluated, Avg Momentum
- Added "Full Analytics" link card to access the detailed analytics page
- Submissions table remains unchanged

### Manage Area (`/host/[id]/manage`)

- Added **Cohosts** card to management modules grid (now 2-column layout)
- Updated "Program Info" link from `/manage/info` to `/manage/edit`
- `/manage/info` now redirects to `/manage/edit`

### Cohosts Management (`/host/[id]/manage/cohosts`) — NEW

- New server page with auth + capability checks
- New `CohostInviteForm` client component:
  - Email invite form using `createInvitationAction` (type: `"cohost"`)
  - Active cohosts list with avatars
  - Pending invitations with status badges
  - Sidebar with stats and info guide

### Edit Hackathon Form — Expanded

- Added missing fields from database schema:
  - **Description** textarea (Section 01)
  - **Problem Statements** dynamic list with add/remove (Section 03)
  - **Judging Criteria** dynamic `{name, description}` array editor (Section 03)
  - **Technical Docs** URL input (Section 04 — new)
  - **Technical Resources** dynamic `{url, description}` array editor (Section 04 — new)
  - **Organizer Notes** internal textarea (Section 05 — new)
- Uses `useFieldArray` from react-hook-form for all dynamic arrays
- Updated Profile Completion sidebar to include Resources status
- Extended `editHackathonSchema` with `technical_docs`, `technical_resources`, `organizer_notes`
- Added `leaderboard_enabled` to `StoredHackathon` interface and mapper

### Live Preview Modal — NEW

- "Preview Public Page" button in the edit form sidebar opens a full-screen modal
- Modal renders the same sections as the public hackathon page (Info, Schedule, Prizes + Challenges)
- Uses shared `HackathonPreviewModal` component with extracted `InfoSection`, `ScheduleSection`, `PrizesSection`
- Live data from `watch()` values — updates reflect current form state without saving
- Closes with Escape key or clicking backdrop

### Draft Hackathon Lifecycle — NEW

- **Drafts hidden from public**: `getHackathonsServer()`, `getPublicHackathons()`, and `getResidencies()` now filter out `status = 'draft'` hackathons by default
- **Host dashboard sees all**: Host listing page passes `includeDrafts: true` so hosts can manage their drafts
- **Creation → Draft**: "Save as Draft" button text on creation flow, redirects to `/host/[id]/manage/edit` instead of dashboard
- **Publish action**: New `publishHackathonAction` server action sets `status = 'active'` with validation (requires name + start date)
- **Publish banner**: `PublishHackathonBanner` client component shown on host dashboard, manage page, and edit page when hackathon is draft — dashed border, rocket icon, "Publish Now" button
- **Draft badge**: Host listing page shows amber "Draft" badge instead of phase badge for draft hackathons

### Hackathon Logo & Banner — NEW

- **Migration**: Added `logo_url` and `banner_url` columns to `hackathons` table
- **Edit form**: Logo (square) and banner (rect) upload fields in Section 01 using existing `ImageUpload` component
- **Publish gate**: Logo is required to publish a hackathon — shows error if missing

### Shared Hackathon Section Components — NEW

- **`components/hackathon-sections.tsx`**: Three reusable server-compatible components:
  - `HackathonAboutSection` — logo, banner, name, theme, description, goal, website/docs links, technical resources. Supports `compact` mode for preview.
  - `HackathonScheduleSection` — timeline visualization with dots and connecting lines
  - `HackathonPrizesSection` — prize pool, challenges, sponsor tracks, judging criteria
- **Public view** (`builder-hackathon-detail.tsx`): Info tab now uses `HackathonAboutSection` — shows logo, banner, description, resources, and links that were previously missing
- **Preview modal** (`hackathon-preview-modal.tsx`): Rewritten to use all three shared components — consistent rendering between edit preview and public page

### Hackathon Resources System — NEW

- **`hackathon_resources` table**: Stores AI-compiled technical resources per hackathon (JSONB content, source URLs, generation timestamp)
- **`lib/db/hackathon-resources.ts`**: CRUD module with `getHackathonResources()` and `upsertHackathonResources()`
- **`lib/agents/resource-provisioner.ts`**: Extracted core logic from API route — `generateAndPersistResources()` compiles cheatsheet, tracks, and challenge maps from hackathon data
- **Auto-trigger on publish**: When a hackathon moves from draft → active, resource generation fires in the background
- **Ideator/mentor agents**: Now fetch `hackathon_resources` content and inject it as `TECHNICAL RESOURCES` context, giving builders richer guidance
- **Resource provisioner API route**: Simplified to delegate to the lib function, still supports manual triggering by hosts

### Database Cleanup

- **Dropped tables**: `hackathon_tracks`, `hackathon_track_chunks`, `knowledge_base_chunks` (replaced by `hackathon_resources`)
- **Dropped column**: `technical_docs` from `hackathons` (redundant with `technical_resources` array)
- **Dropped RPC functions**: `match_kb_chunks`, `match_hackathon_track_chunks`
- **Stubbed modules**: `lib/db/hackathon-tracks.ts` and `lib/db/knowledge-base.ts` — exports preserved as no-ops to prevent import breakage

### Other Changes

- Removed deleted `/host/[id]/judges` page (functionality moved to `/manage/judges`)
- Minor fixes to analytics page imports
- Notification page and hackathon listing page styling tweaks
- `json-schemas.ts` type adjustments
- Middleware cleanup
- Moved `/portalcomponents` to `/components/portalcomponents`