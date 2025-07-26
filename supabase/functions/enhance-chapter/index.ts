import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import DiffMatchPatch from "https://esm.sh/diff-match-patch@1.0.5"
import { getCorsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Professional Publishing Standards (integrated from NovelEnhancementService)
const NOVEL_STANDARDS = {
  punctuation: {
    dialogue: {
      quotationMarks: 'double',
      punctuationInside: true,
      emDashForInterruption: true,
      ellipsesForTrailing: true
    },
    general: {
      oxfordComma: true,
      emDashSpacing: false,
      ellipsesSpacing: false
    }
  },
  dialogue: {
    formatting: {
      newParagraphPerSpeaker: true,
      indentDialogue: true,
      spacingBetweenParagraphs: 1
    },
    punctuation: {
      commaBeforeDialogueTag: true,
      periodWhenNoTag: true,
      actionBeatsSeparate: true
    },
    style: {
      maxDialogueLength: 200,
      showDontTell: true,
      characterVoiceConsistency: true
    }
  },
  formatting: {
    typography: {
      font: 'Times New Roman',
      fontSize: 11,
      lineSpacing: 1.5,
      justification: 'justified'
    },
    paragraphs: {
      indentation: 0.5,
      spacing: 0,
      orphanWidowControl: true
    },
    chapters: {
      startOnNewPage: true,
      titleFormatting: 'Chapter {number}',
      numbering: 'numeric'
    }
  },
  readability: {
    fleschKincaid: {
      targetGradeLevel: 7,
      maxGradeLevel: 12,
      minReadingEase: 60
    },
    sentenceStructure: {
      averageLength: 18,
      maxLength: 25,
      complexSentenceRatio: 0.25
    },
    vocabulary: {
      averageWordLength: 4.5,
      passiveVoiceRatio: 0.05,
      uncommonWordRatio: 0.10
    }
  },
  style: {
    showVsTell: {
      actionToDescriptionRatio: 0.7,
      sensoryDetails: true,
      emotionalShow: true
    },
    pacing: {
      dialogueRatio: 0.5,
      actionRatio: 0.35,
      descriptionRatio: 0.15
    },
    characterization: {
      consistentVoice: true,
      distinctiveDialogue: true,
      believableActions: true
    }
  }
};

interface EnhancementOptions {
  enhancementLevel: 'light' | 'moderate' | 'comprehensive';
  preserveAuthorVoice: boolean;
  applyGrammarFixes: boolean;
  applyPunctuationFixes: boolean;
  applyFormattingFixes: boolean;
  improveReadability: boolean;
  improveStyle: boolean;
  improveShowVsTell?: boolean;
  refinePacing?: boolean;
  enhanceCharacterVoice?: boolean;
  addSensoryDetails?: boolean;
}

interface QualityMetrics {
  fleschKincaid: number;
  readingEase: number;
  avgSentenceLength: number;
  avgWordLength: number;
  passiveVoice: number;
  dialogueRatio: number;
  complexSentenceRatio: number;
  uncommonWordRatio: number;
  showVsTellRatio: number;
  characterConsistency: number;
}

/**
 * Generate embedding using the existing generate-embedding function
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text, model: 'text-embedding-004' }
    });

    if (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }

    if (!data || !data.embedding) {
      throw new Error('Invalid embedding response format');
    }

    return data.embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
function calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Accurate character-level change tracking using Myers' diff algorithm
 * Replaces primitive word-based diffing for precise position tracking
 */
class DiffBasedChangeTrackingService {
  private static dmp = new DiffMatchPatch();

  /**
   * Generate accurate character-level changes between original and enhanced content
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
  private static processDiffOperations(diffs: [number, string][]): any[] {
    const segments: any[] = [];
    let originalPos = 0;
    let enhancedPos = 0;
    let pendingDelete: any = null;

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
  private static getOperationType(operation: number): string {
    switch (operation) {
      case 0: return 'EQUAL';
      case 1: return 'INSERT';  
      case -1: return 'DELETE';
      default: return 'EQUAL';
    }
  }

  /**
   * Convert diff segments to change records with semantic classification
   */
  private static convertSegmentsToChangeRecords(segments: any[]): any[] {
    return segments.map(segment => ({
      change_type: this.classifyChangeType(segment),
      original_text: segment.originalText,
      enhanced_text: segment.enhancedText,
      original_position_start: segment.originalStart,
      original_position_end: segment.originalEnd,
      enhanced_position_start: segment.enhancedStart,
      enhanced_position_end: segment.enhancedEnd,
      confidence_score: this.calculateConfidenceScore(segment),
      user_decision: 'pending',
      semantic_impact: this.assessSemanticImpact(segment)
    }));
  }

  /**
   * Enhanced change type classification for character-level changes
   */
  private static classifyChangeType(segment: any): string {
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
  private static calculateConfidenceScore(segment: any): number {
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
  private static assessSemanticImpact(segment: any): string {
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

/**
 * Accurate character-level change tracking using Myers' diff algorithm
 */
async function generateChangeTrackingData(originalContent: string, enhancedContent: string): Promise<any[]> {
  try {
    console.log('🔍 Starting character-level diff-based change tracking...');
    
    // Use new character-level diff service
    const changes = DiffBasedChangeTrackingService.getChanges(originalContent, enhancedContent);
    
    if (changes.length === 0) {
      console.log('✅ No changes detected - content is identical');
      return [];
    }
    
    console.log(`📊 Generated ${changes.length} character-level changes via Myers' diff`);
    
    // Apply semantic enhancement to all change operations
    const enhancedChanges = await enhanceChangesWithSemantics(changes, originalContent, enhancedContent);
    
    // Apply improved filtering
    const finalChanges = smartFilterChangesEnhanced(enhancedChanges);
    
    console.log(`✅ Character-level change tracking complete: ${finalChanges.length} meaningful changes detected`);
    return finalChanges;
    
  } catch (error) {
    console.error('❌ Error in character-level change tracking:', error);
    return generateFallbackChangeTracking(originalContent, enhancedContent);
  }
}


/**
 * Enhanced text similarity calculation using multiple algorithms
 */
function calculateEnhancedTextSimilarity(text1: string, text2: string): number {
  // Jaccard similarity on words
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  const jaccardSimilarity = union.size === 0 ? 1 : intersection.size / union.size;
  
  // Levenshtein-based similarity for character-level changes
  const maxLength = Math.max(text1.length, text2.length);
  const levenshteinDistance = calculateLevenshteinDistance(text1, text2);
  const levenshteinSimilarity = maxLength === 0 ? 1 : 1 - (levenshteinDistance / maxLength);
  
  // Combined similarity (weighted average)
  return (jaccardSimilarity * 0.6 + levenshteinSimilarity * 0.4);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Enhanced change type detection with better linguistic patterns
 */
function determineChangeTypeEnhanced(original: string, enhanced: string): string {
  const originalWords = original.split(/\s+/).filter(w => w.length > 0);
  const enhancedWords = enhanced.split(/\s+/).filter(w => w.length > 0);

  // Enhanced dialogue detection
  const dialoguePatterns = [/["«»""'']/g, /—.*?[.!?]/, /\.{3}/g];
  const originalHasDialogue = dialoguePatterns.some(pattern => pattern.test(original));
  const enhancedHasDialogue = dialoguePatterns.some(pattern => pattern.test(enhanced));
  
  if (originalHasDialogue || enhancedHasDialogue) {
    return 'dialogue';
  }

  // Enhanced punctuation detection
  const punctuationPattern = /[.!?,:;()[\]{}"«»""''-]/g;
  const originalPunctuation = (original.match(punctuationPattern) || []).join('');
  const enhancedPunctuation = (enhanced.match(punctuationPattern) || []).join('');
  
  if (originalPunctuation !== enhancedPunctuation) {
    // Check if it's primarily punctuation vs mixed changes
    const punctuationOnlyChange = originalWords.join(' ').toLowerCase() === enhancedWords.join(' ').toLowerCase();
    if (punctuationOnlyChange) {
      return 'punctuation';
    }
  }

  // Enhanced grammar detection
  const normalizedOriginal = original.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedEnhanced = enhanced.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (normalizedOriginal === normalizedEnhanced) {
    return 'grammar';
  }

  // Enhanced structure detection
  const wordDifference = Math.abs(originalWords.length - enhancedWords.length);
  const relativeDifference = wordDifference / Math.max(originalWords.length, 1);
  
  if (relativeDifference > 0.25) {
    return 'structure';
  }

  // Check for grammar patterns (verb tense, articles, etc.)
  const grammarPatterns = [
    /\b(was|were|is|are|am|be|been|being)\b/gi,
    /\b(a|an|the)\b/gi,
    /\b(he|she|it|they|we|you|I)\b/gi
  ];
  
  let grammarChanges = 0;
  for (const pattern of grammarPatterns) {
    const originalMatches = (original.match(pattern) || []).length;
    const enhancedMatches = (enhanced.match(pattern) || []).length;
    if (originalMatches !== enhancedMatches) grammarChanges++;
  }
  
  if (grammarChanges > 0 && relativeDifference < 0.15) {
    return 'grammar';
  }

  return 'style';
}

/**
 * Validate change position accuracy
 */
function validateChangePosition(content: string, changeText: string, position: number): boolean {
  try {
    const extractedText = content.substring(position, position + changeText.length);
    return extractedText === changeText || 
           extractedText.trim() === changeText.trim() ||
           calculateEnhancedTextSimilarity(extractedText, changeText) > 0.8;
  } catch (error) {
    console.warn('Position validation error:', error);
    return false;
  }
}

/**
 * Phase 2: Enhance changes with semantic analysis
 */
async function enhanceChangesWithSemantics(changes: any[], originalContent: string, enhancedContent: string): Promise<any[]> {
  try {
    console.log('🧠 Phase 2: Starting semantic enhancement...');
    
    // Only process semantically significant changes (avoid overloading API)
    const significantChanges = changes.filter(change => 
      change.original_text.length > 5 || change.enhanced_text.length > 5
    );
    
    console.log(`📊 Processing ${significantChanges.length} significant changes for semantic analysis`);
    
    const enhancedChanges: any[] = [];
    
    for (const change of significantChanges) {
      try {
        // Generate embeddings for semantic comparison
        const [originalEmbedding, enhancedEmbedding] = await Promise.all([
          generateEmbedding(change.original_text),
          generateEmbedding(change.enhanced_text)
        ]);
        
        // Calculate semantic similarity
        const semanticSimilarity = calculateCosineSimilarity(originalEmbedding, enhancedEmbedding);
        
        // Assess semantic impact
        const semanticImpact = assessSemanticImpact(semanticSimilarity);
        
        // Multi-factor confidence scoring (40% diff + 30% semantic + 30% relevance)
        const diffWeight = 0.4;
        const semanticWeight = 0.3;
        const relevanceWeight = 0.3;
        
        const relevanceScore = calculateChangeRelevance(change);
        const enhancedConfidence = (
          (change.diff_confidence || 0.5) * diffWeight +
          (1 - semanticSimilarity) * semanticWeight +
          relevanceScore * relevanceWeight
        );
        
        // Refine change type using semantic analysis
        const refinedChangeType = refineChangeType(change.change_type, semanticSimilarity);
        
        enhancedChanges.push({
          ...change,
          change_type: refinedChangeType,
          confidence_score: enhancedConfidence,
          semantic_impact: semanticImpact,
          semantic_similarity: semanticSimilarity
        });
        
        console.log(`🔍 Semantic analysis: ${change.change_type} → ${refinedChangeType} (similarity: ${semanticSimilarity.toFixed(3)}, impact: ${semanticImpact})`);
        
        // Rate limiting to avoid API overload
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn(`⚠️ Semantic analysis failed for change:`, error);
        enhancedChanges.push(change); // Keep original change
      }
    }
    
    // Add back trivial changes without semantic analysis
    const trivialChanges = changes.filter(change => 
      change.original_text.length <= 5 && change.enhanced_text.length <= 5
    );
    
    const finalChanges = [...enhancedChanges, ...trivialChanges];
    console.log(`✅ Phase 2 complete: ${finalChanges.length} changes enhanced with semantic analysis`);
    
    return finalChanges;
    
  } catch (error) {
    console.error('❌ Error in semantic enhancement:', error);
    return changes; // Return original changes if semantic analysis fails
  }
}

/**
 * Enhanced smart filtering with improved relevance scoring
 */
function smartFilterChangesEnhanced(changes: any[]): any[] {
  console.log('🎯 Starting enhanced smart filtering...');
  
  const filtered = changes.filter(change => {
    // Calculate enhanced relevance score
    const relevanceScore = calculateEnhancedRelevanceScore(change);
    
    // Always include high-impact semantic changes
    if (change.semantic_impact === 'high') {
      console.log(`✅ Including high semantic impact change: ${change.change_type}`);
      return true;
    }
    
    // Always include grammar and punctuation fixes
    if (change.change_type === 'grammar' || change.change_type === 'punctuation') {
      console.log(`✅ Including ${change.change_type} fix`);
      return true;
    }
    
    // Include medium semantic impact with decent confidence (lowered threshold)
    if (change.semantic_impact === 'medium' && change.confidence_score > 0.4) {
      return true;
    }
    
    // Include changes with decent confidence and relevance (lowered thresholds)
    if (change.confidence_score > 0.5 && relevanceScore > 0.25) {
      return true;
    }
    
    // Include meaningful structural changes (lowered threshold)
    if (change.change_type === 'structure' && change.confidence_score > 0.3) {
      return true;
    }
    
    // Include longer changes (likely meaningful)
    if (change.original_text.length > 25 || change.enhanced_text.length > 25) {
      return true;
    }
    
    // Include dialogue changes (often important for character voice)
    if (change.change_type === 'dialogue' && change.confidence_score > 0.4) {
      return true;
    }
    
    console.log(`❌ Filtering out low-relevance change: ${change.change_type} (confidence: ${change.confidence_score.toFixed(2)}, relevance: ${relevanceScore.toFixed(2)})`);
    return false;
  });
  
  console.log(`🎯 Enhanced filtering complete: ${filtered.length}/${changes.length} changes kept`);
  
  // Safety net: if we filtered out everything but have changes, keep some high-confidence ones
  if (filtered.length === 0 && changes.length > 0) {
    console.log('🚨 All changes filtered out - applying safety net');
    const safekeepChanges = changes
      .filter(change => change.confidence_score > 0.3)
      .slice(0, Math.min(5, changes.length)); // Keep up to 5 changes
    console.log(`🛡️ Safety net kept ${safekeepChanges.length} changes`);
    return safekeepChanges;
  }
  
  return filtered;
}

/**
 * Calculate enhanced relevance score for filtering decisions
 */
function calculateEnhancedRelevanceScore(change: any): number {
  let score = 0;
  
  // Length factor (longer changes are often more relevant)
  const maxLength = Math.max(change.original_text.length, change.enhanced_text.length);
  const lengthScore = Math.min(maxLength / 50, 1); // Normalize to 0-1
  score += lengthScore * 0.3;
  
  // Change type factor
  const typeScores = {
    'grammar': 0.9,
    'punctuation': 0.8,
    'dialogue': 0.7,
    'structure': 0.6,
    'style': 0.4
  };
  score += (typeScores[change.change_type] || 0.5) * 0.3;
  
  // Confidence factor
  score += change.confidence_score * 0.2;
  
  // Similarity factor (lower similarity = more significant change)
  if (change.similarity_score !== undefined) {
    score += (1 - change.similarity_score) * 0.2;
  }
  
  return Math.min(score, 1);
}

/**
 * Calculate text similarity using Jaccard index for diff confidence
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 1 : intersection.size / union.size;
}

/**
 * Assess semantic impact based on similarity thresholds
 */
function assessSemanticImpact(similarity: number): string {
  if (similarity >= 0.95) return 'low';    // Minor changes
  if (similarity >= 0.85) return 'medium'; // Moderate changes
  return 'high';                           // Significant changes
}

/**
 * Calculate change relevance for confidence scoring
 */
function calculateChangeRelevance(change: any): number {
  const textLength = Math.max(change.original_text.length, change.enhanced_text.length);
  
  // Longer changes are generally more relevant
  const lengthScore = Math.min(textLength / 100, 1);
  
  // Grammar and punctuation fixes are always relevant
  const typeScore = change.change_type === 'grammar' || change.change_type === 'punctuation' ? 1 : 0.7;
  
  return (lengthScore + typeScore) / 2;
}

/**
 * Refine change type using semantic analysis
 */
function refineChangeType(originalType: string, semanticSimilarity: number): string {
  // High semantic similarity suggests grammar/punctuation rather than style
  if (semanticSimilarity > 0.95 && originalType === 'style') {
    return 'grammar';
  }
  
  return originalType;
}

/**
 * Fallback change tracking in case diff analysis fails
 */
function generateFallbackChangeTracking(originalContent: string, enhancedContent: string): any[] {
  const changes: any[] = [];
  
  if (originalContent !== enhancedContent) {
    changes.push({
      change_type: 'style',
      original_text: originalContent.substring(0, 100) + (originalContent.length > 100 ? '...' : ''),
      enhanced_text: enhancedContent.substring(0, 100) + (enhancedContent.length > 100 ? '...' : ''),
      position_start: 0,
      position_end: Math.min(100, originalContent.length),
      confidence_score: 0.5,
      user_decision: 'pending'
    });
  }
  
  return changes;
}

/**
 * Split text into sentences for semantic comparison
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());
  
  return sentences;
}

/**
 * Enhanced story context aggregation for novel enhancement
 */
async function aggregateEnhancementContext(projectId: string, chapterId: string): Promise<string> {
  try {
    console.log('📚 Aggregating enhancement context for chapter:', chapterId);

    const [
      projectResponse,
      chaptersResponse,
      knowledgeResponse,
      chapterSummariesResponse,
      plotThreadsResponse,
      timelineEventsResponse,
      characterRelationshipsResponse
    ] = await Promise.all([
      supabase.from('projects').select('title, description').eq('id', projectId).single(),
      supabase.from('chapters').select('id, title, order_index').eq('project_id', projectId).order('order_index'),
      supabase.from('knowledge_base').select('*').eq('project_id', projectId).order('confidence_score', { ascending: false }).limit(20),
      supabase.from('chapter_summaries').select('*').eq('project_id', projectId).order('chronological_order').limit(10),
      supabase.from('plot_threads').select('*').eq('project_id', projectId).order('confidence_score', { ascending: false }).limit(10),
      supabase.from('timeline_events').select('*').eq('project_id', projectId).order('chronological_order').limit(15),
      supabase.from('character_relationships').select('*').eq('project_id', projectId).order('confidence_score', { ascending: false }).limit(15)
    ]);

    const project = projectResponse.data;
    const chapters = chaptersResponse.data || [];
    const knowledge = knowledgeResponse.data || [];
    const chapterSummaries = chapterSummariesResponse.data || [];
    const plotThreads = plotThreadsResponse.data || [];
    const timelineEvents = timelineEventsResponse.data || [];
    const characterRelationships = characterRelationshipsResponse.data || [];

    const currentChapterIndex = chapters.findIndex(c => c.id === chapterId);
    const currentChapter = chapters[currentChapterIndex];

    const characters = knowledge.filter(item => item.category === 'character');
    const worldBuilding = knowledge.filter(item => item.category === 'world_building');
    const themes = knowledge.filter(item => item.category === 'theme');

    const contextSections: string[] = [
      `## PROJECT OVERVIEW`,
      `**Title:** ${project?.title || 'Untitled Project'}`,
      `**Description:** ${project?.description || 'No description available'}`,
      `**Current Chapter:** ${currentChapter?.title || `Chapter ${currentChapterIndex + 1}`} (${currentChapterIndex + 1} of ${chapters.length})`,
      ``
    ];

    if (characters.length > 0) {
      contextSections.push(`## CHARACTER PROFILES (for voice consistency)`);
      characters.slice(0, 8).forEach(char => {
        contextSections.push(`**${char.name}**${char.subcategory ? ` (${char.subcategory})` : ''}`);
        if (char.description) contextSections.push(`- Description: ${char.description}`);
        if (char.details && typeof char.details === 'object') {
          Object.entries(char.details).forEach(([key, value]) => {
            if (value && key !== 'description') contextSections.push(`- ${key}: ${value}`);
          });
        }
        contextSections.push('');
      });
    }

    if (characterRelationships.length > 0) {
      contextSections.push(`## KEY RELATIONSHIPS (for dialogue authenticity)`);
      characterRelationships.slice(0, 6).forEach(rel => {
        contextSections.push(`**${rel.character_a_name} ↔ ${rel.character_b_name}** (${rel.relationship_type})`);
        if (rel.evidence) contextSections.push(`- Context: ${rel.evidence}`);
        contextSections.push('');
      });
    }

    if (plotThreads.length > 0) {
      contextSections.push(`## ACTIVE PLOT THREADS (for narrative consistency)`);
      plotThreads.slice(0, 5).forEach(thread => {
        contextSections.push(`**${thread.thread_name}** (${thread.thread_type})`);
        if (thread.evidence) contextSections.push(`- Current state: ${thread.evidence}`);
        contextSections.push('');
      });
    }

    if (worldBuilding.length > 0) {
      contextSections.push(`## WORLD BUILDING (for setting consistency)`);
      worldBuilding.slice(0, 6).forEach(element => {
        contextSections.push(`**${element.name}**${element.subcategory ? ` (${element.subcategory})` : ''}`);
        if (element.description) contextSections.push(`- ${element.description}`);
        contextSections.push('');
      });
    }

    if (themes.length > 0) {
      contextSections.push(`## THEMES (for stylistic guidance)`);
      themes.forEach(theme => {
        contextSections.push(`**${theme.name}**`);
        if (theme.description) contextSections.push(`- ${theme.description}`);
        contextSections.push('');
      });
    }

    return contextSections.join('\n');

  } catch (error) {
    console.error('❌ Error aggregating enhancement context:', error);
    return `## PROJECT CONTEXT\nProject context is currently being analyzed.`;
  }
}

/**
 * Calculate comprehensive quality metrics
 */
function calculateQualityMetrics(content: string): QualityMetrics {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const characters = content.length;

  const syllables = countSyllables(content);
  const complexSentences = countComplexSentences(content);
  const passiveVoiceCount = countPassiveVoice(content);
  const dialogueRatio = calculateDialogueRatio(content);
  const uncommonWords = countUncommonWords(content);
  const showVsTellRatio = calculateShowVsTellRatio(content);

  return {
    fleschKincaid: sentences > 0 && words > 0 ? 
      0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59 : 0,
    readingEase: sentences > 0 && words > 0 ? 
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words) : 0,
    avgSentenceLength: sentences > 0 ? words / sentences : 0,
    avgWordLength: words > 0 ? characters / words : 0,
    passiveVoice: sentences > 0 ? (passiveVoiceCount / sentences) * 100 : 0,
    dialogueRatio: dialogueRatio,
    complexSentenceRatio: sentences > 0 ? (complexSentences / sentences) * 100 : 0,
    uncommonWordRatio: words > 0 ? (uncommonWords / words) * 100 : 0,
    showVsTellRatio: showVsTellRatio,
    characterConsistency: 85
  };
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let syllables = 0;
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (!cleanWord) continue;
    
    const vowelGroups = cleanWord.match(/[aeiouy]+/g) || [];
    syllables += vowelGroups.length;
    
    if (cleanWord.endsWith('e') && vowelGroups.length > 1) {
      syllables--;
    }
    
    if (vowelGroups.length === 0) syllables++;
  }
  
  return syllables;
}

function countComplexSentences(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  let complexCount = 0;
  
  const complexPatterns = [
    /,\s*which\s+/gi,
    /,\s*that\s+/gi,
    /;\s*/g,
    /:\s*/g,
    /\s+(although|because|since|while|whereas|if|unless|when|whenever|where|wherever)\s+/gi,
    /\s+(and|but|or|nor|for|so|yet)\s+/gi
  ];
  
  for (const sentence of sentences) {
    for (const pattern of complexPatterns) {
      if (pattern.test(sentence)) {
        complexCount++;
        break;
      }
    }
  }
  
  return complexCount;
}

function countPassiveVoice(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  let passiveCount = 0;
  
  const passivePattern = /\b(was|were|is|are|am|be|been|being)\s+\w*(ed|en)\b/gi;
  
  for (const sentence of sentences) {
    if (passivePattern.test(sentence)) {
      passiveCount++;
    }
  }
  
  return passiveCount;
}

function calculateDialogueRatio(content: string): number {
  const dialogueMatches = content.match(/"[^"]*"/g) || [];
  const dialogueText = dialogueMatches.join(' ');
  return content.length > 0 ? (dialogueText.length / content.length) * 100 : 0;
}

function countUncommonWords(content: string): number {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.match(/^[a-z]+$/));
  const longWords = words.filter(w => w.length > 6);
  return longWords.length;
}

function calculateShowVsTellRatio(content: string): number {
  const sensoryWords = content.match(/\b(saw|heard|felt|smelled|tasted|touched|looked|sounded|seemed|appeared)\b/gi) || [];
  const abstractWords = content.match(/\b(was|were|had|felt|thought|knew|realized|understood|believed)\b/gi) || [];
  
  const totalIndicators = sensoryWords.length + abstractWords.length;
  return totalIndicators > 0 ? (sensoryWords.length / totalIndicators) * 100 : 50;
}

/**
 * Validate and fix paragraph structure preservation
 */
function validateAndFixParagraphStructure(originalContent: string, enhancedContent: string): string {
  // Count paragraphs in original content
  const originalParagraphs = originalContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const enhancedParagraphs = enhancedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  console.log('📊 Paragraph structure validation:', {
    originalParagraphs: originalParagraphs.length,
    enhancedParagraphs: enhancedParagraphs.length,
    structurePreserved: originalParagraphs.length === enhancedParagraphs.length
  });
  
  // If paragraph count doesn't match, attempt to fix
  if (originalParagraphs.length !== enhancedParagraphs.length) {
    console.warn('⚠️ Paragraph structure mismatch detected - attempting to fix...');
    
    // If enhanced content is one big paragraph, try to restore breaks
    if (enhancedParagraphs.length === 1 && originalParagraphs.length > 1) {
      console.log('🔧 Restoring paragraph breaks from original structure...');
      
      // Use the original paragraph breaks as a guide
      let fixedContent = enhancedContent;
      
      // Find natural break points in the enhanced content that align with original breaks
      for (let i = 1; i < originalParagraphs.length; i++) {
        const originalBreakContext = originalParagraphs[i-1].slice(-20) + originalParagraphs[i].slice(0, 20);
        const cleanContext = originalBreakContext.replace(/[^\w\s]/g, '').toLowerCase();
        
        // Look for similar context in enhanced content
        const enhancedLower = fixedContent.toLowerCase();
        const contextIndex = enhancedLower.indexOf(cleanContext.slice(10, -10));
        
        if (contextIndex > 0) {
          // Insert paragraph break at this position
          const beforeBreak = fixedContent.slice(0, contextIndex);
          const afterBreak = fixedContent.slice(contextIndex);
          fixedContent = beforeBreak.trim() + '\n\n' + afterBreak.trim();
        }
      }
      
      const revalidatedParagraphs = fixedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      console.log('✅ Paragraph structure fixed:', {
        fixedParagraphs: revalidatedParagraphs.length,
        targetParagraphs: originalParagraphs.length
      });
      
      return fixedContent;
    }
    
    // If we still have issues, fall back to a more aggressive fix
    if (originalParagraphs.length > enhancedParagraphs.length) {
      console.log('🚨 Fallback: Using original paragraph structure as template...');
      
      // Split enhanced content into roughly equal parts matching original paragraph count
      const words = enhancedContent.split(/\s+/);
      const wordsPerParagraph = Math.ceil(words.length / originalParagraphs.length);
      
      const reconstructedParagraphs: string[] = [];
      for (let i = 0; i < originalParagraphs.length; i++) {
        const start = i * wordsPerParagraph;
        const end = Math.min((i + 1) * wordsPerParagraph, words.length);
        const paragraphWords = words.slice(start, end);
        if (paragraphWords.length > 0) {
          reconstructedParagraphs.push(paragraphWords.join(' '));
        }
      }
      
      return reconstructedParagraphs.join('\n\n');
    }
  }
  
  return enhancedContent;
}

/**
 * Determine the type of change based on content analysis
 */
function determineChangeType(original: string, enhanced: string): string {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const normalizedOriginal = normalize(original);
  const normalizedEnhanced = normalize(enhanced);
  
  const originalWords = original.split(/\s+/).filter(w => w.length > 0);
  const enhancedWords = enhanced.split(/\s+/).filter(w => w.length > 0);
  
  const originalHasDialogue = original.includes('"') || original.includes('«') || original.includes('—');
  const enhancedHasDialogue = enhanced.includes('"') || enhanced.includes('«') || enhanced.includes('—');
  
  if (originalHasDialogue || enhancedHasDialogue) {
    return 'dialogue';
  }
  
  if (normalizedOriginal === normalizedEnhanced) {
    return 'grammar';
  }
  
  const wordDifference = Math.abs(originalWords.length - enhancedWords.length);
  const relativeDifference = wordDifference / Math.max(originalWords.length, 1);
  
  if (relativeDifference > 0.30) {
    return 'structure';
  }
  
  const commonWords = originalWords.filter(word => enhancedWords.includes(word)).length;
  const wordSimilarity = commonWords / Math.max(originalWords.length, enhancedWords.length);
  
  if (wordSimilarity < 0.6) {
    return 'structure';
  }
  
  return 'style';
}

/**
 * Build sophisticated enhancement prompt with level-specific behavior
 */
function buildEnhancementPrompt(
  content: string,
  storyContext: string,
  currentMetrics: QualityMetrics,
  options: EnhancementOptions
): string {
  // LANGUAGE DETECTION - CRITICAL
  const frenchIndicators = (content.match(/[àâäéèêëïîôöùûüÿç]/g) || []).length;
  const frenchWords = (content.match(/\b(le|la|les|de|du|des|et|un|une|dans|pour|avec|sur|par|il|elle|ils|elles|nous|vous|que|qui|mais|ou|où|dont|être|avoir|faire|aller|voir|savoir|pouvoir|falloir|vouloir|venir|dire|prendre|donner|partir|sentir|vivre|sortir|tenir|devenir|porter|paraître|naître|mourir|passer|rester|arriver|entrer|regarder|suivre|rencontrer|trouver|rendre|aimer|croire|comprendre|mettre|parler|montrer|continuer|penser|aider|demander|tourner|essayer)\b/gi) || []).length;
  const totalWords = content.split(/\s+/).length;
  const frenchScore = (frenchIndicators * 3 + frenchWords) / totalWords;
  const detectedLanguage = frenchScore > 0.15 ? 'French' : 'English';
  
  // PARAGRAPH STRUCTURE ANALYSIS - CRITICAL
  const originalParagraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = originalParagraphs.length;
  const paragraphLengths = originalParagraphs.map(p => p.split(/\s+/).length);
  const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;

  const enhancementDirectives: string[] = [];
  const specificInstructions: string[] = [];
  const criticalSafeguards: string[] = [];

  // ABSOLUTE LANGUAGE REQUIREMENT (ALL LEVELS)
  enhancementDirectives.push("🌍 LANGUAGE REQUIREMENT - ABSOLUTELY CRITICAL:");
  enhancementDirectives.push(`- DETECTED LANGUAGE: ${detectedLanguage} (confidence: ${(frenchScore * 100).toFixed(1)}%)`);
  enhancementDirectives.push(`- OUTPUT LANGUAGE: You MUST write your enhanced version in ${detectedLanguage} ONLY`);
  enhancementDirectives.push("- NEVER translate or change the language of the content");
  enhancementDirectives.push(`- Maintain ALL linguistic patterns, idioms, and cultural expressions of ${detectedLanguage}`);
  enhancementDirectives.push("- If original is French, enhanced MUST be French. If English, enhanced MUST be English.");

  // PARAGRAPH STRUCTURE REQUIREMENT (ALL LEVELS)  
  enhancementDirectives.push("📐 PARAGRAPH STRUCTURE REQUIREMENT - CRITICAL:");
  enhancementDirectives.push(`- ORIGINAL PARAGRAPH COUNT: ${paragraphCount} paragraphs`);
  enhancementDirectives.push(`- AVERAGE PARAGRAPH LENGTH: ${avgParagraphLength.toFixed(1)} words`);
  enhancementDirectives.push("- RESPECT 80% of original paragraph breaks and line structure");
  enhancementDirectives.push("- You may reorganize up to 20% of paragraphs ONLY if absolutely necessary for flow");
  enhancementDirectives.push("- Each paragraph break in the original should generally be preserved");
  enhancementDirectives.push("- Maintain similar paragraph lengths and natural breaking points");
  enhancementDirectives.push("- Enhanced content should have approximately the same number of paragraphs");

  // LEVEL-SPECIFIC ENHANCEMENT PHILOSOPHY
  switch (options.enhancementLevel) {
    case 'light':
      enhancementDirectives.push("🔧 LIGHT ENHANCEMENT MODE - ERROR CORRECTION ONLY");
      enhancementDirectives.push("- STRICTLY limited to fundamental errors: grammar, punctuation, spelling");
      enhancementDirectives.push("- ZERO content changes - preserve every word, phrase, and sentence structure");
      enhancementDirectives.push("- NO stylistic alterations - maintain exact author voice and tone");
      enhancementDirectives.push("- NO sentence restructuring - only fix technical errors");
      break;
      
    case 'moderate':
      enhancementDirectives.push("⚖️ MODERATE ENHANCEMENT MODE - BALANCED IMPROVEMENT");
      enhancementDirectives.push("- Technical corrections PLUS subtle stylistic improvements (15-25% aggressiveness)");
      enhancementDirectives.push("- Gentle refinements while preserving original narrative style");
      enhancementDirectives.push("- Minor sentence flow improvements where beneficial");
      enhancementDirectives.push("- Selective vocabulary enhancements without changing meaning");
      break;
      
    case 'comprehensive':
      enhancementDirectives.push("✨ COMPREHENSIVE ENHANCEMENT MODE - PROFESSIONAL POLISH");
      enhancementDirectives.push("- Full professional editing with creative enhancements (40-60% aggressiveness)");
      enhancementDirectives.push("- Publication-ready polish following all professional standards");
      enhancementDirectives.push("- Advanced stylistic refinements and narrative improvements");
      enhancementDirectives.push("- Proactive enhancement suggestions while maintaining story integrity");
      break;
  }

  // CRITICAL STORY INTEGRITY SAFEGUARDS (ALL LEVELS)
  criticalSafeguards.push("🚨 ABSOLUTE STORY INTEGRITY REQUIREMENTS:");
  criticalSafeguards.push("- NEVER alter timeline of events or sequence of story beats");
  criticalSafeguards.push("- NEVER change character actions, decisions, or plot points");
  criticalSafeguards.push("- NEVER modify dialogue content that affects plot or character development");
  criticalSafeguards.push("- NEVER alter scene structure, transitions, or narrative flow");
  criticalSafeguards.push("- PRESERVE all story-critical information and narrative elements");

  // PROFESSIONAL PUBLISHING STANDARDS
  if (options.applyPunctuationFixes) {
    enhancementDirectives.push("📝 CHICAGO MANUAL OF STYLE PUNCTUATION:");
    specificInstructions.push(`  - Use ${NOVEL_STANDARDS.punctuation.dialogue.quotationMarks} quotation marks for all dialogue`);
    specificInstructions.push(`  - Place punctuation ${NOVEL_STANDARDS.punctuation.dialogue.punctuationInside ? 'inside' : 'outside'} quotation marks`);
    specificInstructions.push(`  - Apply ${NOVEL_STANDARDS.punctuation.general.oxfordComma ? 'Oxford comma' : 'no Oxford comma'} in lists`);
    specificInstructions.push(`  - Use em-dashes for interruptions: ${NOVEL_STANDARDS.punctuation.dialogue.emDashForInterruption ? 'enabled' : 'disabled'}`);
    specificInstructions.push(`  - Use ellipses for trailing speech: ${NOVEL_STANDARDS.punctuation.dialogue.ellipsesForTrailing ? 'enabled' : 'disabled'}`);
  }

  if (options.applyFormattingFixes) {
    enhancementDirectives.push("📖 PROFESSIONAL NOVEL FORMATTING:");
    specificInstructions.push(`  - ${NOVEL_STANDARDS.dialogue.formatting.newParagraphPerSpeaker ? 'Ensure' : 'Avoid'} new paragraph per speaker`);
    specificInstructions.push(`  - ${NOVEL_STANDARDS.dialogue.punctuation.commaBeforeDialogueTag ? 'Use' : 'Avoid'} comma before dialogue tags`);
    specificInstructions.push(`  - ${NOVEL_STANDARDS.dialogue.punctuation.actionBeatsSeparate ? 'Separate' : 'Combine'} action beats from dialogue`);
    specificInstructions.push(`  - Maximum dialogue length: ${NOVEL_STANDARDS.dialogue.style.maxDialogueLength} characters`);
  }

  if (options.improveReadability) {
    enhancementDirectives.push("📊 READABILITY OPTIMIZATION:");
    specificInstructions.push(`  - Target Flesch-Kincaid Grade Level: ${NOVEL_STANDARDS.readability.fleschKincaid.targetGradeLevel}-${NOVEL_STANDARDS.readability.fleschKincaid.maxGradeLevel} (current: ${currentMetrics.fleschKincaid.toFixed(1)})`);
    specificInstructions.push(`  - Achieve Reading Ease: ${NOVEL_STANDARDS.readability.fleschKincaid.minReadingEase}+ (current: ${currentMetrics.readingEase.toFixed(1)})`);
    specificInstructions.push(`  - Optimize sentence length: ${NOVEL_STANDARDS.readability.sentenceStructure.averageLength} words average (current: ${currentMetrics.avgSentenceLength.toFixed(1)})`);
    specificInstructions.push(`  - Reduce passive voice below ${(NOVEL_STANDARDS.readability.vocabulary.passiveVoiceRatio * 100).toFixed(1)}% (current: ${currentMetrics.passiveVoice.toFixed(1)}%)`);
    specificInstructions.push(`  - Complex sentence ratio max: ${(NOVEL_STANDARDS.readability.sentenceStructure.complexSentenceRatio * 100).toFixed(1)}% (current: ${currentMetrics.complexSentenceRatio.toFixed(1)}%)`);
  }

  if (options.improveStyle) {
    enhancementDirectives.push("🎨 ADVANCED STYLE ENHANCEMENT:");
    
    if (options.improveShowVsTell) {
      specificInstructions.push(`  - Achieve show vs tell ratio: ${(NOVEL_STANDARDS.style.showVsTell.actionToDescriptionRatio * 100).toFixed(1)}% showing (current: ${currentMetrics.showVsTellRatio.toFixed(1)}%)`);
      specificInstructions.push(`  - Add ${NOVEL_STANDARDS.style.showVsTell.sensoryDetails ? 'sensory details' : 'abstract descriptions'} for immersion`);
      specificInstructions.push(`  - ${NOVEL_STANDARDS.style.showVsTell.emotionalShow ? 'Show emotions through actions' : 'State emotions directly'}`);
    }
    
    if (options.refinePacing) {
      specificInstructions.push(`  - Target dialogue ratio: ${(NOVEL_STANDARDS.style.pacing.dialogueRatio * 100).toFixed(1)}% (current: ${currentMetrics.dialogueRatio.toFixed(1)}%)`);
      specificInstructions.push(`  - Balance action ratio: ${(NOVEL_STANDARDS.style.pacing.actionRatio * 100).toFixed(1)}%`);
      specificInstructions.push(`  - Description ratio: ${(NOVEL_STANDARDS.style.pacing.descriptionRatio * 100).toFixed(1)}%`);
    }
    
    if (options.enhanceCharacterVoice) {
      specificInstructions.push(`  - Ensure ${NOVEL_STANDARDS.style.characterization.consistentVoice ? 'consistent' : 'varied'} character voice`);
      specificInstructions.push(`  - Create ${NOVEL_STANDARDS.style.characterization.distinctiveDialogue ? 'distinctive' : 'uniform'} dialogue patterns`);
      specificInstructions.push(`  - Maintain ${NOVEL_STANDARDS.style.characterization.believableActions ? 'believable' : 'dramatic'} character actions`);
    }
  }

  // AUTHOR VOICE PRESERVATION
  if (options.preserveAuthorVoice) {
    criticalSafeguards.push("🎭 AUTHOR VOICE PRESERVATION:");
    criticalSafeguards.push("- Maintain the author's unique narrative style and tone");
    criticalSafeguards.push("- Preserve distinctive word choices and sentence patterns");
    criticalSafeguards.push("- Keep character personality expressions intact");
    criticalSafeguards.push("- Respect the author's creative artistic decisions");
  }

  // CRITICAL OUTPUT FORMATTING REQUIREMENTS
  const outputRequirements = [
    "🚨 CRITICAL OUTPUT FORMATTING - ABSOLUTELY MANDATORY:",
    "- PRESERVE paragraph structure EXACTLY - maintain ALL paragraph breaks from original",
    "- Each paragraph in original MUST remain a separate paragraph in enhanced version",
    "- Use ONLY simple double line breaks (\\n\\n) between paragraphs - NO HTML tags",
    "- NEVER merge multiple original paragraphs into one enhanced paragraph",
    "- NEVER add 'Page Break', 'Page BreakPage Break', or any formatting markers",
    "- NEVER add artificial separators, dividers, or section breaks",
    "- Return ONLY the enhanced text with no explanations or comments",
    "- Count: Original has X paragraphs, enhanced MUST have X paragraphs",
    "- VALIDATE: If original starts with paragraph A, enhanced must start with enhanced version of paragraph A",
    "- VALIDATE: Each original paragraph break position must be preserved in enhanced version"
  ];

  return `# PROFESSIONAL NOVEL ENHANCEMENT SYSTEM

## STORY CONTEXT
${storyContext}

## CURRENT QUALITY METRICS
- Flesch-Kincaid Grade Level: ${currentMetrics.fleschKincaid.toFixed(2)}
- Reading Ease Score: ${currentMetrics.readingEase.toFixed(2)}
- Average Sentence Length: ${currentMetrics.avgSentenceLength.toFixed(1)} words
- Passive Voice: ${currentMetrics.passiveVoice.toFixed(1)}%
- Dialogue Ratio: ${currentMetrics.dialogueRatio.toFixed(1)}%
- Complex Sentence Ratio: ${currentMetrics.complexSentenceRatio.toFixed(1)}%
- Show vs Tell Ratio: ${currentMetrics.showVsTellRatio.toFixed(1)}%

## ENHANCEMENT INSTRUCTIONS
${enhancementDirectives.join('\n')}

## PROFESSIONAL STANDARDS APPLICATION
${specificInstructions.join('\n')}

## CRITICAL SAFEGUARDS
${criticalSafeguards.join('\n')}

## OUTPUT REQUIREMENTS
${outputRequirements.join('\n')}

## ORIGINAL CONTENT TO ENHANCE:
${content}`;
}

serve(async (req) => {
  // Get the Origin header from the request
  const requestOrigin = req.headers.get('Origin');
  // Get the appropriate CORS headers for this request
  const corsHeaders = getCorsHeaders(requestOrigin);

  // DIAGNOSTIC: Log function entry immediately
  console.log('🚀 enhance-chapter edge function called at:', new Date().toISOString());
  console.log('📥 Request method:', req.method);
  console.log('📥 Request URL:', req.url);
  console.log('📥 Request origin:', requestOrigin);
  
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request for origin:', requestOrigin);
    return new Response(null, { headers: corsHeaders });
  }

  // Ensure the request origin is allowed before proceeding with the main logic
  if (requestOrigin && !ALLOWED_ORIGINS.includes(requestOrigin)) {
    console.warn('🚫 Blocked unauthorized origin:', requestOrigin);
    return new Response('Unauthorized', {
      status: 403, // Forbidden
      headers: corsHeaders, // Still return CORS headers for potential debugging
    });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract JWT token and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authorization token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { prompt, projectId, chapterId, options, content } = await req.json();

    // Check user credits before processing (2 credits for enhancement)
    const { data: creditCheck, error: creditError } = await supabase.rpc('deduct_ai_credits', {
      user_uuid: user.id,
      credits_to_deduct: 2
    });

    if (creditError || !creditCheck?.[0]?.success) {
      const errorMessage = creditCheck?.[0]?.error_message || 'Failed to check credits';
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        code: 'INSUFFICIENT_CREDITS'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✨ Enhancement request received:', {
      projectId,
      chapterId,
      contentLength: content?.length || prompt?.length || 0,
      enhancementLevel: options?.enhancementLevel || 'unknown'
    });

    console.log('🔒 CHAPTER ISOLATION CHECK:', {
      targetChapterId: chapterId,
      requestTimestamp: new Date().toISOString(),
      processingStatus: 'starting_enhanced_processing'
    });

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    let contentToEnhance = content;
    if (!contentToEnhance && prompt) {
      const contentMatch = prompt.match(/ORIGINAL CONTENT TO ENHANCE:\s*([\s\S]+)$/);
      contentToEnhance = contentMatch ? contentMatch[1].trim() : prompt;
    }

    if (!contentToEnhance) {
      throw new Error('No content provided for enhancement');
    }

    const storyContext = await aggregateEnhancementContext(projectId, chapterId);
    const currentMetrics = calculateQualityMetrics(contentToEnhance);
    
    const enhancementPrompt = buildEnhancementPrompt(
      contentToEnhance,
      storyContext,
      currentMetrics,
      options
    );

    console.log('📊 Quality metrics calculated:', {
      chapterId,
      enhancementLevel: options.enhancementLevel,
      fleschKincaid: currentMetrics.fleschKincaid.toFixed(2),
      readingEase: currentMetrics.readingEase.toFixed(2),
      passiveVoice: currentMetrics.passiveVoice.toFixed(1),
      dialogueRatio: currentMetrics.dialogueRatio.toFixed(1)
    });

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: enhancementPrompt
    });

    const enhancedContent = response.text;

    if (!enhancedContent) {
      throw new Error('Empty response from AI');
    }

    // Clean any unwanted formatting markers
    let cleanedContent = enhancedContent
      .replace(/Page Break/gi, '')
      .replace(/\[Page Break\]/gi, '')
      .replace(/---+/g, '')
      .trim();

    // CRITICAL: Validate and fix paragraph structure preservation
    cleanedContent = validateAndFixParagraphStructure(contentToEnhance, cleanedContent);

    const improvedMetrics = calculateQualityMetrics(cleanedContent);
    
    console.log('✅ Enhancement completed successfully:', {
      chapterId,
      enhancementLevel: options.enhancementLevel,
      originalLength: contentToEnhance.length,
      enhancedLength: cleanedContent.length,
      readabilityImprovement: (improvedMetrics.readingEase - currentMetrics.readingEase).toFixed(2),
      processingStatus: 'enhancement_complete'
    });

    // Use enhanced change tracking
    const changes = await generateChangeTrackingData(contentToEnhance, cleanedContent);
    
    console.log('🔍 Enhanced change tracking completed:', {
      chapterId,
      changesCount: changes.length,
      changeTypes: changes.map(c => c.change_type),
      avgConfidence: changes.length > 0 ? (changes.reduce((sum, c) => sum + c.confidence_score, 0) / changes.length).toFixed(3) : 'N/A',
      processingStatus: 'enhanced_change_tracking_complete'
    });

    console.log('🎉 ENHANCED CHAPTER PROCESSING SUCCESS:', {
      targetChapterId: chapterId,
      enhancementLevel: options.enhancementLevel,
      completionTimestamp: new Date().toISOString(),
      processingStatus: 'ready_for_status_update'
    });

    return new Response(JSON.stringify({
      success: true,
      enhancedContent: cleanedContent,
      changes: changes,
      metrics: {
        before: currentMetrics,
        after: improvedMetrics,
        improvements: {
          readabilityImprovement: improvedMetrics.readingEase - currentMetrics.readingEase,
          grammarImprovement: 0,
          styleImprovement: improvedMetrics.showVsTellRatio - currentMetrics.showVsTellRatio,
          overallScore: 85
        }
      },
      creditsUsed: 2,
      remainingCredits: creditCheck[0].remaining_credits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Enhanced processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
