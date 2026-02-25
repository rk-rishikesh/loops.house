# LoopsFlow Workflow Tests

Agent-browser validation guide covering all role workflows from PLATFORM.md.

## Prerequisites

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run db:seed      # Seed database with test data (run once)
```

## Test Credentials

| Role       | Email                      | Password      | Default Route      |
|------------|----------------------------|---------------|--------------------|
| Builder    | builder@loopsflow.test     | Builder123!   | /builder           |
| Builder 2  | builder2@loopsflow.test    | Builder2123!  | /builder           |
| Host       | host@loopsflow.test        | Host123!      | /host              |
| Viewer     | viewer@loopsflow.test      | Viewer123!    | /boosters          |
| Admin      | admin@loopsflow.test       | Admin123!     | /admin             |
| Judge      | judge@loopsflow.test       | Judge123!     | /host/judging      |

## Seeded Data Reference

- **Boosters:** ETH Denver 2026 Idea Booster (active), Loops Momentum Sprint (active), Capital Raise Q1 (draft)
- **Projects:** YieldFlow Protocol (Team Alpha), ArtChain Gallery (Team Alpha), DevConnect Hub (Team Beta)
- **Submissions:** YieldFlow → Idea Booster (scored), ArtChain → Idea Booster (submitted), DevConnect → Momentum Sprint (under_review)
- **Judge invite:** Frank Judge → ETH Denver Idea Booster

---

## Helper: Login Flow

Used at the start of every workflow.

```
agent-browser open http://localhost:3000/login
agent-browser snapshot -i
# Find email input (@e_), password input (@e_), sign in button (@e_)
agent-browser fill @EMAIL_REF "builder@loopsflow.test"
agent-browser fill @PASSWORD_REF "Builder123!"
agent-browser click @SIGNIN_BTN_REF
agent-browser snapshot -i
# Verify redirect to correct dashboard
```

## Helper: Logout

```
agent-browser snapshot -i
# Find logout button (LogOut icon, top-right nav)
agent-browser click @LOGOUT_BTN_REF
agent-browser snapshot -i
# Verify redirect to /login
```

---

## WF-01: Public — Browse Loops Store (Viewer, no auth)

**User story:** 3.5 — Viewer can browse Loops Store without an account.

```
agent-browser open http://localhost:3000/viewer
agent-browser snapshot -i
# VERIFY: Project cards visible (YieldFlow, ArtChain, DevConnect)
# VERIFY: No login required

agent-browser open http://localhost:3000/viewer/projects/c0000000-0000-0000-0000-000000000001
agent-browser snapshot -i
# VERIFY: YieldFlow profile loads — name, tagline, tech stack badges
# VERIFY: Project Chat widget visible (requires login to send)
```

---

## WF-02: Public — Browse Boosters (no auth)

**User story:** 3.5 — Viewer can explore active and past Boosters without logging in.

```
agent-browser open http://localhost:3000/boosters
agent-browser snapshot -i
# VERIFY: Booster cards listed

agent-browser open http://localhost:3000/boosters/idea
agent-browser snapshot -i
# VERIFY: Idea Boosters section

agent-browser open http://localhost:3000/boosters/idea/d0000000-0000-0000-0000-000000000001
agent-browser snapshot -i
# VERIFY: ETH Denver Idea Booster detail page loads
# VERIFY: Problem statements visible
```

---

## WF-03: Auth — Login + Role Redirect

**User story:** 3.2.1 — Builder lands on Builder Dashboard after login.

```
# Test each role gets correct redirect:

# Builder → /builder
agent-browser open http://localhost:3000/login
# [Login as builder@loopsflow.test / Builder123!]
# VERIFY: Redirected to /builder (URL contains /builder)
# VERIFY: "Project Hub" heading visible
# [Logout]

# Host → /host
# [Login as host@loopsflow.test / Host123!]
# VERIFY: Redirected to /host
# VERIFY: "Host" heading + "Loops · Host" in nav
# [Logout]

# Admin → /admin
# [Login as admin@loopsflow.test / Admin123!]
# VERIFY: Redirected to /admin
# VERIFY: "Platform Overview" heading + metric cards visible
# [Logout]

# Judge → /host/judging
# [Login as judge@loopsflow.test / Judge123!]
# VERIFY: Redirected to /host/judging
# VERIFY: Nav shows ONLY "Judging" link, NOT Dashboard/Analytics/Boosters/Judges
# VERIFY: Header says "Loops · Judge"
# [Logout]

# Viewer → /boosters
# [Login as viewer@loopsflow.test / Viewer123!]
# VERIFY: Redirected to /boosters
# [Logout]
```

---

## WF-04: Auth — Role Access Control (Builder blocked from /host)

**User story:** Security — builders cannot access host routes.

```
# [Login as builder2@loopsflow.test / Builder2123!]
agent-browser open http://localhost:3000/host
agent-browser snapshot -i
# VERIFY: Redirected to /builder (not /host)
# VERIFY: "Project Hub" visible, NOT host dashboard content
# [Logout]
```

---

## WF-05: Builder — Team Management (Alice)

**User story:** 3.2.2 — Create team, view team membership.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder/teams
agent-browser snapshot -i
# VERIFY: "Team Alpha" listed (Alice is owner)
# VERIFY: Dave Builder listed as member

# Create a new team
agent-browser snapshot -i
# Find "Create new team" form / button
agent-browser fill @TEAM_NAME_REF "Test Team"
agent-browser click @CREATE_TEAM_BTN_REF
agent-browser snapshot -i
# VERIFY: "Test Team" appears in team list
# [Logout]
```

---

## WF-06: Builder — View Existing Projects (Alice)

**User story:** 3.2.3 — Manage Loops Profiles.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder
agent-browser snapshot -i
# VERIFY: "Project Hub" heading
# VERIFY: YieldFlow Protocol card visible
# VERIFY: ArtChain Gallery card visible

agent-browser open http://localhost:3000/builder/projects
agent-browser snapshot -i
# VERIFY: Project list shows both YieldFlow and ArtChain
```

---

## WF-07: Builder — Create New Loops Profile (Alice)

**User story:** 3.2.3 — Create a Loops Profile; AI pipeline runs.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder/new
agent-browser snapshot -i
# VERIFY: Form loads with team dropdown populated (Team Alpha visible)

# Fill form
agent-browser fill @PROJECT_NAME_REF "My Test Project"
agent-browser fill @DESCRIPTION_REF "A test project for workflow validation."
agent-browser fill @GITHUB_URL_REF "https://github.com/example/test"
# Select team
agent-browser snapshot -i
# Find team select dropdown
agent-browser click @TEAM_SELECT_REF  # or use fill if select
agent-browser snapshot -i
# Submit form
agent-browser click @SUBMIT_BTN_REF
agent-browser snapshot -i
# VERIFY: AI progress indicators appear (code-reader, demo-reader, theme-reader)
# VERIFY: After completion, profile is created and navigates to profile page
# [Logout]
```

---

## WF-08: Builder — Ideate with AI (Alice)

**User story:** 3.2.4 — Use Project Ideator Agent in Booster ideation flow.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder/ideate
agent-browser snapshot -i
# VERIFY: Booster selector visible
# VERIFY: ETH Denver 2026 Idea Booster in dropdown

# Select booster and send a message
agent-browser snapshot -i
# Find booster select
agent-browser click @BOOSTER_SELECT_REF
agent-browser snapshot -i
# Select ETH Denver booster option
agent-browser fill @MESSAGE_INPUT_REF "I want to build a DeFi yield optimizer. What do you think?"
agent-browser click @SEND_BTN_REF
agent-browser snapshot -i
# VERIFY: AI response appears with project ideation guidance
# VERIFY: Response references DeFi / booster context
# [Logout]
```

---

## WF-09: Builder — Submit Project to Booster (Alice)

**User story:** 3.2.4 — Submit project to a Booster.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder/boosters
agent-browser snapshot -i
# VERIFY: Available boosters listed (Idea, Momentum at minimum)

agent-browser open http://localhost:3000/builder/boosters/d0000000-0000-0000-0000-000000000001/submit
agent-browser snapshot -i
# VERIFY: Booster info shown (ETH Denver Idea Booster)
# VERIFY: Project selection (YieldFlow, ArtChain as radio options)
# VERIFY: Team selection

# Select ArtChain project (YieldFlow already submitted)
agent-browser snapshot -i
agent-browser click @ARTCHAIN_RADIO_REF
agent-browser click @SUBMIT_BTN_REF
agent-browser snapshot -i
# VERIFY: Success state — "Submitted!" or similar confirmation
# [Logout]
```

---

## WF-10: Builder — Social Amplifier (Alice)

**User story:** 3.2.3 — Generate LinkedIn/Twitter posts from Loops Profile.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/builder/share
agent-browser snapshot -i
# VERIFY: Project dropdown populated (YieldFlow, ArtChain)
# VERIFY: Booster dropdown available

# Select project and generate
agent-browser snapshot -i
# Find project select
agent-browser click @PROJECT_SELECT_REF
agent-browser snapshot -i
# Select YieldFlow Protocol
agent-browser click @GENERATE_BTN_REF
agent-browser snapshot -i
# VERIFY: LinkedIn post text appears (150-250 words, professional)
# VERIFY: Twitter post text appears (under 280 chars)
# VERIFY: Suggested hashtags appear
# [Logout]
```

---

## WF-11: Builder — Apply to Become Host (Alice)

**User story:** 3.3 — Prospective host submits application via public form.

```
# [Login as builder@loopsflow.test / Builder123!]
agent-browser open http://localhost:3000/host/apply
agent-browser snapshot -i
# VERIFY: Host application form loads (any auth user can access)

# Fill form
agent-browser fill @EVENT_NAME_REF "My Hackathon"
agent-browser fill @EXPECTED_PARTICIPANTS_REF "100"
agent-browser fill @DESCRIPTION_REF "A community hackathon for Web3 builders."
agent-browser fill @CONTACT_REF "alice@example.com"
# Select booster type
agent-browser click @SUBMIT_BTN_REF
agent-browser snapshot -i
# VERIFY: Success message — application submitted
# [Logout]
```

---

## WF-12: Viewer — Project Chat (authenticated)

**User story:** 3.5 — Viewer can interact with Project Chat AI widget after login.

```
# [Login as viewer@loopsflow.test / Viewer123!]
agent-browser open http://localhost:3000/viewer/projects/c0000000-0000-0000-0000-000000000001
agent-browser snapshot -i
# VERIFY: YieldFlow profile loads
# VERIFY: Project Chat widget visible

# Send a chat message
agent-browser fill @CHAT_INPUT_REF "What does YieldFlow do?"
agent-browser click @SEND_CHAT_BTN_REF
agent-browser snapshot -i
# VERIFY: AI response about YieldFlow Protocol appears

# Test Code Query tab
agent-browser click @CODE_EXPLORER_TAB_REF
agent-browser snapshot -i
agent-browser fill @CODE_QUERY_INPUT_REF "How does the deposit function work?"
agent-browser click @CODE_QUERY_SUBMIT_REF
agent-browser snapshot -i
# VERIFY: Code-based answer about the deposit function appears
# [Logout]
```

---

## WF-13: Host — View Dashboard + Submissions (Bob)

**User story:** 3.3 — Host views submitted projects and grades them.

```
# [Login as host@loopsflow.test / Host123!]
agent-browser open http://localhost:3000/host
agent-browser snapshot -i
# VERIFY: "Host" heading
# VERIFY: "Loops · Host" in nav (not "Loops · Judge")
# VERIFY: Nav shows: Dashboard, Analytics, Judging, Boosters, Judges
# VERIFY: "Project submitted list" section shows YieldFlow, ArtChain, DevConnect

# Verify Grade project button
agent-browser snapshot -i
# Find "Grade project" button for YieldFlow
agent-browser click @GRADE_PROJECT_BTN_REF
agent-browser snapshot -i
# VERIFY: Navigated to /host/judging with project_id and booster_id pre-filled
# [Logout]
```

---

## WF-14: Host — AI Analytics Report (Bob)

**User story:** 3.3 — Host generates AI Analytics report (Metric Analyst Agent).

```
# [Login as host@loopsflow.test / Host123!]
agent-browser open http://localhost:3000/host/analytics
agent-browser snapshot -i
# VERIFY: Booster dropdown populated (ETH Denver, Loops Momentum, Capital Raise)

# Select booster and generate report
agent-browser snapshot -i
# Booster should be pre-selected
agent-browser click @GENERATE_REPORT_BTN_REF
agent-browser snapshot -i
# VERIFY: AI narrative report appears (300-400 words)
# VERIFY: Key highlights section visible (3-5 bullet points)
# [Logout]
```

---

## WF-15: Host — AI Project Evaluation (Bob)

**User story:** 3.3 — Host uses AI Judge to evaluate a submission.

```
# [Login as host@loopsflow.test / Host123!]
agent-browser open http://localhost:3000/host/judging
agent-browser snapshot -i
# VERIFY: Project dropdown populated
# VERIFY: Booster dropdown populated

# Select YieldFlow + ETH Denver
agent-browser snapshot -i
agent-browser click @EVALUATE_BTN_REF
agent-browser snapshot -i
# VERIFY: AI evaluation results appear with criteria scores
# VERIFY: Overall score shown (0-100)
# VERIFY: Per-criterion scores with justification

# Enter human scores
agent-browser snapshot -i
# Find human score input fields
agent-browser fill @HUMAN_SCORE_REF "85"
agent-browser click @SAVE_SCORES_BTN_REF
agent-browser snapshot -i
# VERIFY: "Saved" confirmation appears
# [Logout]
```

---

## WF-16: Host — Manage Boosters (Bob)

**User story:** 3.3 — Host can create and edit Booster pages.

```
# [Login as host@loopsflow.test / Host123!]
agent-browser open http://localhost:3000/host/boosters
agent-browser snapshot -i
# VERIFY: Booster list or creation form visible
# VERIFY: ETH Denver Idea Booster listed (or form to create new)

# Click or fill booster form fields
agent-browser snapshot -i
# [Logout]
```

---

## WF-17: Judge — Access Judging Panel (Frank)

**User story:** 3.4 — Judge receives invite, browses submitted projects, scores them.

```
# [Login as judge@loopsflow.test / Judge123!]
agent-browser open http://localhost:3000/host/judging
agent-browser snapshot -i
# VERIFY: Redirected to /host/judging (judge default dashboard)
# VERIFY: Header shows "Loops · Judge" (NOT "Loops · Host")
# VERIFY: Nav shows ONLY "Judging" link — NO Dashboard, Analytics, Boosters, Judges links

# Verify project access
agent-browser snapshot -i
# VERIFY: Project and booster selects populated
# VERIFY: ETH Denver booster available (judge is invited to it)

# Use Project Chat on a project
agent-browser open http://localhost:3000/viewer/projects/c0000000-0000-0000-0000-000000000001
agent-browser snapshot -i
# VERIFY: YieldFlow profile visible with chat widget
agent-browser fill @CHAT_INPUT_REF "What is the main architecture of YieldFlow?"
agent-browser click @SEND_BTN_REF
agent-browser snapshot -i
# VERIFY: Knowledge-base grounded answer appears
# [Logout]
```

---

## WF-18: Admin — Platform Overview (Eve)

**User story:** 3.1 — Admin views platform-wide metrics.

```
# [Login as admin@loopsflow.test / Admin123!]
agent-browser open http://localhost:3000/admin
agent-browser snapshot -i
# VERIFY: "Platform Overview" heading
# VERIFY: Metric cards: Total Users, Loops Profiles, Boosters, Submissions, Pending Applications
# VERIFY: All counts > 0 (seeded data)
```

---

## WF-19: Admin — Review Host Applications (Eve)

**User story:** 3.1 — Admin can list and approve/reject host applications.

```
# [Login as admin@loopsflow.test / Admin123!]
agent-browser open http://localhost:3000/admin/applications
agent-browser snapshot -i
# VERIFY: Host applications listed
# VERIFY: Alice's "Community Hack Night" application with status "pending"
# VERIFY: Approve/Reject buttons available

# Approve Alice's application
agent-browser click @APPROVE_BTN_REF
agent-browser snapshot -i
# VERIFY: Status changes to "approved"
# VERIFY: Alice's role would be elevated to "host" (verify via /admin/users)
```

---

## WF-20: Admin — User Management (Eve)

**User story:** 3.1 — Admin can view and manage all registered users.

```
# [Login as admin@loopsflow.test / Admin123!]
agent-browser open http://localhost:3000/admin/users
agent-browser snapshot -i
# VERIFY: User list shows all 6 test users
# VERIFY: Each user shows: email, role, display_name
# VERIFY: Role change controls available

# Verify Dave is listed as "builder" (not host)
agent-browser snapshot -i
# Find Dave Builder in user list
# VERIFY: Dave's role shows "builder"
```

---

## WF-21: Admin — Access Builder + Host Routes (Eve)

**User story:** 3.1 — Admin can use all routes (builder + host + admin).

```
# [Login as admin@loopsflow.test / Admin123!]

# Can access builder routes
agent-browser open http://localhost:3000/builder
agent-browser snapshot -i
# VERIFY: Loads (not redirected away)

# Can access host routes
agent-browser open http://localhost:3000/host
agent-browser snapshot -i
# VERIFY: Loads (not redirected away)

# Can access admin routes
agent-browser open http://localhost:3000/admin
agent-browser snapshot -i
# VERIFY: Platform Overview loads
# [Logout]
```

---

## WF-22: Dave Builder — Separate Team/Project Context

**User story:** Validate Dave (builder2) has his own context (Team Beta, DevConnect Hub).

```
# [Login as builder2@loopsflow.test / Builder2123!]
agent-browser open http://localhost:3000/builder
agent-browser snapshot -i
# VERIFY: "Project Hub" (builder dashboard, NOT host)
# VERIFY: Dave can see his projects

agent-browser open http://localhost:3000/builder/teams
agent-browser snapshot -i
# VERIFY: "Team Beta" listed (Dave is owner)

# Verify Dave cannot access host routes
agent-browser open http://localhost:3000/host
agent-browser snapshot -i
# VERIFY: Redirected back to /builder, NOT on host dashboard
# [Logout]
```

---

## Quick Smoke Test (run all critical paths in sequence)

```
# 1. Public access
WF-01, WF-02

# 2. Login + redirects (all roles)
WF-03

# 3. Role blocking
WF-04, WF-22

# 4. Core builder flow
WF-05 → WF-07 → WF-09 → WF-10

# 5. Host management
WF-13 → WF-14 → WF-15

# 6. Judge judging
WF-17

# 7. Admin control
WF-18 → WF-19 → WF-20
```

---

## Notes for Agent-Browser Usage

1. **Always snapshot after navigation** — element refs change per page
2. **Refs are session-scoped** — `@e1` from one snapshot may differ on the next
3. **SSE streaming pages** (profile creator, ideate, project chat) — wait for response before next snapshot
4. **Rate limits** — project chat: 10 messages/session unauthenticated; code query: 20/hour
5. **Seeded project IDs for direct navigation:**
   - YieldFlow: `c0000000-0000-0000-0000-000000000001`
   - ArtChain: `c0000000-0000-0000-0000-000000000002`
   - DevConnect: `c0000000-0000-0000-0000-000000000003`
   - Idea Booster: `d0000000-0000-0000-0000-000000000001`
   - Momentum Booster: `d0000000-0000-0000-0000-000000000002`
