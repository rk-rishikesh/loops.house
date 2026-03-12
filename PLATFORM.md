# Project Documentation

**![][image1]**

**LOOPS HOUSE**

**Product Requirements Document**

Version 2.0 | Germina Labs | 2026

Loops House is an AI-native developer experience platform where builders create permanent, AI-enriched project profiles (Loops Profiles) in a searchable public store. Hosts run end-to-end developer events (Boosters) including builder registration, AI-assisted judging, and real-time analytics. This PRD covers the full feature set, user flows, data models, and acceptance criteria.

# **1\. Product Overview**

## **1.1 Vision**

Loops House is the permanent home for developer projects. Every project built during a Hackathon, Residency — or independently — deserves a rich, discoverable profile with AI-generated insights, live metrics, and an AI representative powered by its own knowledge base.

## **1.2 What Are Boosters?**

Boosters are structured developer events hosted on Loops House. There are three types:

- Idea Boosters — Ideation challenges where builders propose solutions to a problem statement or Request for Startups (RFS). Followed by a week of building in hackathon format. Judged primarily on idea quality, uniqueness, and problem-solution fit.

- Momentum Boosters — Build sprints where teams ship a working product against defined criteria. Judged on technical depth, product readiness, and GitHub activity. Funding is streamed with a rate directly proportional to the momentum score of the project calculated at the end of each sprint.

- Capital Boosters — Grants where builders apply with a project for financial support. Judged on viability, impact, and team strength. Funds are distributed based on milestones.

**1.3 Loops House Residency**

Loops House Residency is a 5 days residency program hosted around the world for selected teams who shine in various boosters hosted on the Loops House platform. Builders apply for Residency with a product.

Flow: Login \-\> Apply \-\> Residency Form \-\> Loops Profile Gets created \-\> Edit/Submit.

## **1.4 Core Value Propositions**

- Builders: One link captures everything — code, demo, product visuals, tech stack, and an AI product representative that answers questions about the project.

- Hackathon Hosts: End-to-end developer event management with problem statement curation (RFS), AI judging, builder analytics, and a custom Hackathon page.

- Viewers: A curated, searchable project gallery — like Product Hunt for developer projects. AI-powered chat with any featured project.

- Admins (Germina Labs): Full platform control, host approval workflows, and database visibility.

## **1.5 Platforms**

- Web application (responsive, desktop and mobile optimized)

- REST API for third-party integrations

# **2\. Actors & Permission Matrix**

| Actor                | Authentication                    | Key Permissions                                                                             | Access Level           |
| :------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------ | :--------------------- |
| Admin (Germina Labs) | Internal SSO                      | Full platform management, DB access, host approval, config                                  | Super Admin            |
| Builder              | Google OAuth / Email              | Create/manage teams, create/manage Loops Profiles, join Boosters/Residency, submit projects | Authenticated          |
| Hackathon Host       | OAuth \+ Admin Approval           | Create Boosters (all 3 types), view builder graph, configure judging, access analytics      | Elevated Authenticated |
| Judge                | OAuth \+ Host Invitation          | View submitted projects, use AI judge tool, enter human scores, leave remarks               | Elevated Authenticated |
| General Viewer       | None (public) / Login to interact | Browse Loops Projects Store, explore Boosters, chat with project AI (rate-limited)          | Public                 |

# **3\. User Stories & Functional Requirements**

## **3.1 Admin (Germina Labs)**

- As an admin, I can view and manage all registered users, teams, and projects via an admin dashboard.

- As an admin, I can list Boosters and give host rights to partners.

- As an admin, I can view raw database records and export any data.

- As an admin, I can disable or suspend any user account or project listing.

- As an admin, I can view platform-wide metrics: total users, profiles, Boosters, and AI agent usage.

## **3.2 Builders**

### **3.2.1 Authentication**

- As a builder, I can sign up and log in with Google OAuth or email/password.

- As a builder, I land on my Builder Dashboard after login.

### **3.2.2 Teams**

- As a builder, I can create a team (a team can be a single member).

- As a team owner, I can invite members by email.

- As a team owner, I can remove members from my team.

- As a builder, I can belong to multiple teams simultaneously.

- As a builder, I must have a team before submitting a project to any Hackathon.

- As a team member, I can leave a team.

### **3.2.3 Loops Profile (Project Profile)**

- As a builder, I can create a Loops Profile by submitting a form with: Project Name, Description, Logo, Website URL, GitHub URL, YouTube demo URL, Product Visuals (images), and Additional Links.

- As a builder, after form submission, the AI Profile Creator Agent pipeline runs automatically and populates: refined description, tagline, tech stack tags, color theme, project category, and a knowledge base.

- As a builder, I can see real-time progress of each AI sub-agent (code-reader, demo-reader, theme-reader) as my profile generates.

- As a builder, the final metadata of my project’s loops profile will consist of Project Name, refined description, Logo, Website URL, GitHub URL, YouTube demo URL, Product Visuals (images), tagline, tech stack tags, color theme, project category, and a knowledge base.

- As a builder, I can edit any field of the metadata in my Loops Profile at any time.

- As a builder, my Loops Profile gets a public shareable URL (e.g., loops.house/myproject).

- As a builder, I can use the Social Amplifier Agent to generate LinkedIn and Twitter posts about my project.

### **3.2.4 Hackathon Participation**

- As a builder, I can browse active and upcoming Boosters (Idea, Momentum, Capital) on the Explore Boosters page.

- As a builder, I can view residency programs and register for that with any project.

- As a builder, I can apply to a Hackathon individually or with my team.

- As a builder, I can submit a project to a Hackathon using an existing Loops Profile or by creating a new one during the application flow.

- As a builder, I can use the Project Ideator Agent while exploring a Hackathon to ideate project ideas based on the problem statement.

- As a builder, I can see all my Hackathon applications and their statuses in my dashboard.

- As a builder, I can see my AI Judge score and human judge remarks after the judging window closes.

## **3.3 Hackathon Hosts**

- As a prospective host, I can submit a Hackathon application via a public form (Hackathon type, name, dates, description, expected participants, prizes, problem statement/RFS, sponsor tracks, contact info).

- As an approved host, I receive a Hackathon workspace with a custom Hackathon Page auto-populated from my form.

- As a host, I can edit my Hackathon Page at any time: banner, timeline, rules, prizes, sponsor logos, judges, and FAQs.

- As a host, I can set custom judging criteria and weights for the AI Judge for my specific Hackathon type.

- As a host, I can upload sponsor track documentation and technical cheatsheets for the Tech Buddy Agent.

- As a host, I can invite judges by email and assign them to specific submission tracks.

- As a host, I can view the Builder Graph — a network visualization of all registered teams and their project categories.

- As a host, I can access AI Analytics (Metric Analyst Agent) for a real-time report on registrations, submissions, and momentum scores.

- As a host, I can view AI Judge scores alongside human judge scores for each submission.

- As a host, I can export all participant and project data as CSV.

- As a host, I can enable or disable the live leaderboard for my Hackathon.

## **3.4 Judges**

- As a judge, I receive an invite link from the host to access the Hackathon's judging panel.

- As a judge, I can browse all submitted projects for my assigned Hackathon.

- As a judge, I can view each project's Loops Profile.

- ~~As a judge, I can use the AI Judge Agent to see an auto-generated evaluation with category scores and remarks.~~

- As a judge, I can use the Project Chat Agent to ask the project knowledge base questions before scoring.

- As a judge, I can use the Code Query Agent to explore a project's GitHub codebase.

- As a judge, I can enter my own score (0-100) and written remarks for each criterion.

- ~~As a judge, I can override the AI Judge score with my own score — my score takes precedence.~~

## **3.5 General Viewers**

- As a viewer, I can browse the Loops Store (all public Loops Profiles) without an account.

- As a viewer, I can filter projects by category~~, tech stack, Hackathon participated in, and date~~.

- ~~As a viewer, I can sort projects by Momentum Score, newest, and most viewed.~~

- As a viewer, I can click any project card to see its full Loops Profile.

- As a viewer, I can interact with the Project Chat AI widget on any profile (rate-limited: 10 messages/session) only once I log in.

- As a viewer, I can explore active and past Boosters without logging in.

# **4\. Hackathon Types — Detailed Specifications**

## **4.1 Idea Boosters**

Idea Boosters is executed in two stages. In Stage 1, builders submit their ideas, not necessarily working products. In Stage 2, selected ideas continue to work on the ideation in hackathon format. The host provides problem statements or a Request for Startups (RFS).

- Submission: Project name, concept description, target audience, proposed solution, optional wireframes or mockups.

- AI Judging focus: Ideation quality (30%), uniqueness (25%), problem-solution fit (25%), feasibility (20%).

- AI Agent available to builders: Project Ideator Agent (conversational ideation against the problem statement) and DevRel Agents(Tech Buddy and Mentor), Profile Creator, Social Amplifier.

- Output: Ranked list of idea submissions with AI scores \+ host/judge scores.

## **4.2 Momentum Boosters**

Momentum Boosters are built for sprints with microfunding. Builders ship a working project. GitHub activity and code quality are primary signals.

- Submission: Full Loops Profile required (GitHub URL mandatory). Working demo highly recommended.

- AI Judging focus: Code depth (25%), technical integration (25%), product readiness (20%), uniqueness (15%), track/sponsor fit (15%).

- Momentum Score actively tracked during the sprint — live leaderboard available. And funding is streamed live based on the momentum score.

- AI Agents available to builders: Project Ideator, Tech Buddy, Profile Creator, Social Amplifier.

## **4.3 Capital Boosters**

Capital Boosters are grant or funding applications. Teams apply with an existing project seeking financial support or investment.

- Submission: Loops Profile, team background, funding amount requested, use of funds, traction metrics.

- AI Judging focus: Viability (30%), impact potential (25%), team strength (20%), market opportunity (25%).

- No live leaderboard — results are private until host announces.

- AI Agents available: Profile Creator, Project Chat (for due diligence by judges).

# **5\. AI Agent Specifications**

## **5.1 Architecture Overview**

Loops House uses a layered AI agent architecture. Sub-agents are internal utilities. Builder, Host, Viewer, and DevRel agents are user-facing. All agents are stateless; state is persisted in the knowledge base database keyed by project_id or hackathon_id.

| Agent                        | Type                         | Who Triggers It                                    | Model            |
| :--------------------------- | :--------------------------- | :------------------------------------------------- | :--------------- |
| Profile Creator              | Builder Agent (Orchestrator) | Builder submits Loops Profile form                 | gemini-1.5-pro   |
| code-reader (Sub-Agent A)    | Sub-Agent                    | Profile Creator internally                         | gemini-1.5-pro   |
| demo-reader (Sub-Agent B)    | Sub-Agent                    | Profile Creator internally                         | gemini-1.5-pro   |
| theme-reader (Sub-Agent C)   | Sub-Agent                    | Profile Creator internally                         | gemini-2.0-flash |
| Project Ideator              | Builder \+ DevRel Agent      | Builder in Hackathon ideation flow                 | gemini-2.0-flash |
| Social Amplifier             | Builder Agent                | Builder on Loops Profile dashboard                 | gemini-2.0-flash |
| Tech Buddy                   | DevRel Agent                 | Builder in Hackathon support chat                  | gemini-1.5-pro   |
| Metric Analyst               | Host Agent                   | Host on Analytics dashboard                        | gemini-2.0-flash |
| Project Chat                 | Viewer \+ Judge Agent        | Viewer/Judge on Loops Profile page                 | gemini-1.5-pro   |
| AI Judge (Project Evaluator) | Judge \+ Host Agent          | Judge in judging panel / Host batch run            | gemini-1.5-pro   |
| Code Query                   | Viewer \+ Judge Agent        | Viewer/Judge on Loops Profile — reuses code-reader | gemini-1.5-pro   |

## **5.2 Profile Creator Agent (Orchestrator)**

Triggered when a builder submits the Loops Profile form. Fans out to three parallel sub-agents, then consolidates outputs into a complete project metadata object and knowledge base.

### **Sub-Agent A: code-reader**

- Clones or fetches the GitHub repo via GitHub API.

- Flattens the codebase into a single concatenated document (excluding node_modules, lock files, binaries).

- Parses package.json / requirements.txt / go.mod to extract tech stack as structured list.

- Chunks codebase into \~1500 token segments, embeds with text-embedding-004, stores in pgvector.

- Exposes a queryCode(project_id, question) interface reused by Code Query agent.

### **Sub-Agent B: demo-reader**

- Accepts a YouTube URL (builder's demo or explainer video).

- Uses Gemini's native video/audio understanding to extract transcript and key talking points with timestamps.

- If Hackathon context is provided, evaluates how well the demo addresses the problem statement.

- Outputs: summary, key features, tech mentioned verbally, problem alignment score.

### **Sub-Agent C: theme-reader**

- Accepts product visuals (images) and logo. Max 10 images, each under 5MB.

- Uses Gemini vision to extract dominant colors, accent color, and design theme label.

- Outputs: primary_color (hex), accent_color (hex), theme_label (e.g. 'dark-minimal').

### **Consolidation (Step D)**

- Combines all sub-agent outputs \+ builder form data.

- Generates via gemini-1.5-pro: tagline (max 140 chars), project category, refined description, deduplicated tech stack tags.

- Saves unified knowledge base to pgvector store keyed by project_id.

- Emits real-time SSE progress events to frontend per sub-agent completion.

Acceptance Criteria: Completes within 90 seconds. All AI fields are flagged ai_generated=true and fully editable by builder. If any sub-agent fails, continue with available data.

## **5.3 Project Ideator Agent**

Conversational agent helping builders ideate, refine, and validate a project idea against a Hackathon's problem statement. Merged from project-ideator \+ project-mentor. Acts as a thinking partner, not a code assistant.

- Input: Builder message, conversation history, Hackathon context (problem statements, RFS, sponsor tracks).

- Asks clarifying questions about builder's skills, interests, and what problem they want to solve.

- Ties every suggestion back to one or more problem statements in the Hackathon context.

- Helps think through: uniqueness, feasibility within Hackathon timeline, judge appeal, sponsor track alignment.

- Does NOT write code. Does NOT fix bugs. If asked, redirects: 'For technical questions, try Tech Buddy\!'

- Max 50 conversation turns before summarizing earlier context.

Model: gemini-2.0-flash (fast conversational responses)

## **5.4 Social Amplifier Agent**

Single-shot lightweight agent generating ready-to-post LinkedIn and Twitter/X content from a project's Loops Profile.

- Input: Project name, tagline, description, tech stack, Hackathon name, result (winner/participant/etc).

- Output: LinkedIn post (150-250 words, professional), Twitter post (under 280 chars, punchy), suggested hashtags.

- Never fabricates results — only mentions awards if explicitly passed in input.

- Output is plain text only, no markdown formatting in post content.

Model: gemini-2.0-flash. Target response time: under 5 seconds.

## **5.5 Tech Buddy Agent (DevRel)**

Strict resource-grounded Q\&A assistant. Answers technical questions ONLY from sponsor documentation and technical cheatsheets uploaded by the Hackathon host. Not a programmer, not a debugger.

- Resource bundle loaded at Hackathon init: sponsor track docs, API docs, SDK examples, technical cheatsheet.

- Embeds all docs with text-embedding-004, stores in vector store keyed by hackathon_id.

- For each user query: embeds query → retrieves top-5 chunks → passes to Gemini with strict grounding prompt.

- Similarity threshold: 0.75. Below threshold, responds: 'I don't have that in the available resources. Please check with the organizers or sponsor directly.'

- Does NOT answer general programming questions. Does NOT debug code. Does NOT use general knowledge.

- Cites source (sponsor name, document section) with every answer.

Model: gemini-1.5-pro. Max resource bundle: 200,000 tokens per Hackathon.

## **5.6 Metric Analyst Agent (Host)**

Analytics reporting agent that produces a structured, human-readable report on the current state of a Hackathon. Data-first: model only narrates and interprets data it is explicitly given.

- Fetches from DB: registrations, submissions, submission rate, avg momentum score, top categories, top tech stacks, recent activity.

- Passes structured data to Gemini: 'Produce a concise report for the host. Cover participation health, submission quality, popular stacks, and notable patterns. Under 400 words. Be factual.'

- Returns: AI narrative (300-400 words), raw metrics (for charts), 3-5 key highlights as one-liners.

- Never includes specific team names unless host has enabled this.

Model: gemini-2.0-flash.

## **5.7 Project Chat Agent (Viewer \+ Judge)**

Allows any viewer or judge to have a conversational Q\&A with a project's full knowledge base — description, features, demo insights, tech stack, and code summary. Not just GitHub — the whole profile.

- Embeds user question → retrieves top-5 chunks from project knowledge base → Gemini generates grounded answer.

- Similarity threshold: 0.70. Below threshold: 'I don't have enough information about that in this project's profile.'

- Answers only about the specific project — not general questions.

- Rate limits: 10 messages/session for unauthenticated viewers; 50/session for authenticated judges.

Model: gemini-1.5-pro.

## **5.8 AI Judge Agent (Project Evaluator)**

Evaluates a Hackathon submission against host-defined judging criteria using the project's knowledge base. Produces structured scores and written remarks per category. Designed for consistency and explainability.

- Loaded with: host's judging rubric (criteria \+ weights) \+ project's full knowledge base.

- Evaluates each criterion independently in a separate Gemini call to prevent anchoring bias.

- Default criteria (customizable by host per Hackathon type):
  - Code Integration & Technical Depth — 25%

  - Ideation & Problem Definition — 20%

  - Uniqueness & Innovation — 20%

  - Product Readiness (UX, Demo, Documentation) — 20%

  - Track/Sponsor Fit — 15%

- Output per criterion: score (0-100), justification (2-3 sentences), one strength, one improvement suggestion.

- Aggregates weighted scores into an overall score (0-100).

- Generates 1-paragraph holistic summary.

- Human judge score overrides AI score in final Momentum Score calculation.

- Logs every run: input KB size, model version, timestamp, all raw scores (for audit trail).

Model: gemini-1.5-pro. Runs in batch queue for Boosters with \>10 submissions (BullMQ).

## **5.9 Code Query Agent (Viewer \+ Judge)**

Thin wrapper over code-reader sub-agent. Allows viewers and judges to ask questions about a project's codebase directly. Not re-implemented — calls queryCode(project_id, question) from the code-reader module.

- Rate limit: 20 queries/hour for unauthenticated users; 100/hour for judges.

# **6\. Feature Specifications by Page**

## **6.1 Loops Store (Public Project Gallery)**

- Public, paginated gallery of all Loops Profiles.

- ~~Filter by: category, tech stack, Hackathon participated in, date.~~

- ~~Sort by: Momentum Score, newest, most viewed.~~

- Search: full-text across name~~, description, tech stack.~~

- Project cards: logo, name, tagline, top 3 tech tags, ~~Momentum Score badge~~, ~~view count~~.

## **6.2 Loops Profile Page (Per Project)**

- Header: logo, name, tagline, tech stack badges, category tag, ~~Momentum Score.~~

- Links: GitHub, website, additional links.

- Product Visuals: image gallery with lightbox.

- About: AI-generated \+ builder-editable description.

- Color palette swatches (from theme-reader).

- AI Project Chat widget (Project Chat Agent).

- GitHub activity chart (commits over time from GitHub API).

- Code Explorer tab (Code Query Agent).

- Hackathon badges (which Boosters the project participated in with result).

- Team Details

## **6.3 Hackathon Page (Per Event)**

- Hero: banner, Hackathon name, type badge (Idea/Momentum/Capital), dates, prize pool.

- Sections: About, Problem Statement / RFS, Timeline, Rules, Judges, Sponsors, FAQ.

- Registration CTA → opens team selection \+ project submission flow.

- Project Ideator Agent widget (for registered builders).

- Tech Buddy chat widget (for registered builders, if host has uploaded docs).

- Submission gallery (visible after submission deadline, public or private per host choice).

- Live leaderboard (optional, Momentum Score-based, host-togglable).

## **6.4 Builder Dashboard**

- My Profiles: list of Loops Profiles with edit/delete/share actions.

- My Teams: teams owned and joined, with member management.

- My Boosters: applied Boosters, application status, submitted project, score received.

- AI Processing Status: live progress bar per sub-agent during Profile Creator pipeline.

- Social Amplifier: generate post button per profile.

## **6.5 Host Dashboard**

- Hackathon overview cards (active, draft, completed).

- Per-Hackathon view: Hackathon Page editor, Builder Graph, Submissions, Judging Panel, Analytics.

- Builder Graph: network visualization of teams and project categories.

- Submissions Table: sortable by AI score, human score, Momentum Score.

- Judging Panel: AI scores visible, human score entry, remarks, judge assignment.

- AI Analytics: Metric Analyst Agent report \+ raw metric charts.

- Export: CSV of participants and projects.

## **6.6 Judge Panel**

- Hackathon Page → Projects Submitted → Project → Evaluate → Give Scores.

- Each project: Loops Profile preview \+ AI Judge score \+ human score entry fields.

- Project Chat widget (knowledge base Q\&A).

- Code Query widget (GitHub codebase chat).

- Remarks field per criterion (optional but encouraged).

# **7\. Data Models (Simplified)**

| Entity          | Key Fields                                                                                                                                                                          | Relationships                                                   |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| User            | id, email, username, oauth_provider, role, created_at                                                                                                                               | Has many Teams (owner), belongs to many Teams (member)          |
| Team            | id, name, owner_id, created_at                                                                                                                                                      | Has one owner, has many members, has many Projects              |
| LoopsProfile    | id, team_id, name, tagline, description, logo_url, website, github_url, youtube_url, tech_stack\[\], category, colors{}, knowledge_base_id, momentum_score, ai_generated_fields\[\] | Belongs to Team, has one KnowledgeBase, has many ProductVisuals |
| KnowledgeBase   | id, project_id, chunks\[\], embeddings\[\], sources{}                                                                                                                               | Belongs to LoopsProfile                                         |
| Hackathon       | id, host_id, hackathon_type (idea                                                                                                                                                   | momentum                                                        | capital), name, description, problem_statement, start_date, end_date, judging_criteria{}, status, leaderboard_enabled | Belongs to Host, has many Submissions, has many Tracks |
| BoosterTrack    | id, hackathon_id, sponsor_name, docs_text, cheatsheet_text, embeddings\[\]                                                                                                          | Belongs to Hackathon (for Tech Buddy)                           |
| Submission      | id, hackathon_id, team_id, project_id, ai_score{}, human_score{}, momentum_score, status                                                                                            | Belongs to Hackathon, Team, LoopsProfile                        |
| HostApplication | id, user_id, hackathon_type, event_name, expected_participants, contact, status, reviewed_by                                                                                        | Belongs to User                                                 |
| JudgeInvite     | id, hackathon_id, judge_user_id, assigned_tracks\[\], invited_by                                                                                                                    | Belongs to Hackathon and User                                   |

# **8\. Non-Functional Requirements**

## **8.1 Performance**

- Loops Store page load: under 2 seconds (LCP) on 4G.

- Profile Creator pipeline: completes within 90 seconds.

- Project Chat / AI Judge responses: under 5 seconds.

- ~~Momentum Score refresh: within 5 minutes of new GitHub push.~~

## **8.2 Scalability**

- Support 10,000 concurrent users during peak Hackathon hours.

- Knowledge base storage: horizontal sharding by project_id via pgvector.

- AI agent jobs queued via BullMQ to prevent overload during mass submissions.

## **8.3 Security**

- All API endpoints protected by JWT (except public Loops Store and Hackathon pages).

- GitHub tokens stored encrypted, never exposed client-side.

- Host applications require manual admin approval — no auto-elevation.

- Rate limiting: 20 Project Chat queries/hour per unauthenticated IP.

- Tech Buddy: 50 queries/hour per authenticated builder per Hackathon.

## **8.4 Accessibility**

- WCAG 2.1 AA for all public-facing pages.

- Keyboard navigable interface.

- Screen reader compatible project cards and profiles.

# **10\. Open Questions & Decisions**

- Vector database: pgvector (simpler, already in Postgres) vs. dedicated Pinecone/Weaviate?

- GitHub integration: public repo URL only (MVP) or builder OAuth for private repos?

- Momentum Score visibility: public on Loops Store cards, or visible to builders/hosts only?

- ~~Loops Profile export: should builders be able to export as PDF portfolio document?~~

- Capital Hackathon: who receives and manages actual grant disbursement — Germina Labs or the host?

- Judge accounts: should judges be a separate role signup or always invited by hosts only?
