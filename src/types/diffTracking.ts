import { AIChange } from './shared';

/**
 * Enhanced change tracking data structure for character-level diffing
 * Supports dual position tracking (original and enhanced text coordinates)
 */
export interface DiffChangeRecord extends AIChange {
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style' | 'insertion' | 'deletion' | 'replacement' | 'capitalization' | 'punctuation_correction' | 'whitespace_adjustment';
  original_text_snippet: string;   // Text from original version that was affected/removed
  enhanced_text_snippet: string;   // Text from enhanced version that was added/changed
  original_position_start: number; // Start index in ORIGINAL chapter content
  original_position_end: number;   // End index in ORIGINAL chapter content
  enhanced_position_start: number; // Start index in ENHANCED chapter content
  enhanced_position_end: number;   // End index in ENHANCED chapter content
  confidence_score: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  semantic_similarity?: number;
  semantic_impact?: 'low' | 'medium' | 'high';
}

/**
 * Raw diff operation from diff-match-patch library
 */
export interface DiffOperation {
  operation: 'EQUAL' | 'INSERT' | 'DELETE';
  text: string;
}

/**
 * Processed diff segment with position information
 */
export interface DiffSegment {
  operation: 'EQUAL' | 'INSERT' | 'DELETE' | 'REPLACE';
  originalText: string;
  enhancedText: string;
  originalStart: number;
  originalEnd: number;
  enhancedStart: number;
  enhancedEnd: number;
}

/**
 * Dual panel navigation context
 */
export interface DualPanelContext {
  originalPanelRef?: React.RefObject<HTMLElement>;
  enhancedPanelRef?: React.RefObject<HTMLElement>;
  onHighlightChange?: (change: AIChange, panelType: 'original' | 'enhanced') => void;
}