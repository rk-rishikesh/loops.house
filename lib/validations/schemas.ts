import { z } from "zod";

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
  team_id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  github_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  youtube_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  logo_url: z.string().or(z.literal("")).optional(),
  website_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  screenshot_urls: z.string().optional(),
  social_links: z.string().optional(),
  hackathon_id: z.string().optional(),
});
export type CreateProfileSchema = z.infer<typeof createProfileSchema>;

export const socialAmplifierSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
  hackathon_id: z.string().optional(),
  hackathon_result: z.enum(["winner", "runner-up", "finalist", "participant", ""]).optional(),
  tone: z.enum(["professional", "casual", "excited"]),
});
export type SocialAmplifierSchema = z.infer<typeof socialAmplifierSchema>;

export const analyticsFilterSchema = z.object({
  hackathon_id: z.string().min(1, "Please select a hackathon"),
  report_type: z.enum(["overview", "submissions", "full"]),
});
export type AnalyticsFilterSchema = z.infer<typeof analyticsFilterSchema>;

export const judgingEvalSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
  hackathon_id: z.string().min(1, "Please select a hackathon"),
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

// --- Invitations ---

export const invitationTypeSchema = z.enum(["event_host", "cohost", "judge", "project_member"]);

export const createInvitationSchema = z
  .object({
    type: invitationTypeSchema,
    email: z.string().email("Valid email required"),
    hackathon_id: z.string().min(1).optional(),
    project_id: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "event_host") return !data.hackathon_id && !data.project_id;
      if (data.type === "cohost" || data.type === "judge") return !!data.hackathon_id && !data.project_id;
      if (data.type === "project_member") return !!data.project_id;
      return false;
    },
    { message: "Invalid invitation parameters for type" },
  );

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;

export const respondInvitationSchema = z.object({
  invitation_id: z.string().min(1),
  accept: z.boolean(),
});
export type RespondInvitationSchema = z.infer<typeof respondInvitationSchema>;

// --- Admin ---

export const adminToggleEventCreatorSchema = z.object({
  user_id: z.string().min(1),
  is_event_creator: z.boolean(),
});

export const adminToggleAdminSchema = z.object({
  user_id: z.string().min(1),
  is_admin: z.boolean(),
});
