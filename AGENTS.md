# AGENTS.md

AI Agent Architecture for LoopsFlow.

## Overview

LoopsFlow has 19 API routes under `app/api/`:

- **12 AI agent routes** — use Gemini for generation/analysis
- **4 sub-agent utility routes** — reusable building blocks called by other agents
- **3 CRUD REST endpoints** — standard data operations, no AI

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

## Gemini Client (`app/api/lib/gemini-client.ts`)

| Export | Description |
|--------|-------------|
| `ai` | `GoogleGenAI` instance |
| `MODELS` | `{ pro: "gemini-2.5-pro", flash: "gemini-2.0-flash", embedding: "gemini-embedding-001" }` |
| `generateContent(model, contents, config?)` | Single-turn generation |
| `generateJSON<T>(model, prompt, systemInstruction?)` | Structured JSON output (temperature 0.2) |
| `streamContent(model, contents, config?)` | Streaming generation |

Model tier is always passed explicitly: `"pro"`, `"flash"`, or `"embedding"`. Can be overridden via env vars `GEMINI_PRO_MODEL`, `GEMINI_FLASH_MODEL`, `GEMINI_EMBEDDING_MODEL`.

## Shared Infrastructure (`app/api/lib/`)

| File | Purpose |
|------|---------|
| `sse.ts` | `createSSEStream()` + `sseResponse()` for event-stream responses |
| `rate-limiter.ts` | `checkRateLimit(key, max, windowMs)` — delegates to DB via `lib/db/rate-limiter.ts` |
| `embeddings.ts` | `embedText()`, `embedBatch()`, `cosineSimilarity()` — 768-dim via gemini-embedding-001 |
| `knowledge-base.ts` | `buildKnowledgeBase()`, `chunkText()` — chunks text, embeds, stores in pgvector |
| `vector-store.ts` | `upsertChunks()`, `getChunks()`, `queryTopK()`, `hasProject()` — facade over `lib/db/knowledge-base.ts` |

---

## Builder Agents (`app/api/builder-agents/`)

### profile-creator

- **Purpose:** Create a full project profile with AI enrichment
- **Roles:** builder, host, admin
- **Model:** `"pro"` (tagline/category consolidation)
- **Response:** SSE stream (progress events + complete event)
- **Input:** `team_id`, `name`, `description`, optional: `github_url`, `youtube_url`, `logo_url`, `website_url`, `screenshot_urls`, `additional_links`, `social_links`, `booster_id`
- **Sub-agents used:** `code-reader` (GitHub), `demo-reader` (YouTube), `theme-reader` (screenshots/logo)
- **Side effects:** Inserts `loops_profiles` row, builds knowledge base (pgvector), updates profile with enriched data
- **Output events:** `progress` (per sub-agent), `complete` (full profile response), `flattened_codebase` (if GitHub analyzed)

### project-ideator

- **Purpose:** Conversational brainstorming mentor for project ideas within a booster context
- **Roles:** builder, host, admin
- **Model:** `"flash"` (streaming)
- **Response:** SSE text stream (token-by-token)
- **Input:** `message`, `conversation_history`, `booster_context` (problem statements, sponsor tracks, theme), optional `project_snapshot`
- **Behavior:** Conversational chat with history summarization (15 message window), refuses code/debugging requests

### social-amplifier

- **Purpose:** Generate LinkedIn/Twitter posts for project promotion
- **Roles:** builder, host, admin
- **Model:** `"flash"`
- **maxDuration:** 10s
- **Response:** JSON
- **Input:** `project` (name, tagline, description, tech, category, features, URL), optional `booster` (name, result), optional `tone` (professional/casual/excited)
- **Output:** `{ linkedin_post, twitter_post, suggested_hashtags }`

---

## Host Agents (`app/api/host-agents/`)

### booster-generator

- **Purpose:** Generate a full booster program draft from host input
- **Roles:** host, admin
- **Model:** `"flash"`
- **Rate limit:** 5 per day per user
- **Response:** JSON
- **Input:** `{ booster: BoosterInput }` — id, name, theme, booster_type, problem_statements, and optional fields
- **Output:** `{ booster_id, draft: ProgramDraft, generated_at }`

### metric-analyst

- **Purpose:** Generate analytics reports for booster submissions
- **Roles:** host, admin
- **Model:** `"flash"`
- **Response:** JSON
- **Input:** `booster_id`, `report_type` (overview/submissions/builder-graph/momentum-leaderboard/full), optional `booster`, `metrics`
- **Output:** `{ narrative, raw_metrics, generated_at, highlights }`

### project-evaluator

- **Purpose:** AI judging of a project against rubric criteria
- **Roles:** host, judge, admin
- **Model:** `"pro"` (all criterion evaluations and summary)
- **Response:** JSON
- **Input:** `project_id`, `booster_id`, `judge_mode` (preview/official), optional `judging_rubric`, optional inline `project`/`booster`
- **Behavior:** Evaluates each criterion in parallel. 5 default criteria (Code Integration, Ideation, Uniqueness, Product Readiness, Track/Sponsor Fit). Falls back to pgvector knowledge base if no inline project data.
- **Side effects:** Persists `ai_score` to `submissions` table
- **Output:** `{ project_id, booster_id, overall_score, overall_summary, criteria_scores[], judge_mode, generated_at, model_version, saved }`

### resource-provisioner

- **Purpose:** Generate technical resource plan for builders in a booster
- **Roles:** host, admin
- **Model:** `"flash"`
- **Rate limit:** 5 per day per user
- **Response:** JSON
- **Input:** `{ booster: BoosterInput }` — same shape as booster-generator
- **Output:** `{ booster_id, resources: { technical_cheatsheet, tracks[], challenge_resource_map[] }, generated_at }`

### save-evaluation

- **Purpose:** Persist evaluation scores (AI or human) to the submissions table
- **Roles:** host, judge, admin
- **Model:** None (pure CRUD, no AI)
- **Response:** JSON
- **Input:** `{ project_id, booster_id, ai_score?, human_score?, status? }`
- **Output:** `{ success, submission }`
- **Note:** Not an AI agent — data persistence endpoint grouped with host-agents for routing convenience

---

## DevRel Agents (`app/api/devrel-agents/`)

### tech-buddy

- **Purpose:** RAG-powered resource assistant that answers questions from sponsor docs
- **Roles:** any authenticated
- **Model:** `"pro"` (streaming, temperature 0.1)
- **Response:** SSE text stream
- **Input:** `message`, `conversation_history`, `booster_id`
- **Special action:** `{ action: "load_resources", booster_id, resources: ResourceBundle }` — pre-loads sponsor docs as in-memory embeddings
- **Behavior:** Retrieves relevant chunks via cosine similarity (threshold 0.75), cites sources. Refuses general programming questions. In-memory cache of 50 boosters' resources.

---

## Viewer Agents (`app/api/viewer-agents/`)

### code-query

- **Purpose:** Answer specific questions about a project's codebase
- **Roles:** any authenticated
- **Model:** `"pro"`
- **maxDuration:** 30s
- **Rate limit:** 20 per hour per user
- **Response:** JSON
- **Input:** `{ project_id, question, project? }`
- **Behavior:** If inline `project` provided, uses that context. Otherwise falls back to pgvector knowledge base.
- **Output:** `{ answer }`

### project-chat

- **Purpose:** Conversational Q&A about a project using its knowledge base
- **Roles:** any authenticated
- **Model:** `"pro"` (streaming, temperature 0.3)
- **Response:** SSE text stream
- **Input:** `project_id`, `message`, `conversation_history`, optional `project`
- **Behavior:** Similarity threshold 0.70 for pgvector retrieval. 10-message conversation history window. Grounded in project context only.

---

## Standalone Agents (`app/api/agents/`)

### agents/youtube

- **Purpose:** YouTube video analysis (direct Gemini video input or transcript fallback)
- **Roles:** any authenticated
- **maxDuration:** 120s
- **Response:** JSON
- **Input:** `{ url }`
- **Implementation:** Delegates to `lib/agents/youtube.ts` which tries `gemini-3-flash-preview` direct video analysis first, falls back to `gemini-2.0-flash` with `YoutubeTranscript`
- **Output:** `{ title, transcript, keyMoments[], insights, fullContent }`

---

## Sub-Agents (`app/api/sub-agents/`)

Sub-agents are reusable building blocks. They expose both exported functions (called in-process by parent agents) and HTTP POST endpoints.

### code-reader

- **Purpose:** Flatten a GitHub repo and extract tech stack
- **Exported functions:** `flattenAndIndex(githubUrl, token?)`, `queryCode(projectId, question)`
- **Model:** `"flash"` (tech stack detection), `"pro"` (code Q&A)
- **maxDuration:** 60s
- **Dependencies:** `@octokit/rest`, `lib/github-utils.ts`

### demo-reader

- **Purpose:** Analyze a YouTube demo video for structured project metadata
- **Exported function:** `analyzeYoutube(url, problemStatement?)`
- **Model:** `"pro"` (direct video analysis with `fileUri`)
- **maxDuration:** 120s
- **Output:** `{ summary, key_features, problem_addressed, tech_mentioned, timestamps, raw_transcript }`

### theme-reader

- **Purpose:** Extract visual design theme from screenshots/logo
- **Exported function:** `analyzeTheme(screenshotUrls, logoUrl?)`
- **Model:** `"flash"` (multimodal image analysis)
- **maxDuration:** 30s
- **Output:** `{ primary_color, accent_color, secondary_color, theme_label, design_description }`

### youtube (sub-agent)

- **Purpose:** Standalone YouTube transcript + analysis
- **maxDuration:** 120s
- **Note:** Wraps `lib/agents/youtube.ts` — distinct from `agents/youtube` top-level route

---

## Sub-Agent Orchestration Pattern

The **profile-creator** is the primary orchestrator. It runs three sub-agents in parallel:

```
profile-creator (parent)
  |-- code-reader    (GitHub -> flattened code + tech stack)
  |-- demo-reader    (YouTube -> structured demo metadata)
  |-- theme-reader   (Screenshots/Logo -> color palette + theme)
  |
  v
  Merge results -> Build knowledge base (pgvector) -> Generate tagline/category -> Persist to DB -> SSE response
```

Each sub-agent:

1. Is called via exported function (not HTTP), avoiding network overhead
2. Reports progress back to the parent via SSE `send()` callbacks
3. Fails gracefully — parent continues with other sub-agents if one fails

---

## CRUD REST Endpoints

### admin (`app/api/admin/`)

- **Roles:** admin only
- **Methods:** GET (metrics or user list), PATCH (update user role)
- **Validation:** `adminRoleUpdateSchema` (Zod)

### host-applications (`app/api/host-applications/`)

- **Roles:** any authenticated (POST/GET), admin (PATCH)
- **Methods:** POST (submit application), GET (list applications), PATCH (approve/reject)
- **Side effect:** Approved applications promote user to host role
- **Validation:** `hostApplicationCreateSchema`, `hostApplicationReviewSchema` (Zod)

### judge-invites (`app/api/judge-invites/`)

- **Roles:** host/admin (POST), any authenticated (GET/PATCH)
- **Methods:** POST (invite judge by email), GET (list invites), PATCH (accept invite)
- **Side effect:** Accepted invite promotes user to judge role
- **Validation:** `judgeInviteCreateSchema`, `judgeInviteAcceptSchema` (Zod)
