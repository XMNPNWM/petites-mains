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
      analysis_results: {
        Row: {
          ai_data: Json
          analysis_type: string
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          is_flagged: boolean | null
          last_human_review: string | null
          low_confidence_flags: string[] | null
          updated_at: string | null
          version: string
        }
        Insert: {
          ai_data?: Json
          analysis_type: string
          confidence_score?: number | null
          content_id: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          last_human_review?: string | null
          low_confidence_flags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          ai_data?: Json
          analysis_type?: string
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          last_human_review?: string | null
          low_confidence_flags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
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
      character_relationships: {
        Row: {
          character_a_id: string | null
          character_a_name: string
          character_b_id: string | null
          character_b_name: string
          confidence_score: number | null
          created_at: string | null
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          key_interactions: Json | null
          project_id: string
          relationship_current_status: string | null
          relationship_start_chapter_id: string | null
          relationship_strength: number
          relationship_type: string
          strength_history: Json | null
          updated_at: string | null
        }
        Insert: {
          character_a_id?: string | null
          character_a_name: string
          character_b_id?: string | null
          character_b_name: string
          confidence_score?: number | null
          created_at?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          key_interactions?: Json | null
          project_id: string
          relationship_current_status?: string | null
          relationship_start_chapter_id?: string | null
          relationship_strength?: number
          relationship_type: string
          strength_history?: Json | null
          updated_at?: string | null
        }
        Update: {
          character_a_id?: string | null
          character_a_name?: string
          character_b_id?: string | null
          character_b_name?: string
          confidence_score?: number | null
          created_at?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          key_interactions?: Json | null
          project_id?: string
          relationship_current_status?: string | null
          relationship_start_chapter_id?: string | null
          relationship_strength?: number
          relationship_type?: string
          strength_history?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_relationships_character_a_id_fkey"
            columns: ["character_a_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_character_b_id_fkey"
            columns: ["character_b_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_relationship_start_chapter_id_fkey"
            columns: ["relationship_start_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
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
      conflict_tracking: {
        Row: {
          characters_involved: Json | null
          confidence_score: number | null
          conflict_description: string | null
          conflict_name: string
          conflict_type: string
          created_at: string | null
          current_intensity: number | null
          escalation_points: Json | null
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          intensity_history: Json | null
          is_flagged: boolean | null
          is_verified: boolean | null
          project_id: string
          resolution_chapter_id: string | null
          resolution_status: string | null
          start_chapter_id: string | null
          updated_at: string | null
        }
        Insert: {
          characters_involved?: Json | null
          confidence_score?: number | null
          conflict_description?: string | null
          conflict_name: string
          conflict_type: string
          created_at?: string | null
          current_intensity?: number | null
          escalation_points?: Json | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          intensity_history?: Json | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          project_id: string
          resolution_chapter_id?: string | null
          resolution_status?: string | null
          start_chapter_id?: string | null
          updated_at?: string | null
        }
        Update: {
          characters_involved?: Json | null
          confidence_score?: number | null
          conflict_description?: string | null
          conflict_name?: string
          conflict_type?: string
          created_at?: string | null
          current_intensity?: number | null
          escalation_points?: Json | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          intensity_history?: Json | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          project_id?: string
          resolution_chapter_id?: string | null
          resolution_status?: string | null
          start_chapter_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conflict_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_tracking_resolution_chapter_id_fkey"
            columns: ["resolution_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_tracking_start_chapter_id_fkey"
            columns: ["start_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      content_hashes: {
        Row: {
          change_summary: string | null
          chapter_id: string
          created_at: string | null
          enhanced_content_hash: string | null
          has_changes: boolean | null
          id: string
          last_processed_at: string | null
          original_content_hash: string
          paragraph_hashes: Json
          processing_version: string | null
          updated_at: string | null
        }
        Insert: {
          change_summary?: string | null
          chapter_id: string
          created_at?: string | null
          enhanced_content_hash?: string | null
          has_changes?: boolean | null
          id?: string
          last_processed_at?: string | null
          original_content_hash: string
          paragraph_hashes?: Json
          processing_version?: string | null
          updated_at?: string | null
        }
        Update: {
          change_summary?: string | null
          chapter_id?: string
          created_at?: string | null
          enhanced_content_hash?: string | null
          has_changes?: boolean | null
          id?: string
          last_processed_at?: string | null
          original_content_hash?: string
          paragraph_hashes?: Json
          processing_version?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_hashes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: true
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      dependency_graph: {
        Row: {
          created_at: string | null
          dependency_type: string
          dependent_content_id: string
          dependent_content_type: string
          id: string
          source_content_id: string
          source_content_type: string
          strength: number | null
        }
        Insert: {
          created_at?: string | null
          dependency_type: string
          dependent_content_id: string
          dependent_content_type: string
          id?: string
          source_content_id: string
          source_content_type: string
          strength?: number | null
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          dependent_content_id?: string
          dependent_content_type?: string
          id?: string
          source_content_id?: string
          source_content_type?: string
          strength?: number | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score: number
          created_at: string | null
          description: string | null
          details: Json | null
          evidence: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          name: string
          project_id: string
          reasoning: string | null
          review_notes: string | null
          search_vector: unknown | null
          source_chapter_id: string | null
          source_paragraph_hash: string | null
          source_text_excerpt: string | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number
          created_at?: string | null
          description?: string | null
          details?: Json | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          name: string
          project_id: string
          reasoning?: string | null
          review_notes?: string | null
          search_vector?: unknown | null
          source_chapter_id?: string | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number
          created_at?: string | null
          description?: string | null
          details?: Json | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          name?: string
          project_id?: string
          reasoning?: string | null
          review_notes?: string | null
          search_vector?: unknown | null
          source_chapter_id?: string | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_source_chapter_id_fkey"
            columns: ["source_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_change_log: {
        Row: {
          change_reason: string | null
          change_type: Database["public"]["Enums"]["change_type"]
          changed_by_user: boolean | null
          confidence_after: number | null
          confidence_before: number | null
          created_at: string | null
          field_changed: string | null
          id: string
          knowledge_base_id: string | null
          knowledge_fact_id: string | null
          new_value: string | null
          old_value: string | null
          triggered_by_chapter_id: string | null
          triggered_by_hash: string | null
          user_notes: string | null
        }
        Insert: {
          change_reason?: string | null
          change_type: Database["public"]["Enums"]["change_type"]
          changed_by_user?: boolean | null
          confidence_after?: number | null
          confidence_before?: number | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          knowledge_base_id?: string | null
          knowledge_fact_id?: string | null
          new_value?: string | null
          old_value?: string | null
          triggered_by_chapter_id?: string | null
          triggered_by_hash?: string | null
          user_notes?: string | null
        }
        Update: {
          change_reason?: string | null
          change_type?: Database["public"]["Enums"]["change_type"]
          changed_by_user?: boolean | null
          confidence_after?: number | null
          confidence_before?: number | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          knowledge_base_id?: string | null
          knowledge_fact_id?: string | null
          new_value?: string | null
          old_value?: string | null
          triggered_by_chapter_id?: string | null
          triggered_by_hash?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_change_log_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_change_log_knowledge_fact_id_fkey"
            columns: ["knowledge_fact_id"]
            isOneToOne: false
            referencedRelation: "knowledge_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_change_log_triggered_by_chapter_id_fkey"
            columns: ["triggered_by_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_facts: {
        Row: {
          confidence_score: number
          created_at: string | null
          evidence: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          fact_key: string
          fact_type: string | null
          fact_value: string
          id: string
          knowledge_base_id: string
          reasoning: string | null
          source_paragraph_hash: string | null
          source_text_excerpt: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          fact_key: string
          fact_type?: string | null
          fact_value: string
          id?: string
          knowledge_base_id: string
          reasoning?: string | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          fact_key?: string
          fact_type?: string | null
          fact_value?: string
          id?: string
          knowledge_base_id?: string
          reasoning?: string | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_facts_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_processing_jobs: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          completed_steps: number | null
          created_at: string | null
          current_step: string | null
          error_details: Json | null
          error_message: string | null
          estimated_duration_minutes: number | null
          id: string
          job_type: string
          processing_options: Json | null
          progress_percentage: number | null
          project_id: string
          results_summary: Json | null
          started_at: string | null
          state: Database["public"]["Enums"]["processing_state"] | null
          total_steps: number | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_type?: string
          processing_options?: Json | null
          progress_percentage?: number | null
          project_id: string
          results_summary?: Json | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["processing_state"] | null
          total_steps?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_type?: string
          processing_options?: Json | null
          progress_percentage?: number | null
          project_id?: string
          results_summary?: Json | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["processing_state"] | null
          total_steps?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_processing_jobs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_processing_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_threads: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          end_chapter_id: string | null
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          key_events: Json | null
          project_id: string
          resolution_status: string | null
          start_chapter_id: string | null
          thread_name: string
          thread_status: string | null
          thread_type: string
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          end_chapter_id?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          key_events?: Json | null
          project_id: string
          resolution_status?: string | null
          start_chapter_id?: string | null
          thread_name: string
          thread_status?: string | null
          thread_type: string
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          end_chapter_id?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          key_events?: Json | null
          project_id?: string
          resolution_status?: string | null
          start_chapter_id?: string | null
          thread_name?: string
          thread_status?: string | null
          thread_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plot_threads_end_chapter_id_fkey"
            columns: ["end_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_threads_start_chapter_id_fkey"
            columns: ["start_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
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
      semantic_chunks: {
        Row: {
          breakpoint_reasons: Json | null
          breakpoint_score: number
          chapter_id: string
          chunk_index: number
          content: string
          created_at: string | null
          dialogue_present: boolean | null
          dialogue_speakers: Json | null
          discourse_markers: Json | null
          embeddings: string | null
          embeddings_model: string | null
          end_position: number
          entity_types: Json | null
          id: string
          named_entities: Json | null
          overlap_with_next: boolean | null
          overlap_with_previous: boolean | null
          processed_at: string | null
          processing_version: string | null
          project_id: string
          start_position: number
          updated_at: string | null
        }
        Insert: {
          breakpoint_reasons?: Json | null
          breakpoint_score: number
          chapter_id: string
          chunk_index: number
          content: string
          created_at?: string | null
          dialogue_present?: boolean | null
          dialogue_speakers?: Json | null
          discourse_markers?: Json | null
          embeddings?: string | null
          embeddings_model?: string | null
          end_position: number
          entity_types?: Json | null
          id?: string
          named_entities?: Json | null
          overlap_with_next?: boolean | null
          overlap_with_previous?: boolean | null
          processed_at?: string | null
          processing_version?: string | null
          project_id: string
          start_position: number
          updated_at?: string | null
        }
        Update: {
          breakpoint_reasons?: Json | null
          breakpoint_score?: number
          chapter_id?: string
          chunk_index?: number
          content?: string
          created_at?: string | null
          dialogue_present?: boolean | null
          dialogue_speakers?: Json | null
          discourse_markers?: Json | null
          embeddings?: string | null
          embeddings_model?: string | null
          end_position?: number
          entity_types?: Json | null
          id?: string
          named_entities?: Json | null
          overlap_with_next?: boolean | null
          overlap_with_previous?: boolean | null
          processed_at?: string | null
          processing_version?: string | null
          project_id?: string
          start_position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "semantic_chunks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semantic_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      timeline_events: {
        Row: {
          chapter_id: string | null
          characters_involved: Json | null
          chronological_order: number
          confidence_score: number | null
          created_at: string | null
          duration_description: string | null
          event_date_in_story: string | null
          event_description: string | null
          event_importance: string | null
          event_name: string
          event_type: string
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_verified: boolean | null
          locations_involved: Json | null
          plot_threads_affected: Json | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          characters_involved?: Json | null
          chronological_order: number
          confidence_score?: number | null
          created_at?: string | null
          duration_description?: string | null
          event_date_in_story?: string | null
          event_description?: string | null
          event_importance?: string | null
          event_name: string
          event_type: string
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          locations_involved?: Json | null
          plot_threads_affected?: Json | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          characters_involved?: Json | null
          chronological_order?: number
          confidence_score?: number | null
          created_at?: string | null
          duration_description?: string | null
          event_date_in_story?: string | null
          event_description?: string | null
          event_importance?: string | null
          event_name?: string
          event_type?: string
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_verified?: boolean | null
          locations_involved?: Json | null
          plot_threads_affected?: Json | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      user_overrides: {
        Row: {
          analysis_result_id: string | null
          created_at: string | null
          field_path: string
          id: string
          original_ai_value: Json | null
          override_reason: string | null
          updated_at: string | null
          user_value: Json
        }
        Insert: {
          analysis_result_id?: string | null
          created_at?: string | null
          field_path: string
          id?: string
          original_ai_value?: Json | null
          override_reason?: string | null
          updated_at?: string | null
          user_value: Json
        }
        Update: {
          analysis_result_id?: string | null
          created_at?: string | null
          field_path?: string
          id?: string
          original_ai_value?: Json | null
          override_reason?: string | null
          updated_at?: string | null
          user_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_overrides_analysis_result_id_fkey"
            columns: ["analysis_result_id"]
            isOneToOne: false
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
        ]
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_cross_chapter_consistency: {
        Args: { p_project_id: string }
        Returns: {
          inconsistencies_found: number
          characters_checked: number
          relationships_checked: number
          plot_threads_checked: number
        }[]
      }
      extract_knowledge_from_chunks: {
        Args: { p_project_id: string; p_chapter_id?: string }
        Returns: {
          chunks_processed: number
          knowledge_extracted: number
          processing_time: unknown
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_semantic_chunks: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_project_id?: string
        }
        Returns: {
          id: string
          content: string
          similarity: number
          chunk_index: number
          chapter_id: string
          project_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_knowledge_confidence_scores: {
        Args: { p_project_id: string }
        Returns: {
          knowledge_updated: number
          avg_confidence_before: number
          avg_confidence_after: number
        }[]
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      change_type:
        | "addition"
        | "modification"
        | "deletion"
        | "confidence_update"
      extraction_method:
        | "llm_direct"
        | "llm_inferred"
        | "user_input"
        | "user_correction"
      knowledge_category:
        | "character"
        | "plot_point"
        | "world_building"
        | "theme"
        | "setting"
        | "object"
        | "event"
        | "relationship"
        | "other"
      processing_state:
        | "pending"
        | "thinking"
        | "analyzing"
        | "extracting"
        | "done"
        | "failed"
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
    Enums: {
      change_type: [
        "addition",
        "modification",
        "deletion",
        "confidence_update",
      ],
      extraction_method: [
        "llm_direct",
        "llm_inferred",
        "user_input",
        "user_correction",
      ],
      knowledge_category: [
        "character",
        "plot_point",
        "world_building",
        "theme",
        "setting",
        "object",
        "event",
        "relationship",
        "other",
      ],
      processing_state: [
        "pending",
        "thinking",
        "analyzing",
        "extracting",
        "done",
        "failed",
      ],
    },
  },
} as const
