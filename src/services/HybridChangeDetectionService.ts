import * as diff from 'diff';

/**
 * Hybrid Change Detection Service
 * 
 * Phase 1: Primary diff detection for accurate change identification
 * Phase 2: Semantic embeddings for categorization and impact assessment
 */

export interface Change {
  change_type: 'grammar' | 'punctuation' | 'style' | 'structure' | 'dialogue';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  confidence_score: number;
  user_decision: 'pending' | 'accepted' | 'rejected';
  semantic_impact?: 'low' | 'medium' | 'high';
  diff_confidence?: number;
}

export interface DiffConfig {
  characterThreshold: number;  // 0.85 - for grammar/spelling fixes
  wordThreshold: number;      // 0.70 - for style changes
  structureThreshold: number; // 0.60 - for major restructuring
}

export interface SemanticConfig {
  meaningPreservationThreshold: number; // 0.90 - meaning preservation check
  lowImpactThreshold: number;           // 0.95 - minor changes
  mediumImpactThreshold: number;        // 0.85 - moderate changes
  highImpactThreshold: number;          // 0.70 - significant changes
}

export class HybridChangeDetectionService {
  private static readonly DEFAULT_DIFF_CONFIG: DiffConfig = {
    characterThreshold: 0.85,
    wordThreshold: 0.70,
    structureThreshold: 0.60
  };

  private static readonly DEFAULT_SEMANTIC_CONFIG: SemanticConfig = {
    meaningPreservationThreshold: 0.90,
    lowImpactThreshold: 0.95,
    mediumImpactThreshold: 0.85,
    highImpactThreshold: 0.70
  };

  /**
   * Phase 1: Primary Diff Detection
   * Uses character/word-level diff algorithms for accurate change detection
   */
  static async detectChanges(
    originalContent: string,
    enhancedContent: string,
    config: Partial<DiffConfig> = {}
  ): Promise<Change[]> {
    const diffConfig = { ...this.DEFAULT_DIFF_CONFIG, ...config };
    const changes: Change[] = [];

    try {
      console.log('🔍 Phase 1: Starting hybrid diff-based change detection...');

      // Step 1: Character-level diff for precise position tracking
      const characterChanges = diff.diffChars(originalContent, enhancedContent);
      
      // Step 2: Word-level diff for contextual understanding
      const wordChanges = diff.diffWords(originalContent, enhancedContent);

      // Step 3: Sentence-level diff for structural analysis
      const sentenceChanges = diff.diffSentences(originalContent, enhancedContent);

      console.log(`📊 Diff analysis complete:`, {
        characterChanges: characterChanges.filter(c => c.added || c.removed).length,
        wordChanges: wordChanges.filter(c => c.added || c.removed).length,
        sentenceChanges: sentenceChanges.filter(c => c.added || c.removed).length
      });

      // Process character-level changes for precise modifications
      let position = 0;
      for (let i = 0; i < characterChanges.length; i++) {
        const change = characterChanges[i];
        
        if (change.added || change.removed) {
          const nextChange = characterChanges[i + 1];
          
          // Find the replacement pair (removed + added)
          if (change.removed && nextChange?.added) {
            const originalText = change.value;
            const enhancedText = nextChange.value;
            
            // Calculate diff confidence based on similarity
            const similarity = this.calculateTextSimilarity(originalText, enhancedText);
            const diffConfidence = similarity >= diffConfig.characterThreshold ? 1 - similarity : 0.5;
            
            // Only include meaningful changes
            if (similarity < 0.99 && originalText.trim() && enhancedText.trim()) {
              const detectedChange: Change = {
                change_type: this.detectChangeType(originalText, enhancedText),
                original_text: originalText,
                enhanced_text: enhancedText,
                position_start: position,
                position_end: position + originalText.length,
                confidence_score: diffConfidence,
                user_decision: 'pending',
                diff_confidence: diffConfidence
              };

              changes.push(detectedChange);
              console.log(`✅ Change detected:`, {
                type: detectedChange.change_type,
                similarity: similarity.toFixed(3),
                original: originalText.substring(0, 50),
                enhanced: enhancedText.substring(0, 50)
              });
            }
            
            i++; // Skip the next change as we've processed it
          }
        }
        
        if (!change.added) {
          position += change.value.length;
        }
      }

      console.log(`✅ Phase 1 complete: ${changes.length} changes detected via diff analysis`);
      return changes;

    } catch (error) {
      console.error('❌ Error in diff-based change detection:', error);
      return this.generateFallbackChanges(originalContent, enhancedContent);
    }
  }

  /**
   * Phase 2: Enhance with Semantic Analysis
   * Uses embeddings for categorization and impact assessment
   */
  static async enhanceWithSemantics(
    changes: Change[],
    originalContent: string,
    enhancedContent: string,
    embeddingFunction: (text: string) => Promise<number[]>,
    config: Partial<SemanticConfig> = {}
  ): Promise<Change[]> {
    const semanticConfig = { ...this.DEFAULT_SEMANTIC_CONFIG, ...config };

    try {
      console.log('🧠 Phase 2: Starting semantic enhancement...');

      // Only process semantically significant changes
      const significantChanges = changes.filter(change => 
        change.original_text.length > 5 || change.enhanced_text.length > 5
      );

      console.log(`📊 Processing ${significantChanges.length} significant changes for semantic analysis`);

      const enhancedChanges: Change[] = [];

      for (const change of significantChanges) {
        try {
          // Generate embeddings for original and enhanced text
          const [originalEmbedding, enhancedEmbedding] = await Promise.all([
            embeddingFunction(change.original_text),
            embeddingFunction(change.enhanced_text)
          ]);

          // Calculate semantic similarity
          const semanticSimilarity = this.calculateCosineSimilarity(originalEmbedding, enhancedEmbedding);
          
          // Determine semantic impact
          const semanticImpact = this.assessSemanticImpact(semanticSimilarity, semanticConfig);
          
          // Enhanced confidence scoring (40% diff + 30% semantic + 30% relevance)
          const diffWeight = 0.4;
          const semanticWeight = 0.3;
          const relevanceWeight = 0.3;
          
          const relevanceScore = this.calculateChangeRelevance(change);
          const enhancedConfidence = (
            (change.diff_confidence || 0.5) * diffWeight +
            (1 - semanticSimilarity) * semanticWeight +
            relevanceScore * relevanceWeight
          );

          // Refine change type using semantic analysis
          const refinedChangeType = this.refineChangeType(
            change.change_type,
            change.original_text,
            change.enhanced_text,
            semanticSimilarity
          );

          const enhancedChange: Change = {
            ...change,
            change_type: refinedChangeType,
            confidence_score: enhancedConfidence,
            semantic_impact: semanticImpact
          };

          enhancedChanges.push(enhancedChange);

          console.log(`🔍 Semantic analysis:`, {
            original: change.original_text.substring(0, 30),
            enhanced: change.enhanced_text.substring(0, 30),
            similarity: semanticSimilarity.toFixed(3),
            impact: semanticImpact,
            confidence: enhancedConfidence.toFixed(3)
          });

          // Rate limiting to avoid API overload
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.warn(`⚠️ Semantic analysis failed for change:`, error);
          enhancedChanges.push(change); // Keep original change
        }
      }

      // Add back non-significant changes without semantic analysis
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
   * Complete hybrid analysis pipeline
   */
  static async analyzeChanges(
    originalContent: string,
    enhancedContent: string,
    embeddingFunction: (text: string) => Promise<number[]>,
    diffConfig: Partial<DiffConfig> = {},
    semanticConfig: Partial<SemanticConfig> = {}
  ): Promise<Change[]> {
    console.log('🚀 Starting hybrid change detection pipeline...');

    // Phase 1: Primary diff detection
    const diffChanges = await this.detectChanges(originalContent, enhancedContent, diffConfig);

    if (diffChanges.length === 0) {
      console.log('✅ No changes detected - content is identical');
      return [];
    }

    // Phase 2: Semantic enhancement
    const enhancedChanges = await this.enhanceWithSemantics(
      diffChanges,
      originalContent,
      enhancedContent,
      embeddingFunction,
      semanticConfig
    );

    // Phase 3: Smart filtering (hide trivial changes by default)
    const filteredChanges = this.smartFilter(enhancedChanges);

    console.log(`🎯 Pipeline complete: ${filteredChanges.length} final changes`);
    return filteredChanges;
  }

  /**
   * Calculate text similarity using Jaccard index for diff confidence
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 1 : intersection.size / union.size;
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
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
   * Detect change type based on actual text differences
   */
  private static detectChangeType(original: string, enhanced: string): Change['change_type'] {
    const originalWords = original.split(/\s+/).filter(w => w.length > 0);
    const enhancedWords = enhanced.split(/\s+/).filter(w => w.length > 0);

    // Check for dialogue
    const originalHasDialogue = /["«»""]/.test(original);
    const enhancedHasDialogue = /["«»""]/.test(enhanced);
    if (originalHasDialogue || enhancedHasDialogue) {
      return 'dialogue';
    }

    // Check for punctuation changes
    const originalPunctuation = original.replace(/[a-zA-Z\s]/g, '');
    const enhancedPunctuation = enhanced.replace(/[a-zA-Z\s]/g, '');
    if (originalPunctuation !== enhancedPunctuation) {
      return 'punctuation';
    }

    // Check for structural changes
    const wordDifference = Math.abs(originalWords.length - enhancedWords.length);
    const relativeDifference = wordDifference / Math.max(originalWords.length, 1);
    if (relativeDifference > 0.30) {
      return 'structure';
    }

    // Check for grammar vs style
    const normalizedOriginal = original.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normalizedEnhanced = enhanced.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (normalizedOriginal === normalizedEnhanced) {
      return 'grammar';
    }

    return 'style';
  }

  /**
   * Assess semantic impact based on similarity
   */
  private static assessSemanticImpact(
    similarity: number,
    config: SemanticConfig
  ): 'low' | 'medium' | 'high' {
    if (similarity >= config.lowImpactThreshold) return 'low';
    if (similarity >= config.mediumImpactThreshold) return 'medium';
    return 'high';
  }

  /**
   * Calculate change relevance for confidence scoring
   */
  private static calculateChangeRelevance(change: Change): number {
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
  private static refineChangeType(
    originalType: Change['change_type'],
    originalText: string,
    enhancedText: string,
    semanticSimilarity: number
  ): Change['change_type'] {
    // High semantic similarity suggests grammar/punctuation rather than style
    if (semanticSimilarity > 0.95 && originalType === 'style') {
      return this.detectChangeType(originalText, enhancedText);
    }
    
    return originalType;
  }

  /**
   * Smart filtering to hide trivial changes by default
   */
  private static smartFilter(changes: Change[]): Change[] {
    return changes.filter(change => {
      // Always include meaningful changes
      if (change.semantic_impact === 'medium' || change.semantic_impact === 'high') {
        return true;
      }
      
      // Include grammar and punctuation fixes
      if (change.change_type === 'grammar' || change.change_type === 'punctuation') {
        return true;
      }
      
      // Include changes with high confidence
      if (change.confidence_score > 0.7) {
        return true;
      }
      
      // Include longer changes
      if (change.original_text.length > 20 || change.enhanced_text.length > 20) {
        return true;
      }
      
      return false; // Filter out trivial changes
    });
  }

  /**
   * Fallback change detection for diff failures
   */
  private static generateFallbackChanges(originalContent: string, enhancedContent: string): Change[] {
    if (originalContent === enhancedContent) {
      return [];
    }

    return [{
      change_type: 'style',
      original_text: originalContent.substring(0, 100) + (originalContent.length > 100 ? '...' : ''),
      enhanced_text: enhancedContent.substring(0, 100) + (enhancedContent.length > 100 ? '...' : ''),
      position_start: 0,
      position_end: Math.min(100, originalContent.length),
      confidence_score: 0.5,
      user_decision: 'pending'
    }];
  }
}