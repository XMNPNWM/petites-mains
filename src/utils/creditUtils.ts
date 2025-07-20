import { supabase } from "@/integrations/supabase/client";

export interface CreditCheckResult {
  hasCredits: boolean;
  remainingCredits: number;
  errorMessage?: string;
}

export interface CreditCosts {
  CHAT: number;
  ENHANCEMENT: number;
  ANALYSIS: number;
}

export const CREDIT_COSTS: CreditCosts = {
  CHAT: 1,
  ENHANCEMENT: 2,
  ANALYSIS: 2,
};

/**
 * Check if user has enough credits for an operation
 */
export async function checkUserCredits(creditsNeeded: number): Promise<CreditCheckResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        hasCredits: false,
        remainingCredits: 0,
        errorMessage: "User not authenticated"
      };
    }

    const { data, error } = await supabase.rpc('get_user_ai_credits', {
      user_uuid: user.id
    });

    if (error) {
      console.error('Error checking credits:', error);
      return {
        hasCredits: false,
        remainingCredits: 0,
        errorMessage: "Failed to check credits"
      };
    }

    if (!data || data.length === 0) {
      return {
        hasCredits: false,
        remainingCredits: 0,
        errorMessage: "User credit data not found"
      };
    }

    const userCredits = data[0];
    const hasEnoughCredits = userCredits.credits_remaining >= creditsNeeded;

    return {
      hasCredits: hasEnoughCredits,
      remainingCredits: userCredits.credits_remaining,
      errorMessage: hasEnoughCredits ? undefined : `Insufficient credits. You need ${creditsNeeded} credits but only have ${userCredits.credits_remaining} remaining.`
    };
  } catch (error) {
    console.error('Error checking user credits:', error);
    return {
      hasCredits: false,
      remainingCredits: 0,
      errorMessage: "Failed to check credits"
    };
  }
}

/**
 * Get current user credit status
 */
export async function getUserCreditStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_user_ai_credits', {
      user_uuid: user.id
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Error getting user credit status:', error);
    return null;
  }
}

/**
 * Format credit cost message for UI
 */
export function formatCreditCostMessage(operation: keyof CreditCosts): string {
  const cost = CREDIT_COSTS[operation];
  const operationName = operation.toLowerCase();
  
  switch (operation) {
    case 'CHAT':
      return `This chat message will use ${cost} AI credit.`;
    case 'ENHANCEMENT':
      return `Chapter enhancement will use ${cost} AI credits.`;
    case 'ANALYSIS':
      return `AI analysis will use ${cost} AI credits.`;
    default:
      return `This operation will use ${cost} AI credit${cost > 1 ? 's' : ''}.`;
  }
}

/**
 * Get upgrade message for insufficient credits
 */
export function getUpgradeMessage(operation: keyof CreditCosts): string {
  const cost = CREDIT_COSTS[operation];
  return `You need ${cost} AI credit${cost > 1 ? 's' : ''} to use this feature. Upgrade your plan to get more credits.`;
}