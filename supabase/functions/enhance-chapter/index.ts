
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Improved dialogue detection patterns - more specific
const DIALOGUE_PATTERNS = [
  /^["«].*?["»]$/m,  // Full quoted dialogue lines
  /^—\s+.*?[.!?]$/m, // Dash dialogue with proper structure
  /^\s*[—-]\s+[A-Z].*?[.!?]\s*$/m // Dialogue with capital start and punctuation end
];

// Character-level position validation
function validateChangePosition(text: string, start: number, end: number, expectedText: string): boolean {
  if (start < 0 || end > text.length || start >= end) return false;
  const actualText = text.substring(start, end);
  return actualText.trim() === expectedText.trim();
}

// Improved text similarity scoring
function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0;
  if (!text1 || !text2) return 0.0;
  
  const len1 = text1.length;
  const len2 = text2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1.0;
  
  // Calculate Levenshtein distance
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (text1[i - 1] === text2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,    // deletion
          matrix[j][i - 1] + 1,    // insertion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  return 1 - (distance / maxLen);
}

// Improved word-level diff with better alignment
function createWordLevelDiff(originalText: string, enhancedText: string) {
  const originalWords = originalText.split(/(\s+)/);
  const enhancedWords = enhancedText.split(/(\s+)/);
  
  // Use longest common subsequence for better alignment
  const lcs = findLCS(originalWords, enhancedWords);
  const changes = [];
  
  let origIndex = 0;
  let enhIndex = 0;
  let origCharPos = 0;
  let enhCharPos = 0;
  
  for (const lcsItem of lcs) {
    // Handle deletions
    while (origIndex < originalWords.length && originalWords[origIndex] !== lcsItem.value) {
      const word = originalWords[origIndex];
      if (word.trim()) { // Only track non-whitespace changes
        changes.push({
          type: 'delete',
          originalText: word,
          originalStart: origCharPos,
          originalEnd: origCharPos + word.length,
          enhancedText: '',
          enhancedStart: enhCharPos,
          enhancedEnd: enhCharPos
        });
      }
      origCharPos += word.length;
      origIndex++;
    }
    
    // Handle insertions
    while (enhIndex < enhancedWords.length && enhancedWords[enhIndex] !== lcsItem.value) {
      const word = enhancedWords[enhIndex];
      if (word.trim()) { // Only track non-whitespace changes
        changes.push({
          type: 'insert',
          originalText: '',
          originalStart: origCharPos,
          originalEnd: origCharPos,
          enhancedText: word,
          enhancedStart: enhCharPos,
          enhancedEnd: enhCharPos + word.length
        });
      }
      enhCharPos += word.length;
      enhIndex++;
    }
    
    // Skip the common word
    if (origIndex < originalWords.length) {
      origCharPos += originalWords[origIndex].length;
      origIndex++;
    }
    if (enhIndex < enhancedWords.length) {
      enhCharPos += enhancedWords[enhIndex].length;
      enhIndex++;
    }
  }
  
  return changes;
}

// Longest Common Subsequence algorithm
function findLCS(arr1: string[], arr2: string[]) {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find the LCS
  const lcs = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift({ value: arr1[i - 1], origIndex: i - 1, enhIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

// Enhanced change type detection
function detectChangeType(originalText: string, enhancedText: string): 'grammar' | 'structure' | 'dialogue' | 'style' {
  // Check for dialogue patterns - much more restrictive
  const isOriginalDialogue = DIALOGUE_PATTERNS.some(pattern => pattern.test(originalText));
  const isEnhancedDialogue = DIALOGUE_PATTERNS.some(pattern => pattern.test(enhancedText));
  
  if (isOriginalDialogue || isEnhancedDialogue) {
    // Additional validation: must contain actual speech indicators
    if (originalText.includes('"') || originalText.includes('«') || originalText.includes('—') ||
        enhancedText.includes('"') || enhancedText.includes('«') || enhancedText.includes('—')) {
      return 'dialogue';
    }
  }
  
  // Grammar: punctuation, capitalization, small word changes
  if (/^[.,:;!?]/.test(originalText) || /^[.,:;!?]/.test(enhancedText) ||
      /^[A-Z]/.test(originalText) !== /^[A-Z]/.test(enhancedText)) {
    return 'grammar';
  }
  
  // Structure: sentence reorganization, paragraph changes
  if (originalText.includes('\n') || enhancedText.includes('\n') ||
      originalText.split(' ').length !== enhancedText.split(' ').length) {
    return 'structure';
  }
  
  // Default to style for word substitutions
  return 'style';
}

// Process and validate changes before storing
function processChanges(originalText: string, enhancedText: string) {
  const wordDiff = createWordLevelDiff(originalText, enhancedText);
  const validatedChanges = [];
  
  for (const change of wordDiff) {
    // Skip whitespace-only changes
    if (!change.originalText.trim() && !change.enhancedText.trim()) {
      continue;
    }
    
    // Validate positions with actual text
    const originalValid = !change.originalText || 
      validateChangePosition(originalText, change.originalStart, change.originalEnd, change.originalText);
    const enhancedValid = !change.enhancedText || 
      validateChangePosition(enhancedText, change.enhancedStart, change.enhancedEnd, change.enhancedText);
    
    if (!originalValid || !enhancedValid) {
      console.warn('Invalid change position detected, skipping:', change);
      continue;
    }
    
    // Calculate similarity for confidence scoring
    const similarity = calculateSimilarity(change.originalText, change.enhancedText);
    const confidence = Math.max(0.5, Math.min(1.0, 1 - similarity + 0.3)); // Boost confidence for validated changes
    
    const changeType = detectChangeType(change.originalText, change.enhancedText);
    
    validatedChanges.push({
      change_type: changeType,
      original_text: change.originalText,
      enhanced_text: change.enhancedText,
      position_start: change.originalStart,
      position_end: change.originalEnd,
      confidence_score: confidence
    });
  }
  
  console.log(`Processed ${wordDiff.length} raw changes, validated ${validatedChanges.length} changes`);
  return validatedChanges;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, chapterId, options = {} } = await req.json();
    
    if (!projectId || !chapterId) {
      throw new Error('Missing required parameters: projectId and chapterId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting chapter enhancement for:', { projectId, chapterId });

    // Get chapter content
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('content, title')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      throw new Error(`Failed to fetch chapter: ${chapterError?.message}`);
    }

    if (!chapter.content || chapter.content.trim().length === 0) {
      throw new Error('Chapter content is empty');
    }

    console.log('📖 Chapter loaded:', { title: chapter.title, contentLength: chapter.content.length });

    // Get or create refinement data
    let { data: refinementData, error: refinementError } = await supabase
      .from('refinement_data')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();

    if (refinementError || !refinementData) {
      console.log('🆕 Creating new refinement data');
      const { data: newRefinement, error: createError } = await supabase
        .from('refinement_data')
        .insert({
          chapter_id: chapterId,
          original_content: chapter.content,
          enhanced_content: '',
          refinement_status: 'in_progress'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create refinement data: ${createError.message}`);
      }
      refinementData = newRefinement;
    }

    // Update status to in_progress
    await supabase
      .from('refinement_data')
      .update({ refinement_status: 'in_progress' })
      .eq('id', refinementData.id);

    // Call OpenAI for enhancement
    console.log('🤖 Calling OpenAI for enhancement...');
    
    const enhancementPrompt = `You are a professional literary editor. Please enhance the following text while maintaining its original meaning and style. Focus on:

1. Grammar and punctuation improvements
2. Sentence structure and flow
3. Word choice and clarity
4. Maintaining the author's voice and style

Original text:
"""
${chapter.content}
"""

Please return only the enhanced text without any explanations or comments.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional literary editor. Return only the enhanced text without explanations.'
          },
          {
            role: 'user',
            content: enhancementPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiResult = await openaiResponse.json();
    const enhancedContent = openaiResult.choices[0]?.message?.content?.trim();

    if (!enhancedContent) {
      throw new Error('No enhanced content received from OpenAI');
    }

    console.log('✨ Enhancement completed:', { 
      originalLength: chapter.content.length, 
      enhancedLength: enhancedContent.length 
    });

    // Process and validate changes
    const changes = processChanges(chapter.content, enhancedContent);
    
    console.log('🔍 Changes processed:', { count: changes.length });

    // Update refinement data
    await supabase
      .from('refinement_data')
      .update({
        enhanced_content: enhancedContent,
        refinement_status: 'completed'
      })
      .eq('id', refinementData.id);

    // Clear existing changes and insert new ones
    await supabase
      .from('ai_change_tracking')
      .delete()
      .eq('refinement_id', refinementData.id);

    if (changes.length > 0) {
      const { error: changesError } = await supabase
        .from('ai_change_tracking')
        .insert(
          changes.map(change => ({
            refinement_id: refinementData.id,
            ...change,
            user_decision: 'pending'
          }))
        );

      if (changesError) {
        console.error('Error saving changes:', changesError);
        throw new Error(`Failed to save changes: ${changesError.message}`);
      }
    }

    console.log('✅ Enhancement completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chapter enhanced successfully',
        changesCount: changes.length,
        refinementId: refinementData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Enhancement error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Enhancement failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
