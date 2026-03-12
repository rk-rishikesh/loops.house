export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      hackathon_cohosts: {
        Row: {
          created_at: string
          hackathon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_cohosts_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_cohosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_judges: {
        Row: {
          assigned_tracks: string[] | null
          created_at: string
          hackathon_id: string
          user_id: string
        }
        Insert: {
          assigned_tracks?: string[] | null
          created_at?: string
          hackathon_id: string
          user_id: string
        }
        Update: {
          assigned_tracks?: string[] | null
          created_at?: string
          hackathon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_judges_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_judges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_results: {
        Row: {
          ai_score_weighted: number
          created_at: string | null
          final_score: number
          hackathon_id: string
          id: string
          judge_score_weighted: number
          project_id: string
          rank: number
          raw_ai_score: number | null
          raw_judge_avg_score: number | null
          submission_id: string
        }
        Insert: {
          ai_score_weighted?: number
          created_at?: string | null
          final_score?: number
          hackathon_id: string
          id?: string
          judge_score_weighted?: number
          project_id: string
          rank: number
          raw_ai_score?: number | null
          raw_judge_avg_score?: number | null
          submission_id: string
        }
        Update: {
          ai_score_weighted?: number
          created_at?: string | null
          final_score?: number
          hackathon_id?: string
          id?: string
          judge_score_weighted?: number
          project_id?: string
          rank?: number
          raw_ai_score?: number | null
          raw_judge_avg_score?: number | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_results_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "loops_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_results_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_speakers: {
        Row: {
          created_at: string | null
          hackathon_id: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          hackathon_id: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          hackathon_id?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_speakers_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_track_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string
          hackathon_id: string
          id: string
          source: string
          track_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding: string
          hackathon_id: string
          id?: string
          source: string
          track_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string
          hackathon_id?: string
          id?: string
          source?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_track_chunks_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_track_chunks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "hackathon_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_tracks: {
        Row: {
          api_endpoints: string[] | null
          cheatsheet_text: string | null
          created_at: string
          docs_text: string | null
          hackathon_id: string
          id: string
          sdk_examples: string[] | null
          sponsor_name: string
          track_description: string | null
          track_name: string | null
        }
        Insert: {
          api_endpoints?: string[] | null
          cheatsheet_text?: string | null
          created_at?: string
          docs_text?: string | null
          hackathon_id: string
          id?: string
          sdk_examples?: string[] | null
          sponsor_name: string
          track_description?: string | null
          track_name?: string | null
        }
        Update: {
          api_endpoints?: string[] | null
          cheatsheet_text?: string | null
          created_at?: string
          docs_text?: string | null
          hackathon_id?: string
          id?: string
          sdk_examples?: string[] | null
          sponsor_name?: string
          track_description?: string | null
          track_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_tracks_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathons: {
        Row: {
          ai_weight: number | null
          bounty_pool_summary: string | null
          created_at: string
          description: string | null
          finalized_at: string | null
          host_id: string
          id: string
          is_exclusive: boolean
          judging_criteria: Json | null
          judging_deadline: string | null
          leaderboard_enabled: boolean | null
          name: string
          organizer_notes: string | null
          problem_statements: string[] | null
          program_goal: string | null
          results_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["hackathon_status"]
          submission_deadline: string | null
          technical_docs: string | null
          technical_resources: Json | null
          theme: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          ai_weight?: number | null
          bounty_pool_summary?: string | null
          created_at?: string
          description?: string | null
          finalized_at?: string | null
          host_id: string
          id?: string
          is_exclusive?: boolean
          judging_criteria?: Json | null
          judging_deadline?: string | null
          leaderboard_enabled?: boolean | null
          name: string
          organizer_notes?: string | null
          problem_statements?: string[] | null
          program_goal?: string | null
          results_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["hackathon_status"]
          submission_deadline?: string | null
          technical_docs?: string | null
          technical_resources?: Json | null
          theme?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          ai_weight?: number | null
          bounty_pool_summary?: string | null
          created_at?: string
          description?: string | null
          finalized_at?: string | null
          host_id?: string
          id?: string
          is_exclusive?: boolean
          judging_criteria?: Json | null
          judging_deadline?: string | null
          leaderboard_enabled?: boolean | null
          name?: string
          organizer_notes?: string | null
          problem_statements?: string[] | null
          program_goal?: string | null
          results_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["hackathon_status"]
          submission_deadline?: string | null
          technical_docs?: string | null
          technical_resources?: Json | null
          theme?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathons_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      human_evaluations: {
        Row: {
          created_at: string
          hackathon_id: string
          id: string
          judge_id: string
          overall_notes: string | null
          overall_score: number
          remarks: Json
          scores: Json
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          id?: string
          judge_id: string
          overall_notes?: string | null
          overall_score?: number
          remarks?: Json
          scores?: Json
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          id?: string
          judge_id?: string
          overall_notes?: string | null
          overall_score?: number
          remarks?: Json
          scores?: Json
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_evaluations_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_evaluations_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          hackathon_id: string | null
          id: string
          invited_by: string
          project_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Insert: {
          created_at?: string
          email: string
          hackathon_id?: string | null
          id?: string
          invited_by: string
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Update: {
          created_at?: string
          email?: string
          hackathon_id?: string | null
          id?: string
          invited_by?: string
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          type?: Database["public"]["Enums"]["invitation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "loops_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string
          id: string
          kb_id: string
          metadata: Json | null
          project_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding: string
          id?: string
          kb_id: string
          metadata?: Json | null
          project_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          kb_id?: string
          metadata?: Json | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_chunks_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "loops_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          id: string
          project_id: string
          sources: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          sources?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          sources?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "loops_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loops_profiles: {
        Row: {
          additional_links: Json | null
          ai_generated_fields: string[] | null
          category: string | null
          colors: Json | null
          created_at: string
          description: string | null
          flattened_codebase: string | null
          github_url: string | null
          id: string
          kb_sections: string[] | null
          key_features: string[] | null
          knowledge_base_chunks: number | null
          knowledge_base_id: string | null
          logo_url: string | null
          momentum_score: number | null
          name: string
          refined_description: string | null
          screenshot_urls: string[] | null
          social_links: Json | null
          tagline: string | null
          team_id: string
          tech_stack: string[] | null
          updated_at: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          additional_links?: Json | null
          ai_generated_fields?: string[] | null
          category?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          flattened_codebase?: string | null
          github_url?: string | null
          id?: string
          kb_sections?: string[] | null
          key_features?: string[] | null
          knowledge_base_chunks?: number | null
          knowledge_base_id?: string | null
          logo_url?: string | null
          momentum_score?: number | null
          name: string
          refined_description?: string | null
          screenshot_urls?: string[] | null
          social_links?: Json | null
          tagline?: string | null
          team_id: string
          tech_stack?: string[] | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          additional_links?: Json | null
          ai_generated_fields?: string[] | null
          category?: string | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          flattened_codebase?: string | null
          github_url?: string | null
          id?: string
          kb_sections?: string[] | null
          key_features?: string[] | null
          knowledge_base_chunks?: number | null
          knowledge_base_id?: string | null
          logo_url?: string | null
          momentum_score?: number | null
          name?: string
          refined_description?: string | null
          screenshot_urls?: string[] | null
          social_links?: Json | null
          tagline?: string | null
          team_id?: string
          tech_stack?: string[] | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_knowledge_base"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loops_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          reset_at: string
          updated_at: string
        }
        Insert: {
          count?: number
          key: string
          reset_at: string
          updated_at?: string
        }
        Update: {
          count?: number
          key?: string
          reset_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          ai_evaluated_at: string | null
          ai_score: Json | null
          created_at: string
          hackathon_id: string
          id: string
          momentum_score: number | null
          project_id: string
          status: Database["public"]["Enums"]["submission_status"]
          team_id: string
          updated_at: string
        }
        Insert: {
          ai_evaluated_at?: string | null
          ai_score?: Json | null
          created_at?: string
          hackathon_id: string
          id?: string
          momentum_score?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          team_id: string
          updated_at?: string
        }
        Update: {
          ai_evaluated_at?: string | null
          ai_score?: Json | null
          created_at?: string
          hackathon_id?: string
          id?: string
          momentum_score?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "loops_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          is_event_creator: boolean
          oauth_provider: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          is_event_creator?: boolean
          oauth_provider?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          is_event_creator?: boolean
          oauth_provider?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_max_requests: number; p_window_ms?: number }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      match_hackathon_chunks: {
        Args: {
          match_count?: number
          match_hackathon_id: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source: string
        }[]
      }
      match_kb_chunks: {
        Args: {
          match_count?: number
          match_project_id: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      hackathon_status:
        | "draft"
        | "active"
        | "judging"
        | "completed"
        | "archived"
      invitation_status: "pending" | "accepted" | "rejected"
      invitation_type: "event_host" | "cohost" | "judge" | "project_member"
      submission_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "scored"
        | "withdrawn"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      hackathon_status: ["draft", "active", "judging", "completed", "archived"],
      invitation_status: ["pending", "accepted", "rejected"],
      invitation_type: ["event_host", "cohost", "judge", "project_member"],
      submission_status: [
        "draft",
        "submitted",
        "under_review",
        "scored",
        "withdrawn",
      ],
    },
  },
} as const
