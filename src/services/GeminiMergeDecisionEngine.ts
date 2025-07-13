import { supabase } from '@/integrations/supabase/client';

interface MergeDecision {
  action: 'merge' | 'discard' | 'keep_distinct';
  reason: string;
  mergedData?: any;
  confidence: number;
}

/**
 * Phase 3: Gemini-Powered Merge Decision Engine
 * Uses Gemini-2.5-flash to make intelligent merge decisions
 * Separate from the main analysis process
 */
export class GeminiMergeDecisionEngine {
  
  /**
   * Evaluate whether two items should be merged, discarded, or kept distinct
   */
  static async evaluateMerge(
    itemType: string,
    newItem: any,
    existingItem: any
  ): Promise<MergeDecision> {
    try {
      console.log(`🤖 Evaluating merge decision for ${itemType}`);
      
      const prompt = this.buildMergePrompt(itemType, newItem, existingItem);
      
      // Call a dedicated Gemini merge evaluation edge function
      const { data: result, error } = await supabase.functions.invoke('evaluate-merge', {
        body: {
          prompt,
          itemType,
          options: {
            temperature: 0.1, // Low temperature for consistent decisions
            maxTokens: 1000
          }
        }
      });
      
      if (error) {
        console.error('Error in Gemini merge evaluation:', error);
        // Default to keeping items distinct on error
        return {
          action: 'keep_distinct',
          reason: 'Error in AI evaluation - defaulting to keep distinct',
          confidence: 0.5
        };
      }
      
      if (result?.success && result.decision) {
        return {
          action: result.decision.action,
          reason: result.decision.reason,
          mergedData: result.decision.mergedData,
          confidence: result.decision.confidence || 0.7
        };
      }
      
      // Fallback decision
      return {
        action: 'keep_distinct',
        reason: 'Unable to parse AI decision - defaulting to keep distinct',
        confidence: 0.5
      };
    } catch (error) {
      console.error('Error in merge evaluation:', error);
      return {
        action: 'keep_distinct',
        reason: 'Exception in AI evaluation - defaulting to keep distinct',
        confidence: 0.5
      };
    }
  }
  
  /**
   * Build type-specific prompts for merge evaluation
   */
  private static buildMergePrompt(itemType: string, newItem: any, existingItem: any): string {
    const basePrompt = `You are an intelligent content analysis system responsible for making merge decisions.

CRITICAL RULES:
1. PRESERVE valuable information - never lose important details
2. ENHANCE existing data with new insights when beneficial
3. DISCARD only truly redundant information with no added value
4. When in doubt, choose to keep items distinct rather than merge

Analyze these two ${itemType} items and determine the best action:

NEW ITEM:
${JSON.stringify(newItem, null, 2)}

EXISTING ITEM:
${JSON.stringify(existingItem, null, 2)}

Respond with JSON in this exact format:
{
  "action": "merge|discard|keep_distinct",
  "reason": "Clear explanation of the decision",
  "confidence": 0.0-1.0,
  "mergedData": { /* only if action is 'merge' */ }
}

`;

    switch (itemType) {
      case 'character_relationship':
        return basePrompt + `
RELATIONSHIP-SPECIFIC GUIDANCE:
- MERGE if: Same characters with compatible relationship types (e.g., "friend" + "ally")
- MERGE if: Additional evidence or interactions enhance understanding
- DISCARD if: Exact duplicate with no new information
- KEEP_DISTINCT if: Different relationship dynamics or incompatible types

If merging, combine evidence, interactions, and take the highest relationship strength.`;

      case 'timeline_event':
        return basePrompt + `
TIMELINE EVENT-SPECIFIC GUIDANCE:
- MERGE if: Same event with additional details or context
- MERGE if: Sequential actions that form a complete sequence
- DISCARD if: Exact duplicate with no temporal or descriptive additions
- KEEP_DISTINCT if: Different events or significantly different perspectives

If merging, create a comprehensive event description combining all details.`;

      case 'plot_thread':
        return basePrompt + `
PLOT THREAD-SPECIFIC GUIDANCE:
- MERGE if: Same narrative thread with additional events or insights
- DISCARD if: Exact duplicate thread with no new events
- KEEP_DISTINCT if: Different threads or significantly different focus

If merging, combine key events and enhance the thread description.`;

      default:
        return basePrompt;
    }
  }
}
