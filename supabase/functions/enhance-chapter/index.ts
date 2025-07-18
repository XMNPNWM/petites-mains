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

interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens_used: number;
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
  // Split on sentence endings, preserve paragraph structure
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
    
    // Split content into sentences
    const originalSentences = splitIntoSentences(originalContent);
    const enhancedSentences = splitIntoSentences(enhancedContent);
    
    console.log(`📊 Analyzing ${originalSentences.length} original vs ${enhancedSentences.length} enhanced sentences`);
    
    // Generate embeddings for all sentences
    const originalEmbeddings: number[][] = [];
    const enhancedEmbeddings: number[][] = [];
    
    // Process original sentences
    for (let i = 0; i < originalSentences.length; i++) {
      try {
        const embedding = await generateEmbedding(originalSentences[i]);
        originalEmbeddings.push(embedding);
        
        // Rate limiting - small delay between requests
        if (i < originalSentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating embedding for original sentence ${i}:`, error);
        // Use empty embedding as fallback
        originalEmbeddings.push([]);
      }
    }
    
    // Process enhanced sentences
    for (let i = 0; i < enhancedSentences.length; i++) {
      try {
        const embedding = await generateEmbedding(enhancedSentences[i]);
        enhancedEmbeddings.push(embedding);
        
        // Rate limiting - small delay between requests
        if (i < enhancedSentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating embedding for enhanced sentence ${i}:`, error);
        // Use empty embedding as fallback
        enhancedEmbeddings.push([]);
      }
    }
    
    console.log('🧮 Computing semantic similarities...');
    
    // Find the best matches between original and enhanced sentences
    const SIMILARITY_THRESHOLD = 0.99; // As requested by user
    let positionOffset = 0;
    
    for (let i = 0; i < originalSentences.length; i++) {
      const originalSentence = originalSentences[i];
      const originalEmbedding = originalEmbeddings[i];
      
      // Skip if embedding generation failed
      if (originalEmbedding.length === 0) {
        positionOffset += originalSentence.length + 1;
        continue;
      }
      
      let bestMatch = -1;
      let bestSimilarity = 0;
      
      // Find the most similar enhanced sentence
      for (let j = 0; j < enhancedSentences.length; j++) {
        const enhancedEmbedding = enhancedEmbeddings[j];
        
        // Skip if embedding generation failed
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
      
      // Only flag as change if similarity is below threshold (< 0.99)
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
    // Fallback to basic change detection if embeddings fail
    return generateFallbackChangeTracking(originalContent, enhancedContent);
  }
  
  return changes;
}

/**
 * Fallback change tracking in case embeddings fail
 */
function generateFallbackChangeTracking(originalContent: string, enhancedContent: string): any[] {
  const changes: any[] = [];
  
  // Simple text comparison as fallback
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

    // Fetch all story data in parallel
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

    // Find current chapter position
    const currentChapterIndex = chapters.findIndex(c => c.id === chapterId);
    const currentChapter = chapters[currentChapterIndex];

    // Separate knowledge by category
    const characters = knowledge.filter(item => item.category === 'character');
    const worldBuilding = knowledge.filter(item => item.category === 'world_building');
    const themes = knowledge.filter(item => item.category === 'theme');

    // Build comprehensive context
    const contextSections: string[] = [
      `## PROJECT OVERVIEW`,
      `**Title:** ${project?.title || 'Untitled Project'}`,
      `**Description:** ${project?.description || 'No description available'}`,
      `**Current Chapter:** ${currentChapter?.title || `Chapter ${currentChapterIndex + 1}`} (${currentChapterIndex + 1} of ${chapters.length})`,
      ``
    ];

    // Add character profiles for voice consistency
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

    // Add key relationships for character interactions
    if (characterRelationships.length > 0) {
      contextSections.push(`## KEY RELATIONSHIPS (for dialogue authenticity)`);
      characterRelationships.slice(0, 6).forEach(rel => {
        contextSections.push(`**${rel.character_a_name} ↔ ${rel.character_b_name}** (${rel.relationship_type})`);
        if (rel.evidence) contextSections.push(`- Context: ${rel.evidence}`);
        contextSections.push('');
      });
    }

    // Add plot context for narrative consistency
    if (plotThreads.length > 0) {
      contextSections.push(`## ACTIVE PLOT THREADS (for narrative consistency)`);
      plotThreads.slice(0, 5).forEach(thread => {
        contextSections.push(`**${thread.thread_name}** (${thread.thread_type})`);
        if (thread.evidence) contextSections.push(`- Current state: ${thread.evidence}`);
        contextSections.push('');
      });
    }

    // Add world building for atmosphere and setting details
    if (worldBuilding.length > 0) {
      contextSections.push(`## WORLD BUILDING (for setting consistency)`);
      worldBuilding.slice(0, 6).forEach(element => {
        contextSections.push(`**${element.name}**${element.subcategory ? ` (${element.subcategory})` : ''}`);
        if (element.description) contextSections.push(`- ${element.description}`);
        contextSections.push('');
      });
    }

    // Add themes for stylistic guidance
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
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;

  // Advanced metrics calculations
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
    characterConsistency: 85 // Placeholder - would need AI analysis
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
    
    // Adjust for silent 'e'
    if (cleanWord.endsWith('e') && vowelGroups.length > 1) {
      syllables--;
    }
    
    // Minimum one syllable per word
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
  // Simplified implementation - could be enhanced with a proper word frequency database
  const words = content.toLowerCase().split(/\s+/).filter(w => w.match(/^[a-z]+$/));
  const longWords = words.filter(w => w.length > 6);
  return longWords.length;
}

function calculateShowVsTellRatio(content: string): number {
  // Simplified heuristic - look for sensory details vs. abstract statements
  const sensoryWords = content.match(/\b(saw|heard|felt|smelled|tasted|touched|looked|sounded|seemed|appeared)\b/gi) || [];
  const abstractWords = content.match(/\b(was|were|had|felt|thought|knew|realized|understood|believed)\b/gi) || [];
  
  const totalIndicators = sensoryWords.length + abstractWords.length;
  return totalIndicators > 0 ? (sensoryWords.length / totalIndicators) * 100 : 50;
}

/**
 * Determine the type of change based on content analysis
 */
function determineChangeType(original: string, enhanced: string): string {
  // Normalize both texts for comparison
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const normalizedOriginal = normalize(original);
  const normalizedEnhanced = normalize(enhanced);
  
  const originalWords = original.split(/\s+/).filter(w => w.length > 0);
  const enhancedWords = enhanced.split(/\s+/).filter(w => w.length > 0);
  
  // Check for dialogue content
  const originalHasDialogue = original.includes('"') || original.includes('«') || original.includes('—');
  const enhancedHasDialogue = enhanced.includes('"') || enhanced.includes('«') || enhanced.includes('—');
  
  if (originalHasDialogue || enhancedHasDialogue) {
    return 'dialogue';
  }
  
  // If normalized content is identical, it's just punctuation/grammar
  if (normalizedOriginal === normalizedEnhanced) {
    return 'grammar';
  }
  
  // Check word count difference for structure changes
  const wordDifference = Math.abs(originalWords.length - enhancedWords.length);
  const relativeDifference = wordDifference / Math.max(originalWords.length, 1);
  
  // Classify as structure if there's a significant word count change (>30%)
  if (relativeDifference > 0.30) {
    return 'structure';
  }
  
  // Check for substantial content changes
  const commonWords = originalWords.filter(word => enhancedWords.includes(word)).length;
  const wordSimilarity = commonWords / Math.max(originalWords.length, enhancedWords.length);
  
  if (wordSimilarity < 0.6) {
    return 'structure'; // Major rewrite
  }
  
  // Default to style for moderate changes
  return 'style';
}

/**
 * Build sophisticated enhancement prompt
 */
function buildEnhancementPrompt(
  content: string,
  storyContext: string,
  currentMetrics: QualityMetrics,
  options: EnhancementOptions
): string {
  const enhancementDirectives: string[] = [];
  const specificInstructions: string[] = [];

  // Core enhancement level directives
  switch (options.enhancementLevel) {
    case 'light':
      enhancementDirectives.push("- Focus ONLY on fundamental errors: grammar, punctuation, and basic formatting.");
      enhancementDirectives.push("- Avoid any subjective stylistic changes that could alter the author's voice.");
      break;
    case 'moderate':
      enhancementDirectives.push("- Balance technical corrections with subtle stylistic improvements.");
      enhancementDirectives.push("- Make careful enhancements while preserving the original tone and style.");
      break;
    case 'comprehensive':
      enhancementDirectives.push("- Apply all applicable standards for polished, professional output.");
      enhancementDirectives.push("- Enhance style, pacing, and readability while maintaining narrative integrity.");
      break;
  }

  // Author voice preservation (CRITICAL)
  if (options.preserveAuthorVoice) {
    specificInstructions.push("🚨 CRITICAL: Maintain the author's unique voice, tone, and characterization. Prioritize subtle refinements over rewrites. Preserve distinctive narrative style and character personalities as established in the story context.");
  }

  // Grammar and punctuation fixes
  if (options.applyGrammarFixes) {
    enhancementDirectives.push("- Fix grammatical errors: subject-verb agreement, tense consistency, pronoun agreement.");
  }
  
  if (options.applyPunctuationFixes) {
    enhancementDirectives.push("- Apply standard punctuation rules:");
    specificInstructions.push("  - Use double quotation marks for dialogue");
    specificInstructions.push("  - Place punctuation inside quotation marks");
    specificInstructions.push("  - Use Oxford comma in lists");
    specificInstructions.push("  - Apply proper em-dash usage for interruptions");
  }

  // Formatting improvements
  if (options.applyFormattingFixes) {
    enhancementDirectives.push("- Ensure proper novel formatting:");
    specificInstructions.push("  - New paragraph for each speaker in dialogue");
    specificInstructions.push("  - Proper paragraph structure and transitions");
    specificInstructions.push("  - Consistent narrative flow");
  }

  // Readability enhancements
  if (options.improveReadability) {
    enhancementDirectives.push("- Improve readability metrics:");
    specificInstructions.push(`  - Target Flesch-Kincaid Grade Level: 7-12 (current: ${currentMetrics.fleschKincaid.toFixed(1)})`);
    specificInstructions.push(`  - Improve Reading Ease to 60+ (current: ${currentMetrics.readingEase.toFixed(1)})`);
    specificInstructions.push(`  - Optimize sentence length averaging 15-20 words (current: ${currentMetrics.avgSentenceLength.toFixed(1)})`);
    specificInstructions.push(`  - Reduce passive voice below 5% (current: ${currentMetrics.passiveVoice.toFixed(1)}%)`);
  }

  // Style improvements
  if (options.improveStyle) {
    enhancementDirectives.push("- Enhance stylistic elements:");
    
    if (options.improveShowVsTell) {
      specificInstructions.push("  - Convert 'telling' statements to 'showing' through actions, dialogue, or sensory details");
      specificInstructions.push("  - Add concrete details instead of abstract descriptions");
    }
    
    if (options.refinePacing) {
      specificInstructions.push("  - Vary sentence structure for better rhythm and flow");
      specificInstructions.push("  - Balance action, dialogue, and description appropriately");
    }
    
    if (options.enhanceCharacterVoice) {
      specificInstructions.push("  - Ensure character dialogue matches their established personality and speech patterns");
      specificInstructions.push("  - Maintain consistent character voice throughout");
    }
    
    if (options.addSensoryDetails) {
      specificInstructions.push("  - Add appropriate sensory details to enhance immersion");
      specificInstructions.push("  - Include sight, sound, touch, taste, or smell where relevant");
    }
  }

  return `# NOVEL ENHANCEMENT TASK

## STORY CONTEXT
${storyContext}

## CURRENT QUALITY METRICS
- Flesch-Kincaid Grade Level: ${currentMetrics.fleschKincaid.toFixed(2)}
- Reading Ease Score: ${currentMetrics.readingEase.toFixed(2)}
- Average Sentence Length: ${currentMetrics.avgSentenceLength.toFixed(1)} words
- Passive Voice: ${currentMetrics.passiveVoice.toFixed(1)}%
- Dialogue Ratio: ${currentMetrics.dialogueRatio.toFixed(1)}%
- Complex Sentence Ratio: ${currentMetrics.complexSentenceRatio.toFixed(1)}%

## ENHANCEMENT INSTRUCTIONS
${enhancementDirectives.join('\n')}

## SPECIFIC GUIDELINES
${specificInstructions.join('\n')}

## CRITICAL FORMATTING REQUIREMENTS
🚨 PRESERVE PARAGRAPH STRUCTURE EXACTLY:
- Maintain ALL paragraph breaks and line spacing from the original
- Do NOT remove blank lines between paragraphs
- Keep the same number of paragraphs as the original
- Preserve dialogue formatting with proper paragraph breaks
- Each paragraph should remain as a separate paragraph after enhancement

🚨 ABSOLUTELY FORBIDDEN:
- NEVER add "Page Break", "Page BreakPage Break", or any similar formatting markers
- NEVER add artificial page separators or dividers
- Use ONLY simple double line breaks (\\n\\n) between paragraphs when needed
- Preserve the exact original line break structure

## OUTPUT REQUIREMENTS
- Return ONLY the enhanced text
- No explanations, comments, or formatting markers
- If no changes are needed, return the original content exactly
- MUST maintain exact paragraph structure and line breaks
- Preserve all intentional stylistic choices that align with the story context
- Focus on word-level and sentence-level improvements within existing paragraphs

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

    // CRITICAL: Log chapter isolation check
    console.log('🔒 CHAPTER ISOLATION CHECK:', {
      targetChapterId: chapterId,
      requestTimestamp: new Date().toISOString(),
      processingStatus: 'starting_enhancement'
    });

    // Get API key
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    // If content is provided directly, use it; otherwise extract from prompt
    let contentToEnhance = content;
    if (!contentToEnhance && prompt) {
      // Extract content from the existing prompt format
      const contentMatch = prompt.match(/ORIGINAL CONTENT TO ENHANCE:\s*([\s\S]+)$/);
      contentToEnhance = contentMatch ? contentMatch[1].trim() : prompt;
    }

    if (!contentToEnhance) {
      throw new Error('No content provided for enhancement');
    }

    // Get comprehensive story context
    const storyContext = await aggregateEnhancementContext(projectId, chapterId);
    
    // Calculate current quality metrics
    const currentMetrics = calculateQualityMetrics(contentToEnhance);
    
    // Build enhancement prompt
    const enhancementPrompt = buildEnhancementPrompt(
      contentToEnhance,
      storyContext,
      currentMetrics,
      options
    );

    console.log('📊 Quality metrics calculated:', {
      chapterId,
      fleschKincaid: currentMetrics.fleschKincaid.toFixed(2),
      readingEase: currentMetrics.readingEase.toFixed(2),
      passiveVoice: currentMetrics.passiveVoice.toFixed(1),
      dialogueRatio: currentMetrics.dialogueRatio.toFixed(1)
    });

    // Initialize Google AI
    const ai = new GoogleGenAI({ apiKey });

    // Generate enhanced content using gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: enhancementPrompt
    });

    const enhancedContent = response.text;

    if (!enhancedContent) {
      throw new Error('Empty response from AI');
    }

    // Calculate improved metrics
    const improvedMetrics = calculateQualityMetrics(enhancedContent);
    
    console.log('✅ Enhancement completed successfully:', {
      chapterId,
      originalLength: contentToEnhance.length,
      enhancedLength: enhancedContent.length,
      readabilityImprovement: (improvedMetrics.readingEase - currentMetrics.readingEase).toFixed(2),
      processingStatus: 'enhancement_complete'
    });

    // Generate change tracking data using embeddings-based comparison
    const changes = await generateChangeTrackingData(contentToEnhance, enhancedContent);
    
    console.log('🔍 Generated embedding-based change tracking data:', {
      chapterId,
      changesCount: changes.length,
      changeTypes: changes.map(c => c.change_type),
      processingStatus: 'change_tracking_complete'
    });

    // CRITICAL: Log successful completion for this specific chapter
    console.log('🎉 CHAPTER ENHANCEMENT SUCCESS:', {
      targetChapterId: chapterId,
      completionTimestamp: new Date().toISOString(),
      processingStatus: 'ready_for_status_update'
    });

    return new Response(JSON.stringify({
      success: true,
      enhancedContent,
      changes: changes, // Include embedding-based change tracking data
      metrics: {
        before: currentMetrics,
        after: improvedMetrics,
        improvements: {
          readabilityImprovement: improvedMetrics.readingEase - currentMetrics.readingEase,
          grammarImprovement: 0, // Would need more sophisticated analysis
          styleImprovement: improvedMetrics.showVsTellRatio - currentMetrics.showVsTellRatio,
          overallScore: 85 // Placeholder - could be calculated based on multiple factors
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
