
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface UsageData {
  current_projects: number;
  total_word_count: number;
  worldbuilding_elements_count: number;
  ai_credits_used: number;
  ai_credits_limit: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchUsageData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setUsageData(data || {
        current_projects: 0,
        total_word_count: 0,
        worldbuilding_elements_count: 0,
        ai_credits_used: 0,
        ai_credits_limit: 0
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([checkSubscription(), fetchUsageData()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const canCreateProject = () => {
    if (!subscriptionData || !usageData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return usageData.current_projects < 1;
      case 'une_main':
        return usageData.current_projects < 5;
      case 'deux_mains':
      case 'enterprise':
        return true;
      default:
        return false;
    }
  };

  const canAddWorldbuildingElement = () => {
    if (!subscriptionData || !usageData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return usageData.worldbuilding_elements_count < 20;
      case 'une_main':
      case 'deux_mains':
      case 'enterprise':
        return true;
      default:
        return false;
    }
  };

  const canWriteMoreWords = (currentWordCount: number) => {
    if (!subscriptionData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return currentWordCount < 2000;
      case 'une_main':
      case 'deux_mains':
      case 'enterprise':
        return true;
      default:
        return false;
    }
  };

  const hasAICredits = () => {
    if (!subscriptionData || !usageData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'deux_mains':
      case 'enterprise':
        return usageData.ai_credits_used < usageData.ai_credits_limit;
      default:
        return false;
    }
  };

  return {
    subscriptionData,
    usageData,
    loading,
    checkSubscription,
    fetchUsageData,
    canCreateProject,
    canAddWorldbuildingElement,
    canWriteMoreWords,
    hasAICredits
  };
};
