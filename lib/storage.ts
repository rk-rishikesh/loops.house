export interface StoredProject {
  project_id: string;
  team_id?: string;
  name: string;
  tagline?: string;
  category?: string;
  refined_description?: string;
  tech_stack_tags?: string[];
  primary_color?: string;
  accent_color?: string;
  theme_label?: string;
  key_features?: string[];
  logo_url?: string;
  website_url?: string;
  github_url?: string;
  youtube_url?: string;
  screenshot_urls?: string[];
  additional_links?: { label: string; url: string }[];
  social_links?: { label: string; url: string }[];
  created_at: string;
  knowledge_base_chunks?: number;
  kb_sections?: string[];
  flattened_codebase?: string;
  /** Id of the booster (idea/momentum/capital) this project was submitted to */
  booster_id?: string;
  [key: string]: unknown;
}

export type BoosterType = "idea" | "momentum" | "capital";

export interface StoredBooster {
  id: string;
  name: string;
  problem_statements: string[];
  theme?: string;
  booster_type?: BoosterType;
  /** Public website or landing page for this booster/program */
  website_url?: string;
  /** Structured technical resources (link + description) */
  technical_resources?: { url: string; description: string }[];
  /** Links or notes for technical docs (Notion, Google Docs, API pages, etc.) */
  technical_docs?: string;
  /** Description of bounty pool, rewards, and incentives */
  bounty_pool_summary?: string;
  /** High-level goal for this booster/program */
  program_goal?: string;
  /** Timeline and key dates: launch, checkpoints, submissions, judging, etc. */
  timeline?: string;
  /** Freeform organizer notes / scratchpad for the program */
  organizer_notes?: string;
  created_at: string;
}

export interface StoredTeam {
  id: string;
  name: string;
  created_at: string;
}

const PROJECTS_KEY = "loops_projects";
const BOOSTERS_KEY = "loops_boosters";
const TEAMS_KEY = "loops_teams";

/** Legacy key; migrated once to BOOSTERS_KEY */
const LEGACY_BOOSTERS_KEY = "loops_hackathons";

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or disabled
  }
}

function migrateLegacyBoosters(): StoredBooster[] {
  const legacy = safeParse<StoredBooster[]>(LEGACY_BOOSTERS_KEY, []);
  if (legacy.length === 0) return [];
  safeSet(BOOSTERS_KEY, legacy);
  localStorage.removeItem(LEGACY_BOOSTERS_KEY);
  return legacy;
}

export function getProjects(): StoredProject[] {
  const raw = safeParse<StoredProject[]>(PROJECTS_KEY, []);
  return raw.map((p) => {
    if (p.booster_id != null) return p;
    const legacy = (p as { hackathon_id?: string }).hackathon_id;
    if (legacy != null) {
      const { hackathon_id: _, ...rest } = p as StoredProject & { hackathon_id?: string };
      return { ...rest, booster_id: legacy };
    }
    return p;
  });
}

export function saveProject(project: StoredProject): void {
  const list = getProjects();
  const idx = list.findIndex((p) => p.project_id === project.project_id);
  const next = { ...project, created_at: project.created_at || new Date().toISOString() };
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  safeSet(PROJECTS_KEY, list);
}

export function getProject(projectId: string): StoredProject | null {
  return getProjects().find((p) => p.project_id === projectId) ?? null;
}

export function removeProject(projectId: string): void {
  safeSet(PROJECTS_KEY, getProjects().filter((p) => p.project_id !== projectId));
}

export function getBoosters(): StoredBooster[] {
  const list = safeParse<StoredBooster[]>(BOOSTERS_KEY, []);
  if (list.length > 0) return list;
  return migrateLegacyBoosters();
}

export function saveBooster(booster: StoredBooster): void {
  const list = getBoosters();
  const idx = list.findIndex((b) => b.id === booster.id);
  const next = { ...booster, created_at: booster.created_at || new Date().toISOString() };
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  safeSet(BOOSTERS_KEY, list);
}

export function getBooster(id: string): StoredBooster | null {
  return getBoosters().find((b) => b.id === id) ?? null;
}

export function getTeams(): StoredTeam[] {
  return safeParse<StoredTeam[]>(TEAMS_KEY, []);
}

export function saveTeam(team: StoredTeam): void {
  const list = getTeams();
  const idx = list.findIndex((t) => t.id === team.id);
  const next = { ...team, created_at: team.created_at || new Date().toISOString() };
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  safeSet(TEAMS_KEY, list);
}

export function getTeam(id: string): StoredTeam | null {
  return getTeams().find((t) => t.id === id) ?? null;
}
