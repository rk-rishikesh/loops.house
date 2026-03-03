import { z } from "zod";

export const boosterTypeSchema = z.enum(["idea", "momentum", "capital"]);
export const appRoleSchema = z.enum(["builder", "host", "viewer", "admin", "judge"]);

// --- Client-side form schemas ---

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});
export type CreateTeamSchema = z.infer<typeof createTeamSchema>;

export const createProfileSchema = z.object({
  team_id: z.string().min(1, "Please select a team"),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  github_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  youtube_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  logo_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  website_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  screenshot_urls: z.string().optional(),
  social_links: z.string().optional(),
  booster_id: z.string().optional(),
});
export type CreateProfileSchema = z.infer<typeof createProfileSchema>;

export const socialAmplifierSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
  booster_id: z.string().optional(),
  booster_result: z.enum(["winner", "runner-up", "finalist", "participant", ""]).optional(),
  tone: z.enum(["professional", "casual", "excited"]),
});
export type SocialAmplifierSchema = z.infer<typeof socialAmplifierSchema>;

export const analyticsFilterSchema = z.object({
  booster_id: z.string().min(1, "Please select a booster"),
  report_type: z.enum(["overview", "submissions", "full"]),
});
export type AnalyticsFilterSchema = z.infer<typeof analyticsFilterSchema>;

export const judgingEvalSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
  booster_id: z.string().min(1, "Please select a booster"),
  mode: z.enum(["preview", "official"]),
});
export type JudgingEvalSchema = z.infer<typeof judgingEvalSchema>;

export const codeQuerySchema = z.object({
  question: z.string().min(1, "Question is required"),
});
export type CodeQuerySchema = z.infer<typeof codeQuerySchema>;

export const chatInputSchema = z.object({
  message: z.string().min(1),
});
export type ChatInputSchema = z.infer<typeof chatInputSchema>;

export const submitProjectSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
});
export type SubmitProjectSchema = z.infer<typeof submitProjectSchema>;

export const ideateInputSchema = z.object({
  message: z.string().min(1),
});
export type IdeateInputSchema = z.infer<typeof ideateInputSchema>;

// Judge invites
export const judgeInviteCreateSchema = z.object({
  booster_id: z.string().min(1, "Booster ID is required"),
  judge_email: z.string().email(),
  assigned_tracks: z.array(z.string()).optional(),
});

export const judgeInviteAcceptSchema = z.object({
  id: z.string().min(1, "Invite ID is required"),
});

// Host applications
export const hostApplicationCreateSchema = z.object({
  booster_type: boosterTypeSchema,
  event_name: z.string().min(1).max(200),
  expected_participants: z.number().int().positive().optional(),
  contact: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
});

export const hostApplicationReviewSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
  status: z.enum(["approved", "rejected"]),
});

// Admin
export const adminRoleUpdateSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: appRoleSchema,
});
