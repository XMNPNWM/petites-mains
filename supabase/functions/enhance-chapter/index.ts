import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { original, enhanced, refinementId } = await req.json()

    if (!original) {
      throw new Error('Original text required')
    }
    if (!enhanced) {
      throw new Error('Enhanced text required')
    }
    if (!refinementId) {
      throw new Error('Refinement ID required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 1. Track the number of changes
    const changeCount = await processChanges(original, enhanced, refinementId, supabaseClient);

    return new Response(
      JSON.stringify({
        changeCount: changeCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/**
 * Enhanced dialogue detection with more precise patterns
 */
function detectDialogueChanges(original: string, enhanced: string): boolean {
  // More restrictive dialogue patterns
  const dialoguePatterns = [
    /^["«].{10,}["»]$/m,           // Complete quoted dialogue (min 10 chars)
    /^—\s+[A-Z].{5,}[.!?]$/m,     // Proper em-dash dialogue with capitalization
    /^\s*["«][A-Z].{5,}[.!?]["»]/m // Quoted speech with proper structure
  ];

  // Check if either text matches actual dialogue patterns
  const originalIsDialogue = dialoguePatterns.some(pattern => pattern.test(original.trim()));
  const enhancedIsDialogue = dialoguePatterns.some(pattern => pattern.test(enhanced.trim()));

  // Additional validation for actual dialogue content
  const hasDialogueMarkers = /["«»"—]/.test(original) || /["«»"—]/.test(enhanced);
  const hasSpeechContext = /(said|asked|replied|whispered|shouted|murmured)/i.test(original + enhanced);
  
  return (originalIsDialogue || enhancedIsDialogue) && (hasDialogueMarkers || hasSpeechContext);
}

/**
 * Improved semantic analysis for better categorization
 */
function categorizeChange(original: string, enhanced: string): 'grammar' | 'structure' | 'dialogue' | 'style' {
  const origTrimmed = original.trim();
  const enhTrimmed = enhanced.trim();

  // Check for dialogue first with stricter validation
  if (detectDialogueChanges(origTrimmed, enhTrimmed)) {
    return 'dialogue';
  }

  // Grammar patterns (articles, pronouns, verb forms, contractions)
  const grammarPatterns = [
    /^(le|la|les|un|une|des|du|de|d')$/i,     // Articles
    /^(il|elle|ils|elles|je|tu|nous|vous)$/i, // Pronouns
    /^(c'|s'|d'|l'|m'|t'|n').*$/i,           // Contractions
    /.*(?:ait|era|ent|ant|é|ée|és|ées)$/i     // Verb endings
  ];

  const isGrammarChange = grammarPatterns.some(pattern => 
    pattern.test(origTrimmed) || pattern.test(enhTrimmed)
  );

  if (isGrammarChange) {
    return 'grammar';
  }

  // Structure changes (sentence reorganization, major rewrites)
  const wordCountDiff = Math.abs(origTrimmed.split(/\s+/).length - enhTrimmed.split(/\s+/).length);
  const lengthDiff = Math.abs(origTrimmed.length - enhTrimmed.length);
  
  if (wordCountDiff > 3 || lengthDiff > 20) {
    return 'structure';
  }

  // Default to style for other changes
  return 'style';
}

/**
 * Enhanced word-level diff with better alignment
 */
function createWordLevelDiff(original: string, enhanced: string) {
  const originalWords = original.split(/(\s+)/);
  const enhancedWords = enhanced.split(/(\s+)/);
  
  // Use a more sophisticated LCS algorithm for better alignment
  const lcs = longestCommonSubsequence(originalWords, enhancedWords);
  const changes: Array<{
    type: 'add' | 'remove' | 'modify';
    original_text: string;
    enhanced_text: string;
    position_start: number;
    position_end: number;
    change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  }> = [];

  let originalPos = 0;
  let enhancedPos = 0;
  let charPos = 0;

  // Process differences with character-level position tracking
  while (originalPos < originalWords.length || enhancedPos < enhancedWords.length) {
    const origWord = originalWords[originalPos] || '';
    const enhWord = enhancedWords[enhancedPos] || '';

    // Skip whitespace-only changes
    if (origWord.trim() === '' && enhWord.trim() === '') {
      charPos += Math.max(origWord.length, enhWord.length);
      originalPos++;
      enhancedPos++;
      continue;
    }

    if (originalPos >= originalWords.length) {
      // Addition
      const changeType = categorizeChange('', enhWord);
      changes.push({
        type: 'add',
        original_text: '',
        enhanced_text: enhWord,
        position_start: charPos,
        position_end: charPos,
        change_type: changeType
      });
      charPos += enhWord.length;
      enhancedPos++;
    } else if (enhancedPos >= enhancedWords.length) {
      // Removal
      const changeType = categorizeChange(origWord, '');
      changes.push({
        type: 'remove',
        original_text: origWord,
        enhanced_text: '',
        position_start: charPos,
        position_end: charPos + origWord.length,
        change_type: changeType
      });
      charPos += origWord.length;
      originalPos++;
    } else if (origWord !== enhWord) {
      // Modification
      const changeType = categorizeChange(origWord, enhWord);
      changes.push({
        type: 'modify',
        original_text: origWord,
        enhanced_text: enhWord,
        position_start: charPos,
        position_end: charPos + origWord.length,
        change_type: changeType
      });
      charPos += origWord.length;
      originalPos++;
      enhancedPos++;
    } else {
      // No change
      charPos += origWord.length;
      originalPos++;
      enhancedPos++;
    }
  }

  return changes.filter(change => {
    // Filter out meaningless micro-changes
    const textLength = Math.max(change.original_text.length, change.enhanced_text.length);
    return textLength > 1 && change.original_text.trim() !== change.enhanced_text.trim();
  });
}

/**
 * Longest Common Subsequence algorithm for better diff alignment
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): number[][] {
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

  return dp;
}

/**
 * Character-level position validation
 */
function validateChangePosition(text: string, start: number, end: number, expectedText: string): boolean {
  if (start < 0 || end > text.length || start > end) {
    return false;
  }
  
  const actualText = text.substring(start, end);
  return actualText === expectedText;
}

async function processChanges(original: string, enhanced: string, refinementId: string, supabase: any) {
  const changes = createWordLevelDiff(original, enhanced);
  
  // Validate and store only accurate changes
  const validChanges = changes.filter(change => {
    return validateChangePosition(original, change.position_start, change.position_end, change.original_text);
  });

  console.log(`Generated ${validChanges.length} validated changes out of ${changes.length} total changes`);

  // Store changes in database
  for (const change of validChanges) {
    const { error } = await supabase
      .from('ai_change_tracking')
      .insert({
        refinement_id: refinementId,
        change_type: change.change_type,
        original_text: change.original_text,
        enhanced_text: change.enhanced_text,
        position_start: change.position_start,
        position_end: change.position_end,
        user_decision: 'pending',
        confidence_score: calculateConfidenceScore(change)
      });

    if (error) {
      console.error('Error storing change:', error);
    }
  }

  return validChanges.length;
}

function calculateConfidenceScore(change: any): number {
  // More conservative confidence scoring
  let confidence = 0.7; // Start with moderate confidence

  // Boost confidence for clear grammatical improvements
  if (change.change_type === 'grammar') {
    confidence += 0.2;
  }

  // Reduce confidence for very short changes
  if (change.original_text.length < 3 && change.enhanced_text.length < 3) {
    confidence -= 0.3;
  }

  // Boost confidence for clear dialogue improvements
  if (change.change_type === 'dialogue' && change.original_text.length > 10) {
    confidence += 0.1;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}
