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
      // Get chapter content
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (chapterError || !chapter?.content) {
        throw new Error('Failed to fetch chapter content');
      }

      // Get story context
      const storyContext = await this.getStoryContext(projectId, chapterId);
      
      // Calculate current quality metrics
      const currentMetrics = this.calculateQualityMetrics(chapter.content);

      // Build enhancement prompt
      const prompt = this.buildEnhancementPrompt(
        chapter.content,
        storyContext,
        currentMetrics,
        options
      );

      // Call the enhance-chapter edge function
      const { data: result, error: enhanceError } = await supabase.functions.invoke('enhance-chapter', {
        body: {
          content: chapter.content,
          projectId,
          chapterId,
          options
        }
      });

      if (enhanceError) {
        throw new Error(`Enhancement failed: ${enhanceError.message}`);
      }

      return {
        success: true,
        enhancedContent: result?.enhancedContent
      };

    } catch (error) {
      console.error('Enhancement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async getStoryContext(projectId: string, chapterId: string): Promise<any> {
    // Get basic story context - simplified for Phase 1
    const { data: project } = await supabase
      .from('projects')
      .select('title, description')
      .eq('id', projectId)
      .single();

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, title, order_index')
      .eq('project_id', projectId)
      .order('order_index');

    const currentChapterIndex = chapters?.findIndex(c => c.id === chapterId) ?? 0;

    return {
      projectTitle: project?.title || 'Untitled Project',
      projectDescription: project?.description || '',
      chapterPosition: `Chapter ${currentChapterIndex + 1} of ${chapters?.length || 1}`,
      totalChapters: chapters?.length || 1,
      genre: 'Unknown', // To be enhanced in later phases
      pointOfView: 'Unknown',
      tone: 'Unknown',
      characters: [],
      setting: 'Unknown',
      plotArc: 'Unknown',
      themes: [],
      styleTips: []
    };
  }

  private static calculateQualityMetrics(content: string): QualityMetrics {
    // Simplified metrics calculation for Phase 1
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = content.split(/\s+/).length;
    const characters = content.length;

    return {
      fleschKincaid: this.calculateFleschKincaid(content, sentences, words),
      readingEase: this.calculateReadingEase(content, sentences, words),
      avgSentenceLength: sentences > 0 ? words / sentences : 0,
      avgWordLength: words > 0 ? characters / words : 0,
      passiveVoice: this.calculatePassiveVoice(content),
      dialogueRatio: this.calculateDialogueRatio(content),
      complexSentenceRatio: 25, // Placeholder
      uncommonWordRatio: 10, // Placeholder
      showVsTellRatio: 50, // Placeholder
      characterConsistency: 85 // Placeholder
    };
  }

  private static calculateFleschKincaid(content: string, sentences: number, words: number): number {
    const syllables = this.countSyllables(content);
    if (sentences === 0 || words === 0) return 0;
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private static calculateReadingEase(content: string, sentences: number, words: number): number {
    const syllables = this.countSyllables(content);
    if (sentences === 0 || words === 0) return 0;
    return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  }

  private static countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;
    
    for (const word of words) {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllables += vowels.length;
        if (word.endsWith('e') && vowels.length > 1) {
          syllables--;
        }
      } else {
        syllables++;
      }
    }
    
    return syllables;
  }

  private static calculatePassiveVoice(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let passiveCount = 0;
    
    const passivePattern = /\b(was|were|is|are|am|be|been|being)\s+\w+(ed|en)\b/gi;
    
    for (const sentence of sentences) {
      if (passivePattern.test(sentence)) {
        passiveCount++;
      }
    }
    
    return sentences.length > 0 ? (passiveCount / sentences.length) * 100 : 0;
  }

  private static calculateDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/"[^"]*"/g) || [];
    const dialogueText = dialogueMatches.join(' ');
    return content.length > 0 ? (dialogueText.length / content.length) * 100 : 0;
  }

  private static buildEnhancementPrompt(
    content: string,
    context: any,
    metrics: QualityMetrics,
    options: EnhancementOptions
  ): string {
    const { standards } = this;
    
    let enhancementDirectives = [];
    let specificInstructions = [];

    // General instructions based on overall level
    if (options.enhancementLevel === 'light') {
      enhancementDirectives.push("- Focus strictly on fundamental errors (grammar, punctuation).");
      enhancementDirectives.push("- Avoid any subjective stylistic changes.");
    } else if (options.enhancementLevel === 'moderate') {
      enhancementDirectives.push("- Balance technical corrections with subtle stylistic improvements.");
    } else if (options.enhancementLevel === 'comprehensive') {
      enhancementDirectives.push("- Apply all applicable standards for a polished, professional output.");
      enhancementDirectives.push("- Be more proactive in suggesting stylistic refinements.");
    }

    // Preserve Author Voice
    if (options.preserveAuthorVoice) {
      specificInstructions.push("CRITICAL: Maintain the author's unique voice, tone, and characterization. Avoid rephrasing that might alter the original artistic intent or distinctive narrative style. Prioritize subtle refinements over significant rewrites.");
    }

    // Grammar & Punctuation
    if (options.applyGrammarFixes) {
      enhancementDirectives.push("- Fix all grammatical errors (e.g., subject-verb agreement, tense consistency, pronoun agreement).");
    }
    if (options.applyPunctuationFixes) {
      enhancementDirectives.push("- Apply all specified punctuation rules:");
      specificInstructions.push(`  - Use ${standards.punctuation.dialogue.quotationMarks} quotation marks for dialogue.`);
      specificInstructions.push(`  - Place punctuation ${standards.punctuation.dialogue.punctuationInside ? 'inside' : 'outside'} quotation marks.`);
      specificInstructions.push(`  - Use ${standards.punctuation.general.oxfordComma ? 'the Oxford comma' : 'no Oxford comma'}.`);
    }

    // Formatting
    if (options.applyFormattingFixes) {
      enhancementDirectives.push("- Ensure strict adherence to novel formatting standards:");
      specificInstructions.push("  - Ensure new paragraphs per speaker in dialogue.");
      specificInstructions.push("  - Apply proper paragraph structure and indentation.");
    }

    // Readability
    if (options.improveReadability) {
      enhancementDirectives.push("- Improve readability towards specified metrics:");
      specificInstructions.push(`  - Target Flesch-Kincaid Grade Level: ${standards.readability.fleschKincaid.targetGradeLevel}-${standards.readability.fleschKincaid.maxGradeLevel}.`);
      specificInstructions.push(`  - Aim for minimum Reading Ease: ${standards.readability.fleschKincaid.minReadingEase}.`);
      specificInstructions.push(`  - Reduce average sentence length (target ${standards.readability.sentenceStructure.averageLength} words).`);
      specificInstructions.push(`  - Minimize passive voice (max ${standards.readability.vocabulary.passiveVoiceRatio * 100}%).`);
    }

    // Style improvements
    if (options.improveStyle) {
      enhancementDirectives.push("- Enhance stylistic elements and pacing:");
      if (options.improveShowVsTell) {
        specificInstructions.push("  - Identify opportunities to 'show, not tell' by adding sensory details or showing emotions through actions.");
      }
      if (options.refinePacing) {
        specificInstructions.push("  - Refine sentence flow and vary sentence structure for better rhythm.");
      }
      if (options.enhanceCharacterVoice) {
        specificInstructions.push("  - Ensure consistent and distinctive character voices in dialogue and internal monologue.");
      }
      if (options.addSensoryDetails) {
        specificInstructions.push("  - Add appropriate sensory details to enhance immersion.");
      }
    }

    return `
NOVEL ENHANCEMENT TASK

STORY CONTEXT:
- Project: ${context.projectTitle}
- Description: ${context.projectDescription}
- Chapter Position: ${context.chapterPosition}
- Total Chapters: ${context.totalChapters}

CURRENT QUALITY METRICS:
- Flesch-Kincaid Grade Level: ${metrics.fleschKincaid.toFixed(2)}
- Reading Ease Score: ${metrics.readingEase.toFixed(2)}
- Average Sentence Length: ${metrics.avgSentenceLength.toFixed(2)} words
- Passive Voice: ${metrics.passiveVoice.toFixed(2)}%
- Dialogue Ratio: ${metrics.dialogueRatio.toFixed(2)}%

ENHANCEMENT INSTRUCTIONS:
${enhancementDirectives.join('\n')}

SPECIFIC GUIDELINES:
${specificInstructions.join('\n')}

ORIGINAL CONTENT TO ENHANCE:
${content}

OUTPUT INSTRUCTIONS:
- Return only the enhanced text. Do not include any explanations, comments, or markdown formatting.
- Ensure all changes strictly adhere to the guidelines provided, prioritizing "CRITICAL" instructions.
- If no enhancements are necessary based on the options and standards, return the original content verbatim.
`;
  }
}