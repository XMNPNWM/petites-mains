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
 * Generate change tracking data by comparing original and enhanced content
 * Uses paragraph-aware comparison to preserve formatting structure
 */
function generateChangeTrackingData(originalContent: string, enhancedContent: string): any[] {
  const changes: any[] = [];
  
  // Split content into paragraphs first to maintain structure
  const originalParagraphs = originalContent.split(/\n\s*\n/).filter(p => p.trim());
  const enhancedParagraphs = enhancedContent.split(/\n\s*\n/).filter(p => p.trim());
  
  // Paragraph-by-paragraph comparison
  let positionOffset = 0;
  const maxParagraphs = Math.max(originalParagraphs.length, enhancedParagraphs.length);
  
  for (let i = 0; i < maxParagraphs; i++) {
    const originalParagraph = originalParagraphs[i]?.trim() || '';
    const enhancedParagraph = enhancedParagraphs[i]?.trim() || '';
    
    if (originalParagraph && enhancedParagraph) {
      // Calculate paragraph-level similarity using word-based comparison
      const similarity = calculateParagraphSimilarity(originalParagraph, enhancedParagraph);
      
      // Only flag as change if similarity is below threshold AND changes are substantial
      if (similarity < 0.75 && Math.abs(originalParagraph.length - enhancedParagraph.length) > 20) {
        const changeType = determineChangeType(originalParagraph, enhancedParagraph);
        
        // Skip "structure" changes if they're just formatting differences
        if (changeType === 'structure' && similarity > 0.6) {
          continue; // This is likely just formatting, not a real structural change
        }
        
        changes.push({
          change_type: changeType,
          original_text: originalParagraph,
          enhanced_text: enhancedParagraph,
          position_start: positionOffset,
          position_end: positionOffset + originalParagraph.length,
          confidence_score: Math.max(0.7, similarity), // Higher baseline confidence
          user_decision: 'pending'
        });
      }
      
      positionOffset += originalParagraph.length + 2; // +2 for paragraph break
    } else {
      positionOffset += originalParagraph.length + 2;
    }
  }
  
  return changes;
}

/**
 * Calculate similarity between two strings using word overlap (0-1 scale)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  const allWords = new Set([...words1, ...words2]);
  const common = words1.filter(w => words2.includes(w)).length;
  
  return allWords.size > 0 ? (common * 2) / (words1.length + words2.length) : 0;
}

/**
 * Calculate paragraph-level similarity with better semantic understanding
 */
function calculateParagraphSimilarity(paragraph1: string, paragraph2: string): number {
  // Remove punctuation and normalize text for better comparison
  const normalize = (text: string) => text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const norm1 = normalize(paragraph1);
  const norm2 = normalize(paragraph2);
  
  // If paragraphs are very similar after normalization, high similarity
  if (norm1 === norm2) return 1.0;
  
  // Calculate word-level similarity
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2); // Filter short words
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0.0;
  
  // Calculate Jaccard similarity for better semantic matching
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const jaccardSimilarity = intersection.size / union.size;
  
  // Calculate sequence similarity (order matters)
  const commonSequence = longestCommonSubsequence(words1, words2);
  const sequenceSimilarity = (commonSequence * 2) / (words1.length + words2.length);
  
  // Combine both metrics
  return (jaccardSimilarity * 0.6) + (sequenceSimilarity * 0.4);
}

/**
 * Find longest common subsequence length between two arrays
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): number {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp[m][n];
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
  
  // If normalized content is identical, it's just punctuation/grammar
  if (normalizedOriginal === normalizedEnhanced) {
    return 'grammar';
  }
  
  // Check for punctuation-only changes
  const originalPunct = original.match(/[^\w\s]/g) || [];
  const enhancedPunct = enhanced.match(/[^\w\s]/g) || [];
  if (normalizedOriginal === normalizedEnhanced && originalPunct.length !== enhancedPunct.length) {
    return 'grammar';
  }
  
  // Check for dialogue formatting changes
  const originalQuotes = (original.match(/"/g) || []).length;
  const enhancedQuotes = (enhanced.match(/"/g) || []).length;
  if (originalQuotes > 0 || enhancedQuotes > 0) {
    return 'dialogue';
  }
  
  // Check word count difference for structure changes
  const wordDifference = Math.abs(originalWords.length - enhancedWords.length);
  const relativeDifference = wordDifference / Math.max(originalWords.length, 1);
  
  // Only classify as structure if there's a significant word count change
  if (relativeDifference > 0.25) { // 25% change in word count
    return 'structure';
  }
  
  // Check for substantial content changes (low similarity)
  const similarity = calculateParagraphSimilarity(original, enhanced);
  if (similarity < 0.5) {
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
      originalLength: contentToEnhance.length,
      enhancedLength: enhancedContent.length,
      readabilityImprovement: (improvedMetrics.readingEase - currentMetrics.readingEase).toFixed(2)
    });

    // Generate change tracking data by comparing original and enhanced content
    const changes = generateChangeTrackingData(contentToEnhance, enhancedContent);
    
    console.log('🔍 Generated change tracking data:', {
      changesCount: changes.length,
      changeTypes: changes.map(c => c.change_type)
    });

    return new Response(JSON.stringify({
      success: true,
      enhancedContent,
      changes: changes, // Include change tracking data
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