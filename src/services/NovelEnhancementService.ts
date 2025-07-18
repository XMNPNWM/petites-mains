import { supabase } from '@/integrations/supabase/client';
import { EnhancementOptions, NovelStandards, QualityMetrics } from '@/types/enhancement';

export class NovelEnhancementService {
  private static standards: NovelStandards = {
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

  static async enhanceChapter(
    projectId: string,
    chapterId: string,
    options: EnhancementOptions
  ): Promise<{ success: boolean; enhancedContent?: string; error?: string }> {
    try {
      console.log('🚀 NovelEnhancementService - Starting enhancement with comprehensive standards:', {
        projectId,
        chapterId,
        enhancementLevel: options.enhancementLevel,
        preserveAuthorVoice: options.preserveAuthorVoice,
        applyGrammarFixes: options.applyGrammarFixes,
        applyPunctuationFixes: options.applyPunctuationFixes,
        improveStyle: options.improveStyle
      });

      // Get chapter content
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (chapterError || !chapter?.content) {
        throw new Error('Failed to fetch chapter content');
      }

      console.log('📖 Chapter content retrieved:', {
        chapterId,
        contentLength: chapter.content.length,
        title: chapter.title
      });

      // Call the enhanced edge function with comprehensive options
      const { data: result, error: enhanceError } = await supabase.functions.invoke('enhance-chapter', {
        body: {
          content: chapter.content,
          projectId,
          chapterId,
          options: {
            ...options,
            // Ensure comprehensive standards are applied based on level
            applyGrammarFixes: true, // Always apply for consistency
            applyPunctuationFixes: options.applyPunctuationFixes,
            applyFormattingFixes: options.applyFormattingFixes,
            improveReadability: options.improveReadability,
            improveStyle: options.improveStyle,
            // Level-specific safeguards
            preserveAuthorVoice: options.preserveAuthorVoice || options.enhancementLevel === 'light'
          }
        }
      });

      if (enhanceError) {
        throw new Error(`Enhancement failed: ${enhanceError.message}`);
      }

      console.log('✅ Enhancement completed with professional standards:', {
        chapterId,
        enhancementLevel: options.enhancementLevel,
        success: result?.success,
        originalLength: chapter.content.length,
        enhancedLength: result?.enhancedContent?.length || 0,
        changesDetected: result?.changes?.length || 0
      });

      return {
        success: true,
        enhancedContent: result?.enhancedContent
      };

    } catch (error) {
      console.error('❌ NovelEnhancementService error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to get current standards (for reference)
  static getStandards(): NovelStandards {
    return this.standards;
  }

  // Helper method to validate enhancement options based on level
  static validateEnhancementOptions(options: EnhancementOptions): EnhancementOptions {
    const validated = { ...options };

    // Apply level-specific validation and defaults
    switch (options.enhancementLevel) {
      case 'light':
        // Light mode: only technical corrections
        validated.improveStyle = false;
        validated.improveShowVsTell = false;
        validated.refinePacing = false;
        validated.enhanceCharacterVoice = false;
        validated.addSensoryDetails = false;
        validated.preserveAuthorVoice = true; // Always preserve in light mode
        break;

      case 'moderate':
        // Moderate mode: balanced approach
        validated.preserveAuthorVoice = options.preserveAuthorVoice !== false; // Default to true
        break;

      case 'comprehensive':
        // Comprehensive mode: all options available
        // No restrictions, use as provided
        break;
    }

    console.log('📋 Enhancement options validated for level:', options.enhancementLevel, {
      original: options,
      validated: validated
    });

    return validated;
  }
}
