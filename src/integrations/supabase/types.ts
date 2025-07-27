export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_change_tracking: {
        Row: {
          change_type: string
          confidence_score: number | null
          created_at: string | null
          created_at_enhanced: string | null
          enhanced_position_end: number
          enhanced_position_start: number
          enhanced_text: string
          id: string
          original_position_end: number
          original_position_start: number
          original_text: string
          processing_batch_id: string | null
          refinement_id: string
          semantic_impact: string | null
          semantic_similarity: number | null
          user_decision: string | null
        }
        Insert: {
          change_type: string
          confidence_score?: number | null
          created_at?: string | null
          created_at_enhanced?: string | null
          enhanced_position_end: number
          enhanced_position_start: number
          enhanced_text: string
          id?: string
          original_position_end: number
          original_position_start: number
          original_text: string
          processing_batch_id?: string | null
          refinement_id: string
          semantic_impact?: string | null
          semantic_similarity?: number | null
          user_decision?: string | null
        }
        Update: {
          change_type?: string
          confidence_score?: number | null
          created_at?: string | null
          created_at_enhanced?: string | null
          enhanced_position_end?: number
          enhanced_position_start?: number
          enhanced_text?: string
          id?: string
          original_position_end?: number
          original_position_start?: number
          original_text?: string
          processing_batch_id?: string | null
          refinement_id?: string
          semantic_impact?: string | null
          semantic_similarity?: number | null
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
          {
            foreignKeyName: "fk_ai_change_tracking_refinement"
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
          creation_import_version: number | null
          current_batch_id: string | null
          enhanced_content: string | null
          id: string
          last_creation_sync_at: string | null
          last_enhancement_at: string | null
          original_content: string | null
          original_content_version: number | null
          refinement_status: string
          updated_at: string | null
          user_preferences: Json | null
        }
        Insert: {
          ai_changes?: Json | null
          chapter_id: string
          context_summary?: string | null
          created_at?: string | null
          creation_import_version?: number | null
          current_batch_id?: string | null
          enhanced_content?: string | null
          id?: string
          last_creation_sync_at?: string | null
          last_enhancement_at?: string | null
          original_content?: string | null
          original_content_version?: number | null
          refinement_status?: string
          updated_at?: string | null
          user_preferences?: Json | null
        }
        Update: {
          ai_changes?: Json | null
          chapter_id?: string
          context_summary?: string | null
          created_at?: string | null
          creation_import_version?: number | null
          current_batch_id?: string | null
          enhanced_content?: string | null
          id?: string
          last_creation_sync_at?: string | null
          last_enhancement_at?: string | null
          original_content?: string | null
          original_content_version?: number | null
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
      chapter_summaries: {
        Row: {
          ai_confidence: number | null
          chapter_id: string
          chronological_confidence: number | null
          chronological_order: number | null
          created_at: string | null
          dependency_elements: Json | null
          edit_timestamp: string | null
          id: string
          is_newly_extracted: boolean | null
          key_events_in_chapter: Json | null
          narrative_sequence_id: string | null
          original_ai_value: Json | null
          primary_focus: Json | null
          project_id: string
          source_chapter_id: string | null
          summary_long: string | null
          summary_short: string | null
          temporal_markers: Json | null
          title: string | null
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence?: number | null
          chapter_id: string
          chronological_confidence?: number | null
          chronological_order?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          id?: string
          is_newly_extracted?: boolean | null
          key_events_in_chapter?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          primary_focus?: Json | null
          project_id: string
          source_chapter_id?: string | null
          summary_long?: string | null
          summary_short?: string | null
          temporal_markers?: Json | null
          title?: string | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence?: number | null
          chapter_id?: string
          chronological_confidence?: number | null
          chronological_order?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          id?: string
          is_newly_extracted?: boolean | null
          key_events_in_chapter?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          primary_focus?: Json | null
          project_id?: string
          source_chapter_id?: string | null
          summary_long?: string | null
          summary_short?: string | null
          temporal_markers?: Json | null
          title?: string | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          content: string | null
          content_version_number: number
          created_at: string | null
          enhancement_source_refinement_id: string | null
          id: string
          last_enhancement_import_at: string | null
          order_index: number
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          content?: string | null
          content_version_number?: number
          created_at?: string | null
          enhancement_source_refinement_id?: string | null
          id?: string
          last_enhancement_import_at?: string | null
          order_index: number
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          content?: string | null
          content_version_number?: number
          created_at?: string | null
          enhancement_source_refinement_id?: string | null
          id?: string
          last_enhancement_import_at?: string | null
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
          {
            foreignKeyName: "fk_chapters_enhancement_source"
            columns: ["enhancement_source_refinement_id"]
            isOneToOne: false
            referencedRelation: "chapter_refinements"
            referencedColumns: ["id"]
          },
        ]
      }
      character_relationships: {
        Row: {
          ai_confidence_new: number | null
          character_a_id: string | null
          character_a_name: string
          character_b_id: string | null
          character_b_name: string
          chronological_confidence: number | null
          chronological_order: number | null
          confidence_score: number | null
          created_at: string | null
          dependency_elements: Json | null
          edit_timestamp: string | null
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_newly_extracted: boolean | null
          is_verified: boolean | null
          key_interactions: Json | null
          narrative_sequence_id: string | null
          original_ai_value: Json | null
          project_id: string
          relationship_current_status: string | null
          relationship_start_chapter_id: string | null
          relationship_strength: number
          relationship_type: string
          source_chapter_ids: Json | null
          source_character_name: string | null
          strength_history: Json | null
          target_character_name: string | null
          temporal_markers: Json | null
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence_new?: number | null
          character_a_id?: string | null
          character_a_name: string
          character_b_id?: string | null
          character_b_name: string
          chronological_confidence?: number | null
          chronological_order?: number | null
          confidence_score?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          key_interactions?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          project_id: string
          relationship_current_status?: string | null
          relationship_start_chapter_id?: string | null
          relationship_strength?: number
          relationship_type: string
          source_chapter_ids?: Json | null
          source_character_name?: string | null
          strength_history?: Json | null
          target_character_name?: string | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence_new?: number | null
          character_a_id?: string | null
          character_a_name?: string
          character_b_id?: string | null
          character_b_name?: string
          chronological_confidence?: number | null
          chronological_order?: number | null
          confidence_score?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          key_interactions?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          project_id?: string
          relationship_current_status?: string | null
          relationship_start_chapter_id?: string | null
          relationship_strength?: number
          relationship_type?: string
          source_chapter_ids?: Json | null
          source_character_name?: string | null
          strength_history?: Json | null
          target_character_name?: string | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
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
      content_versions: {
        Row: {
          change_summary: string | null
          chapter_id: string
          content: string
          content_type: string
          created_at: string
          created_from_refinement_id: string | null
          enhancement_options: Json | null
          id: string
          refinement_status: string | null
          user_notes: string | null
          version_number: number
          word_count: number | null
        }
        Insert: {
          change_summary?: string | null
          chapter_id: string
          content: string
          content_type: string
          created_at?: string
          created_from_refinement_id?: string | null
          enhancement_options?: Json | null
          id?: string
          refinement_status?: string | null
          user_notes?: string | null
          version_number?: number
          word_count?: number | null
        }
        Update: {
          change_summary?: string | null
          chapter_id?: string
          content?: string
          content_type?: string
          created_at?: string
          created_from_refinement_id?: string | null
          enhancement_options?: Json | null
          id?: string
          refinement_status?: string | null
          user_notes?: string | null
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_content_versions_chapter_id"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_content_versions_refinement_id"
            columns: ["created_from_refinement_id"]
            isOneToOne: false
            referencedRelation: "chapter_refinements"
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
      export_configs: {
        Row: {
          config_data: Json
          created_at: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config_data?: Json
          created_at?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config_data?: Json
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      export_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          export_format: string
          export_status: string
          file_size_bytes: number | null
          id: string
          project_id: string
          selected_chapters: Json
          template_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          export_format: string
          export_status?: string
          file_size_bytes?: number | null
          id?: string
          project_id: string
          selected_chapters?: Json
          template_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          export_format?: string
          export_status?: string
          file_size_bytes?: number | null
          id?: string
          project_id?: string
          selected_chapters?: Json
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          ai_confidence_new: number | null
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score: number
          created_at: string | null
          description: string | null
          details: Json | null
          edit_timestamp: string | null
          evidence: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          id: string
          is_flagged: boolean | null
          is_newly_extracted: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          name: string
          original_ai_value: Json | null
          project_id: string
          reasoning: string | null
          relevance_score: number | null
          review_notes: string | null
          search_vector: unknown | null
          source_chapter_id: string | null
          source_chapter_ids: Json | null
          source_paragraph_hash: string | null
          source_text_excerpt: string | null
          subcategory: string | null
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence_new?: number | null
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number
          created_at?: string | null
          description?: string | null
          details?: Json | null
          edit_timestamp?: string | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          name: string
          original_ai_value?: Json | null
          project_id: string
          reasoning?: string | null
          relevance_score?: number | null
          review_notes?: string | null
          search_vector?: unknown | null
          source_chapter_id?: string | null
          source_chapter_ids?: Json | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          subcategory?: string | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence_new?: number | null
          category?: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number
          created_at?: string | null
          description?: string | null
          details?: Json | null
          edit_timestamp?: string | null
          evidence?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          name?: string
          original_ai_value?: Json | null
          project_id?: string
          reasoning?: string | null
          relevance_score?: number | null
          review_notes?: string | null
          search_vector?: unknown | null
          source_chapter_id?: string | null
          source_chapter_ids?: Json | null
          source_paragraph_hash?: string | null
          source_text_excerpt?: string | null
          subcategory?: string | null
          updated_at?: string | null
          user_edited?: boolean | null
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
      plot_points: {
        Row: {
          ai_confidence: number | null
          characters_involved_names: Json | null
          chronological_confidence: number | null
          chronological_order: number | null
          created_at: string | null
          dependency_elements: Json | null
          description: string | null
          edit_timestamp: string | null
          id: string
          is_flagged: boolean | null
          is_newly_extracted: boolean | null
          name: string
          narrative_sequence_id: string | null
          original_ai_value: Json | null
          plot_thread_name: string | null
          project_id: string
          significance: string | null
          source_chapter_ids: Json | null
          temporal_markers: Json | null
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence?: number | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          description?: string | null
          edit_timestamp?: string | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          name: string
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          plot_thread_name?: string | null
          project_id: string
          significance?: string | null
          source_chapter_ids?: Json | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence?: number | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          description?: string | null
          edit_timestamp?: string | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          name?: string
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          plot_thread_name?: string | null
          project_id?: string
          significance?: string | null
          source_chapter_ids?: Json | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Relationships: []
      }
      plot_threads: {
        Row: {
          ai_confidence_new: number | null
          characters_involved_names: Json | null
          chronological_confidence: number | null
          chronological_order: number | null
          confidence_score: number | null
          created_at: string | null
          dependency_elements: Json | null
          edit_timestamp: string | null
          end_chapter_id: string | null
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_newly_extracted: boolean | null
          is_verified: boolean | null
          key_events: Json | null
          narrative_sequence_id: string | null
          original_ai_value: Json | null
          project_id: string
          resolution_status: string | null
          source_chapter_ids: Json | null
          start_chapter_id: string | null
          temporal_markers: Json | null
          thread_name: string
          thread_status: string | null
          thread_type: string
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence_new?: number | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order?: number | null
          confidence_score?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          end_chapter_id?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          key_events?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          project_id: string
          resolution_status?: string | null
          source_chapter_ids?: Json | null
          start_chapter_id?: string | null
          temporal_markers?: Json | null
          thread_name: string
          thread_status?: string | null
          thread_type: string
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence_new?: number | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order?: number | null
          confidence_score?: number | null
          created_at?: string | null
          dependency_elements?: Json | null
          edit_timestamp?: string | null
          end_chapter_id?: string | null
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          key_events?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          project_id?: string
          resolution_status?: string | null
          source_chapter_ids?: Json | null
          start_chapter_id?: string | null
          temporal_markers?: Json | null
          thread_name?: string
          thread_status?: string | null
          thread_type?: string
          updated_at?: string | null
          user_edited?: boolean | null
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
          content_hash: string | null
          created_at: string | null
          dialogue_present: boolean | null
          dialogue_speakers: Json | null
          discourse_markers: Json | null
          embedding_status: string | null
          embeddings: string | null
          embeddings_model: string | null
          end_position: number
          entity_types: Json | null
          id: string
          last_embedded_at: string | null
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
          content_hash?: string | null
          created_at?: string | null
          dialogue_present?: boolean | null
          dialogue_speakers?: Json | null
          discourse_markers?: Json | null
          embedding_status?: string | null
          embeddings?: string | null
          embeddings_model?: string | null
          end_position: number
          entity_types?: Json | null
          id?: string
          last_embedded_at?: string | null
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
          content_hash?: string | null
          created_at?: string | null
          dialogue_present?: boolean | null
          dialogue_speakers?: Json | null
          discourse_markers?: Json | null
          embedding_status?: string | null
          embeddings?: string | null
          embeddings_model?: string | null
          end_position?: number
          entity_types?: Json | null
          id?: string
          last_embedded_at?: string | null
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
          ai_confidence_new: number | null
          chapter_id: string | null
          characters_involved: Json | null
          characters_involved_names: Json | null
          chronological_confidence: number | null
          chronological_order: number
          confidence_score: number | null
          created_at: string | null
          date_or_time_reference: string | null
          dependency_elements: Json | null
          duration_description: string | null
          edit_timestamp: string | null
          event_date_in_story: string | null
          event_description: string | null
          event_importance: string | null
          event_name: string
          event_summary: string | null
          event_type: string
          evidence: string | null
          extraction_method:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id: string
          is_flagged: boolean | null
          is_newly_extracted: boolean | null
          is_verified: boolean | null
          locations_involved: Json | null
          locations_involved_names: Json | null
          narrative_sequence_id: string | null
          original_ai_value: Json | null
          plot_threads_affected: Json | null
          plot_threads_impacted_names: Json | null
          project_id: string
          significance: string | null
          source_chapter_ids: Json | null
          temporal_markers: Json | null
          updated_at: string | null
          user_edited: boolean | null
        }
        Insert: {
          ai_confidence_new?: number | null
          chapter_id?: string | null
          characters_involved?: Json | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order: number
          confidence_score?: number | null
          created_at?: string | null
          date_or_time_reference?: string | null
          dependency_elements?: Json | null
          duration_description?: string | null
          edit_timestamp?: string | null
          event_date_in_story?: string | null
          event_description?: string | null
          event_importance?: string | null
          event_name: string
          event_summary?: string | null
          event_type: string
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          locations_involved?: Json | null
          locations_involved_names?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          plot_threads_affected?: Json | null
          plot_threads_impacted_names?: Json | null
          project_id: string
          significance?: string | null
          source_chapter_ids?: Json | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
        }
        Update: {
          ai_confidence_new?: number | null
          chapter_id?: string | null
          characters_involved?: Json | null
          characters_involved_names?: Json | null
          chronological_confidence?: number | null
          chronological_order?: number
          confidence_score?: number | null
          created_at?: string | null
          date_or_time_reference?: string | null
          dependency_elements?: Json | null
          duration_description?: string | null
          edit_timestamp?: string | null
          event_date_in_story?: string | null
          event_description?: string | null
          event_importance?: string | null
          event_name?: string
          event_summary?: string | null
          event_type?: string
          evidence?: string | null
          extraction_method?:
            | Database["public"]["Enums"]["extraction_method"]
            | null
          id?: string
          is_flagged?: boolean | null
          is_newly_extracted?: boolean | null
          is_verified?: boolean | null
          locations_involved?: Json | null
          locations_involved_names?: Json | null
          narrative_sequence_id?: string | null
          original_ai_value?: Json | null
          plot_threads_affected?: Json | null
          plot_threads_impacted_names?: Json | null
          project_id?: string
          significance?: string | null
          source_chapter_ids?: Json | null
          temporal_markers?: Json | null
          updated_at?: string | null
          user_edited?: boolean | null
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
      assign_chronological_order: {
        Args: { p_project_id: string }
        Returns: {
          elements_processed: number
          sequences_created: number
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_relevance_score: {
        Args: {
          category_param: Database["public"]["Enums"]["knowledge_category"]
          description_param: string
          details_param: Json
        }
        Returns: number
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
      check_semantic_similarity: {
        Args: {
          p_project_id: string
          p_table_name: string
          p_comparison_data: Json
          p_similarity_threshold?: number
        }
        Returns: {
          has_similar: boolean
          similar_id: string
          similarity_score: number
          suggested_action: string
        }[]
      }
      check_user_setup_status: {
        Args: { user_uuid: string }
        Returns: {
          has_profile: boolean
          has_subscriber: boolean
          has_usage_tracking: boolean
          ai_credits_limit: number
          setup_complete: boolean
        }[]
      }
      conservative_deduplication: {
        Args: { p_project_id: string }
        Returns: {
          relationships_removed: number
          plot_threads_removed: number
          timeline_events_removed: number
          plot_points_removed: number
          chapter_summaries_removed: number
          world_building_removed: number
          themes_removed: number
          semantic_merges_performed: number
        }[]
      }
      deduct_ai_credits: {
        Args: { user_uuid: string; credits_to_deduct: number }
        Returns: {
          success: boolean
          remaining_credits: number
          error_message: string
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
      get_user_ai_credits: {
        Args: { user_uuid: string }
        Returns: {
          credits_used: number
          credits_limit: number
          credits_remaining: number
          subscription_tier: string
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
      match_semantic_chunks_enhanced: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_project_id?: string
          exclude_chapter_id?: string
        }
        Returns: {
          id: string
          content: string
          similarity: number
          chunk_index: number
          chapter_id: string
          project_id: string
          content_hash: string
        }[]
      }
      recalculate_all_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_ai_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
