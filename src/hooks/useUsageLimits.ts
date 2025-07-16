import { useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { useToast } from './use-toast';

export const useUsageLimits = () => {
  const { 
    subscriptionData, 
    usageData, 
    canCreateProject, 
    canAddWorldbuildingElement, 
    canWriteMoreWords, 
    hasAICredits,
    isAdmin 
  } = useSubscription();
  const { toast } = useToast();

  const checkProjectLimit = useCallback(() => {
    if (isAdmin) return true;
    
    if (!canCreateProject()) {
      const tier = subscriptionData?.subscription_tier || 'plume';
      let limit: string;
      
      switch (tier) {
        case 'plume':
          limit = '1 project';
          break;
        case 'une_main':
          limit = '5 projects';
          break;
        default:
          limit = 'unlimited projects';
      }
      
      toast({
        title: "Project limit reached",
        description: `Your ${tier.replace('_', ' ')} plan allows ${limit}. Upgrade to create more projects.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [canCreateProject, subscriptionData, isAdmin, toast]);

  const checkWorldbuildingLimit = useCallback(() => {
    if (isAdmin) return true;
    
    if (!canAddWorldbuildingElement()) {
      const tier = subscriptionData?.subscription_tier || 'plume';
      
      if (tier === 'plume') {
        toast({
          title: "Worldbuilding element limit reached",
          description: `Your Plume plan allows 40 worldbuilding elements. You currently have ${usageData?.worldbuilding_elements_count || 0}. Upgrade to add unlimited elements.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Worldbuilding element limit reached",
          description: "Unable to add more worldbuilding elements at this time.",
          variant: "destructive"
        });
      }
      return false;
    }
    return true;
  }, [canAddWorldbuildingElement, subscriptionData, usageData, isAdmin, toast]);

  const checkWordLimit = useCallback((currentWordCount: number, additionalWords: number = 0) => {
    if (isAdmin) return true;
    
    if (!canWriteMoreWords(currentWordCount + additionalWords)) {
      const tier = subscriptionData?.subscription_tier || 'plume';
      
      if (tier === 'plume') {
        toast({
          title: "Word limit reached",
          description: `Your Plume plan allows 10,000 words. You currently have ${usageData?.total_word_count || 0} words. Upgrade for unlimited words.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Word limit reached",
          description: "Unable to add more words at this time.",
          variant: "destructive"
        });
      }
      return false;
    }
    return true;
  }, [canWriteMoreWords, subscriptionData, usageData, isAdmin, toast]);

  const checkAICreditsLimit = useCallback(() => {
    if (isAdmin) return true;
    
    if (!hasAICredits()) {
      const tier = subscriptionData?.subscription_tier || 'plume';
      
      switch (tier) {
        case 'plume':
          toast({
            title: "AI credits not available",
            description: "AI features are not included in the Plume plan. Upgrade to Une Main or Deux Mains to access AI assistance.",
            variant: "destructive"
          });
          break;
        case 'une_main':
          toast({
            title: "AI credits limit reached",
            description: `Your Une Main plan includes 50 AI credits per month. You've used ${usageData?.ai_credits_used || 0}/50 credits.`,
            variant: "destructive"
          });
          break;
        case 'deux_mains':
          toast({
            title: "AI credits limit reached",
            description: `Your Deux Mains plan includes 120 AI credits per month. You've used ${usageData?.ai_credits_used || 0}/120 credits.`,
            variant: "destructive"
          });
          break;
        default:
          toast({
            title: "AI credits not available",
            description: "Unable to use AI features at this time.",
            variant: "destructive"
          });
      }
      return false;
    }
    return true;
  }, [hasAICredits, subscriptionData, usageData, isAdmin, toast]);

  const getUsageSummary = useCallback(() => {
    if (!subscriptionData || !usageData) return null;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    return {
      tier,
      projects: {
        current: usageData.current_projects,
        limit: tier === 'plume' ? 1 : tier === 'une_main' ? 5 : -1,
        unlimited: tier !== 'plume' && tier !== 'une_main'
      },
      words: {
        current: usageData.total_word_count,
        limit: tier === 'plume' ? 10000 : -1,
        unlimited: tier !== 'plume'
      },
      worldbuilding: {
        current: usageData.worldbuilding_elements_count,
        limit: tier === 'plume' ? 40 : -1,
        unlimited: tier !== 'plume'
      },
      aiCredits: {
        current: usageData.ai_credits_used,
        limit: tier === 'plume' ? 0 : tier === 'une_main' ? 50 : tier === 'deux_mains' ? 120 : -1,
        unlimited: tier === 'enterprise'
      }
    };
  }, [subscriptionData, usageData]);

  return {
    checkProjectLimit,
    checkWorldbuildingLimit,
    checkWordLimit,
    checkAICreditsLimit,
    getUsageSummary,
    canCreateProject,
    canAddWorldbuildingElement,
    canWriteMoreWords,
    hasAICredits,
    isAdmin
  };
};