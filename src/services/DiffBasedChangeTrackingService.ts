import * as DiffMatchPatch from 'diff-match-patch';
import { DiffChangeRecord, DiffOperation, DiffSegment } from '@/types/diffTracking';

/**
 * Service for accurate character-level change tracking using Myers' diff algorithm
 * Replaces the primitive word-based diffing with proper sequence alignment
 */
export class DiffBasedChangeTrackingService {
  private static dmp = new DiffMatchPatch.diff_match_patch();

  /**
   * Generate accurate character-level changes between original and enhanced content
   * Returns change records compatible with AIChange interface
   */
  static getChanges(originalContent: string, enhancedContent: string): any[] {
    console.log('🔍 Starting character-level diff analysis...');
    console.log(`Original length: ${originalContent.length}, Enhanced length: ${enhancedContent.length}`);

    // Generate character-level diff using Myers' algorithm
    const rawDiffs = this.dmp.diff_main(originalContent, enhancedContent);
    this.dmp.diff_cleanupSemantic(rawDiffs); // Optimize for human readability
    
    console.log(`Generated ${rawDiffs.length} raw diff operations`);

    // Convert raw diffs to position-aware segments
    const diffSegments = this.processDiffOperations(rawDiffs);
    console.log(`Processed into ${diffSegments.length} diff segments`);

    // Convert segments to change records with enhanced classification
    const changeRecords = this.convertSegmentsToChangeRecords(diffSegments);
    console.log(`Created ${changeRecords.length} change records`);

    return changeRecords;
  }

  /**
   * Convert raw diff operations to position-aware segments
   */
  private static processDiffOperations(diffs: [number, string][]): DiffSegment[] {
    const segments: DiffSegment[] = [];
    let originalPos = 0;
    let enhancedPos = 0;
    let pendingDelete: DiffSegment | null = null;

    for (const [operation, text] of diffs) {
      const opType = this.getOperationType(operation);
      
      if (opType === 'EQUAL') {
        // Handle any pending delete before processing equal
        if (pendingDelete) {
          segments.push(pendingDelete);
          pendingDelete = null;
        }

        // Skip empty equal operations
        if (text.length > 0) {
          originalPos += text.length;
          enhancedPos += text.length;
        }
      } 
      else if (opType === 'DELETE') {
        // Store delete operation, might be part of a replace
        pendingDelete = {
          operation: 'DELETE',
          originalText: text,
          enhancedText: '',
          originalStart: originalPos,
          originalEnd: originalPos + text.length,
          enhancedStart: enhancedPos,
          enhancedEnd: enhancedPos
        };
        originalPos += text.length;
      } 
      else if (opType === 'INSERT') {
        if (pendingDelete) {
          // Combine DELETE + INSERT into REPLACE
          segments.push({
            operation: 'REPLACE',
            originalText: pendingDelete.originalText,
            enhancedText: text,
            originalStart: pendingDelete.originalStart,
            originalEnd: pendingDelete.originalEnd,
            enhancedStart: pendingDelete.enhancedStart,
            enhancedEnd: enhancedPos + text.length
          });
          pendingDelete = null;
        } else {
          // Pure insertion
          segments.push({
            operation: 'INSERT',
            originalText: '',
            enhancedText: text,
            originalStart: originalPos,
            originalEnd: originalPos,
            enhancedStart: enhancedPos,
            enhancedEnd: enhancedPos + text.length
          });
        }
        enhancedPos += text.length;
      }
    }

    // Handle any remaining pending delete
    if (pendingDelete) {
      segments.push(pendingDelete);
    }

    return segments.filter(segment => 
      segment.operation !== 'EQUAL' && 
      (segment.originalText.length > 0 || segment.enhancedText.length > 0)
    );
  }

  /**
   * Convert operation number to type string
   */
  private static getOperationType(operation: number): 'EQUAL' | 'INSERT' | 'DELETE' {
    switch (operation) {
      case 0: return 'EQUAL';
      case 1: return 'INSERT';  
      case -1: return 'DELETE';
      default: return 'EQUAL';
    }
  }

  /**
   * Convert diff segments to change records compatible with AIChange interface
   */
  private static convertSegmentsToChangeRecords(segments: DiffSegment[]): any[] {
    return segments.map((segment, index) => ({
      id: `temp_${Date.now()}_${index}`, // Temporary ID for edge function use
      change_type: this.classifyChangeType(segment),
      original_text: segment.originalText,
      enhanced_text: segment.enhancedText,
      position_start: segment.originalStart, // For backward compatibility with current schema
      position_end: segment.originalEnd,
      original_position_start: segment.originalStart,
      original_position_end: segment.originalEnd,
      enhanced_position_start: segment.enhancedStart,
      enhanced_position_end: segment.enhancedEnd,
      confidence_score: this.calculateConfidenceScore(segment),
      user_decision: 'pending' as const,
      semantic_impact: this.assessSemanticImpact(segment)
    }));
  }

  /**
   * Enhanced change type classification for character-level changes
   */
  private static classifyChangeType(segment: DiffSegment): string {
    const { operation, originalText, enhancedText } = segment;

    // Handle pure insertions and deletions
    if (operation === 'INSERT') return 'insertion';
    if (operation === 'DELETE') return 'deletion';

    // Character-level replacements
    if (operation === 'REPLACE') {
      // Single character changes
      if (originalText.length === 1 && enhancedText.length === 1) {
        if (originalText.toLowerCase() === enhancedText.toLowerCase()) {
          return 'capitalization';
        }
        if (/[.!?,:;]/.test(originalText) || /[.!?,:;]/.test(enhancedText)) {
          return 'punctuation_correction';
        }
      }

      // Whitespace changes
      if (originalText.trim() === enhancedText.trim() && originalText !== enhancedText) {
        return 'whitespace_adjustment';
      }

      // Word boundary changes - likely grammar
      if (originalText.length <= 10 && enhancedText.length <= 10) {
        return 'grammar';
      }

      // Sentence-level changes - likely style  
      if (originalText.length > 50 || enhancedText.length > 50) {
        return 'style';
      }

      // Dialogue detection
      if ((originalText.includes('"') || enhancedText.includes('"')) ||
          (originalText.includes("'") || enhancedText.includes("'"))) {
        return 'dialogue';
      }

      // Medium-length changes - likely structure
      return 'structure';
    }

    return 'grammar'; // fallback
  }

  /**
   * Calculate confidence score based on change characteristics
   */
  private static calculateConfidenceScore(segment: DiffSegment): number {
    const { operation, originalText, enhancedText } = segment;

    // High confidence for simple operations
    if (operation === 'INSERT' || operation === 'DELETE') {
      return 0.9;
    }

    // Very high confidence for obvious corrections
    if (originalText.length === 1 && enhancedText.length === 1) {
      return 0.95;
    }

    // Lower confidence for larger changes
    const totalLength = originalText.length + enhancedText.length;
    if (totalLength > 100) {
      return 0.6;
    } else if (totalLength > 50) {
      return 0.75;
    } else {
      return 0.85;
    }
  }

  /**
   * Assess semantic impact of the change
   */
  private static assessSemanticImpact(segment: DiffSegment): 'low' | 'medium' | 'high' {
    const { originalText, enhancedText } = segment;
    const totalLength = originalText.length + enhancedText.length;

    // Low impact for punctuation, capitalization, whitespace
    if (totalLength <= 3) {
      return 'low';
    }

    // High impact for large changes
    if (totalLength > 50) {
      return 'high';
    }

    // Medium impact for word-level changes
    return 'medium';
  }
}