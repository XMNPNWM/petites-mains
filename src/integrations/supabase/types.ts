export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_change_tracking: {
        Row: {
          change_type: string
          confidence_score: number | null
          created_at: string | null
          enhanced_text: string
          id: string
          original_text: string
          position_end: number
          position_start: number
          refinement_id: string
          user_decision: string | null
        }
        Insert: {
          change_type: string
          confidence_score?: number | null
          created_at?: string | null
          enhanced_text: string
          id?: string
          original_text: string
          position_end: number
          position_start: number
          refinement_id: string
          user_decision?: string | null
        }
        Update: {
          change_type?: string
          confidence_score?: number | null
          created_at?: string | null
          enhanced_text?: string
          id?: string
          original_text?: string
          position_end?: number
          position_start?: number
          refinement_id?: string
          user_decision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_change_tracking_refinement_id_fkey"
            columns: ["refinement_id"]
            isOneToOne: false
            referencedRelation: "chapter_refinements"
            referencedColumns: ["id"]
          },
        ]
      }
      author_styles: {
        Row: {
          author: string
          created_at: string | null
          id: string
          percentage: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          author: string
          created_at?: string | null
          id?: string
          percentage: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          created_at?: string | null
          id?: string
          percentage?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "author_styles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_metrics: {
        Row: {
          computed_at: string | null
          consistency_score: number | null
          dialogue_ratio: number | null
          id: string
          pacing_score: number | null
          readability_score: number | null
          refinement_id: string
          sentence_variety: number | null
          word_count: number | null
        }
        Insert: {
          computed_at?: string | null
          consistency_score?: number | null
          dialogue_ratio?: number | null
          id?: string
          pacing_score?: number | null
          readability_score?: number | null
          refinement_id: string
          sentence_variety?: number | null
          word_count?: number | null
        }
        Update: {
          computed_at?: string | null
          consistency_score?: number | null
          dialogue_ratio?: number | null
          id?: string
          pacing_score?: number | null
          readability_score?: number | null
          refinement_id?: string
          sentence_variety?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_metrics_refinement_id_fkey"
            columns: ["refinement_id"]
            isOneToOne: true
            referencedRelation: "chapter_refinements"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_refinements: {
        Row: {
          ai_changes: Json | null
          chapter_id: string
          context_summary: string | null
          created_at: string | null
          enhanced_content: string | null
          id: string
          original_content: string | null
          refinement_status: string
          updated_at: string | null
          user_preferences: Json | null
        }
        Insert: {
          ai_changes?: Json | null
          chapter_id: string
          context_summary?: string | null
          created_at?: string | null
          enhanced_content?: string | null
          id?: string
          original_content?: string | null
          refinement_status?: string
          updated_at?: string | null
          user_preferences?: Json | null
        }
        Update: {
          ai_changes?: Json | null
          chapter_id?: string
          context_summary?: string | null
          created_at?: string | null
          enhanced_content?: string | null
          id?: string
          original_content?: string | null
          refinement_status?: string
          updated_at?: string | null
          user_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_refinements_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: true
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          order_index: number
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          order_index: number
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          created_at: string | null
          description: string | null
          goals: string | null
          id: string
          name: string
          project_id: string
          role: string | null
          traits: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          goals?: string | null
          id?: string
          name: string
          project_id: string
          role?: string | null
          traits?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          goals?: string | null
          id?: string
          name?: string
          project_id?: string
          role?: string | null
          traits?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chapter_id: string | null
          chat_type: string
          created_at: string
          id: string
          is_minimized: boolean
          line_number: number | null
          messages: Json
          position: Json
          project_id: string
          selected_text: string | null
          status: string | null
          text_position: number | null
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          chat_type: string
          created_at?: string
          id?: string
          is_minimized?: boolean
          line_number?: number | null
          messages?: Json
          position: Json
          project_id: string
          selected_text?: string | null
          status?: string | null
          text_position?: number | null
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          chat_type?: string
          created_at?: string
          id?: string
          is_minimized?: boolean
          line_number?: number | null
          messages?: Json
          position?: Json
          project_id?: string
          selected_text?: string | null
          status?: string | null
          text_position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          last_active_chapter_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_active_chapter_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_active_chapter_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_last_active_chapter"
            columns: ["last_active_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      storyline_connections: {
        Row: {
          created_at: string | null
          id: string
          label: string | null
          project_id: string
          source_id: string
          target_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id: string
          source_id: string
          target_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id?: string
          source_id?: string
          target_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyline_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyline_connections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "storyline_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyline_connections_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "storyline_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      storyline_nodes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          layer: number
          node_type: string
          position: Json | null
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          layer: number
          node_type: string
          position?: Json | null
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          layer?: number
          node_type?: string
          position?: Json | null
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyline_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_credits_limit: number
          ai_credits_used: number
          created_at: string
          current_projects: number
          id: string
          total_word_count: number
          updated_at: string
          user_id: string | null
          worldbuilding_elements_count: number
        }
        Insert: {
          ai_credits_limit?: number
          ai_credits_used?: number
          created_at?: string
          current_projects?: number
          id?: string
          total_word_count?: number
          updated_at?: string
          user_id?: string | null
          worldbuilding_elements_count?: number
        }
        Update: {
          ai_credits_limit?: number
          ai_credits_used?: number
          created_at?: string
          current_projects?: number
          id?: string
          total_word_count?: number
          updated_at?: string
          user_id?: string | null
          worldbuilding_elements_count?: number
        }
        Relationships: []
      }
      worldbuilding_elements: {
        Row: {
          created_at: string | null
          created_from_storyline: boolean | null
          description: string | null
          details: Json | null
          id: string
          name: string
          project_id: string
          storyline_node_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_from_storyline?: boolean | null
          description?: string | null
          details?: Json | null
          id?: string
          name: string
          project_id: string
          storyline_node_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_from_storyline?: boolean | null
          description?: string | null
          details?: Json | null
          id?: string
          name?: string
          project_id?: string
          storyline_node_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worldbuilding_elements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worldbuilding_elements_storyline_node_id_fkey"
            columns: ["storyline_node_id"]
            isOneToOne: false
            referencedRelation: "storyline_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
