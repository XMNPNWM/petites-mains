
import { useState, useEffect, useCallback } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin bypass check
  const isAdmin = useCallback(() => {
    return user?.email === 'xmnp306@tutanota.com';
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    
    console.log('[SUBSCRIPTION] Checking subscription for user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      console.log('[SUBSCRIPTION] Subscription data received:', data);
      setSubscriptionData(data);
      setError(null);
    } catch (error) {
      console.error('[SUBSCRIPTION] Error checking subscription:', error);
      setError('Failed to load subscription data');
      // Set fallback data to prevent blocking
      setSubscriptionData({
        subscribed: false,
        subscription_tier: 'plume',
        subscription_end: null
      });
    }
  }, [user]);

  const fetchUsageData = useCallback(async () => {
    if (!user) return;
    
    console.log('[SUBSCRIPTION] Fetching usage data for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      const usageResult = data || {
        current_projects: 0,
        total_word_count: 0,
        worldbuilding_elements_count: 0,
        ai_credits_used: 0,
        ai_credits_limit: 0
      };
      
      console.log('[SUBSCRIPTION] Usage data received:', usageResult);
      setUsageData(usageResult);
    } catch (error) {
      console.error('[SUBSCRIPTION] Error fetching usage data:', error);
      // Set fallback data to prevent blocking
      setUsageData({
        current_projects: 0,
        total_word_count: 0,
        worldbuilding_elements_count: 0,
        ai_credits_used: 0,
        ai_credits_limit: 0
      });
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      console.log('[SUBSCRIPTION] Auth still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('[SUBSCRIPTION] No user, setting loading to false');
      setLoading(false);
      setSubscriptionData(null);
      setUsageData(null);
      return;
    }

    console.log('[SUBSCRIPTION] User authenticated, fetching subscription and usage data');
    
    const fetchData = async () => {
      try {
        await Promise.all([checkSubscription(), fetchUsageData()]);
      } catch (error) {
        console.error('[SUBSCRIPTION] Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, checkSubscription, fetchUsageData]);

  const canCreateProject = useCallback(() => {
    if (isAdmin()) return true;
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
  }, [subscriptionData, usageData, isAdmin]);

  const canAddWorldbuildingElement = useCallback(() => {
    if (isAdmin()) return true;
    if (!subscriptionData || !usageData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return usageData.worldbuilding_elements_count < 40;
      case 'une_main':
      case 'deux_mains':
      case 'enterprise':
        return true;
      default:
        return false;
    }
  }, [subscriptionData, usageData, isAdmin]);

  const canWriteMoreWords = useCallback((currentWordCount: number) => {
    if (isAdmin()) return true;
    if (!subscriptionData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return currentWordCount < 10000;
      case 'une_main':
      case 'deux_mains':
      case 'enterprise':
        return true;
      default:
        return false;
    }
  }, [subscriptionData, isAdmin]);

  const hasAICredits = useCallback(() => {
    if (isAdmin()) return true;
    if (!subscriptionData || !usageData) return false;
    
    const tier = subscriptionData.subscription_tier || 'plume';
    
    switch (tier) {
      case 'plume':
        return false; // No AI credits for Plume
      case 'une_main':
        return usageData.ai_credits_used < 50;
      case 'deux_mains':
        return usageData.ai_credits_used < 120;
      case 'enterprise':
        return true; // Enterprise has unlimited AI credits
      default:
        return false;
    }
  }, [subscriptionData, usageData, isAdmin]);

  return {
    subscriptionData,
    usageData,
    loading,
    error,
    checkSubscription,
    fetchUsageData,
    canCreateProject,
    canAddWorldbuildingElement,
    canWriteMoreWords,
    hasAICredits,
    isAdmin: isAdmin()
  };
};
