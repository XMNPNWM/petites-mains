import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
 * Enhanced change tracking using embeddings for semantic comparison
 */
async function generateChangeTrackingData(originalContent: string, enhancedContent: string): Promise<any[]> {
  const changes: any[] = [];
  
  try {
    console.log('🔍 Starting embedding-based change tracking...');
    
    const originalSentences = splitIntoSentences(originalContent);
    const enhancedSentences = splitIntoSentences(enhancedContent);
    
    console.log(`📊 Analyzing ${originalSentences.length} original vs ${enhancedSentences.length} enhanced sentences`);
    
    const originalEmbeddings: number[][] = [];
    const enhancedEmbeddings: number[][] = [];
    
    // Process original sentences
    for (let i = 0; i < originalSentences.length; i++) {
      try {
        const embedding = await generateEmbedding(originalSentences[i]);
        originalEmbeddings.push(embedding);
        
        if (i < originalSentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating embedding for original sentence ${i}:`, error);
        originalEmbeddings.push([]);
      }
    }
    
    // Process enhanced sentences
    for (let i = 0; i < enhancedSentences.length; i++) {
      try {
        const embedding = await generateEmbedding(enhancedSentences[i]);
        enhancedEmbeddings.push(embedding);
        
        if (i < enhancedSentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating embedding for enhanced sentence ${i}:`, error);
        enhancedEmbeddings.push([]);
      }
    }
    
    console.log('🧮 Computing semantic similarities...');
    
    const SIMILARITY_THRESHOLD = 0.99;
    let positionOffset = 0;
    
    for (let i = 0; i < originalSentences.length; i++) {
      const originalSentence = originalSentences[i];
      const originalEmbedding = originalEmbeddings[i];
      
      if (originalEmbedding.length === 0) {
        positionOffset += originalSentence.length + 1;
        continue;
      }
      
      let bestMatch = -1;
      let bestSimilarity = 0;
      
      for (let j = 0; j < enhancedSentences.length; j++) {
        const enhancedEmbedding = enhancedEmbeddings[j];
        
        if (enhancedEmbedding.length === 0) continue;
        
        try {
          const similarity = calculateCosineSimilarity(originalEmbedding, enhancedEmbedding);
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = j;
          }
        } catch (error) {
          console.error(`Error calculating similarity for sentence ${i} vs ${j}:`, error);
        }
      }
      
      if (bestMatch !== -1 && bestSimilarity < SIMILARITY_THRESHOLD) {
        const enhancedSentence = enhancedSentences[bestMatch];
        const changeType = determineChangeType(originalSentence, enhancedSentence);
        
        console.log(`🔄 Change detected: ${changeType} (similarity: ${bestSimilarity.toFixed(3)})`);
        
        changes.push({
          change_type: changeType,
          original_text: originalSentence,
          enhanced_text: enhancedSentence,
          position_start: positionOffset,
          position_end: positionOffset + originalSentence.length,
          confidence_score: bestSimilarity,
          user_decision: 'pending'
        });
      }
      
      positionOffset += originalSentence.length + 1;
    }
    
    console.log(`✅ Change tracking complete: ${changes.length} changes detected`);
    
  } catch (error) {
    console.error('❌ Error in embedding-based change tracking:', error);
    return generateFallbackChangeTracking(originalContent, enhancedContent);
  }
  
  return changes;
}

/**
 * Fallback change tracking in case embeddings fail
 */
function generateFallbackChangeTracking(originalContent: string, enhancedContent: string): any[] {
  const changes: any[] = [];
  
  if (originalContent !== enhancedContent) {
    changes.push({
      change_type: 'style',
      original_text: originalContent.substring(0, 100) + '...',
      enhanced_text: enhancedContent.substring(0, 100) + '...',
      position_start: 0,
      position_end: Math.min(100, originalContent.length),
      confidence_score: 0.5,
      user_decision: 'pending'
    });
  }
  
  return changes;
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
  const enhancementDirectives: string[] = [];
  const specificInstructions: string[] = [];
  const criticalSafeguards: string[] = [];

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
    "🚨 CRITICAL OUTPUT FORMATTING:",
    "- PRESERVE paragraph structure EXACTLY - maintain ALL paragraph breaks",
    "- Use ONLY simple double line breaks (\\n\\n) between paragraphs",
    "- NEVER add 'Page Break', 'Page BreakPage Break', or any formatting markers",
    "- NEVER add artificial separators, dividers, or section breaks",
    "- Return ONLY the enhanced text with no explanations or comments",
    "- Maintain the exact number of paragraphs as the original"
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId, chapterId, options, content } = await req.json();

    console.log('✨ Enhancement request received:', {
      projectId,
      chapterId,
      contentLength: content?.length || prompt?.length || 0,
      enhancementLevel: options?.enhancementLevel || 'unknown'
    });

    console.log('🔒 CHAPTER ISOLATION CHECK:', {
      targetChapterId: chapterId,
      requestTimestamp: new Date().toISOString(),
      processingStatus: 'starting_enhancement'
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
      model: "gemini-2.0-flash-exp",
      contents: enhancementPrompt
    });

    const enhancedContent = response.text;

    if (!enhancedContent) {
      throw new Error('Empty response from AI');
    }

    // Clean any unwanted formatting markers
    const cleanedContent = enhancedContent
      .replace(/Page Break/gi, '')
      .replace(/\[Page Break\]/gi, '')
      .replace(/---+/g, '')
      .trim();

    const improvedMetrics = calculateQualityMetrics(cleanedContent);
    
    console.log('✅ Enhancement completed successfully:', {
      chapterId,
      enhancementLevel: options.enhancementLevel,
      originalLength: contentToEnhance.length,
      enhancedLength: cleanedContent.length,
      readabilityImprovement: (improvedMetrics.readingEase - currentMetrics.readingEase).toFixed(2),
      processingStatus: 'enhancement_complete'
    });

    const changes = await generateChangeTrackingData(contentToEnhance, cleanedContent);
    
    console.log('🔍 Generated change tracking data:', {
      chapterId,
      changesCount: changes.length,
      changeTypes: changes.map(c => c.change_type),
      processingStatus: 'change_tracking_complete'
    });

    console.log('🎉 CHAPTER ENHANCEMENT SUCCESS:', {
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
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhancement error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Enhancement failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
