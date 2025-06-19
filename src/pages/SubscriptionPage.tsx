
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import SubscriptionHeader from '@/components/features/subscription/SubscriptionHeader';
import ManageSubscriptionButton from '@/components/features/subscription/ManageSubscriptionButton';
import SubscriptionPlans from '@/components/features/subscription/SubscriptionPlans';
import ContactSalesCard from '@/components/features/subscription/ContactSalesCard';

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

const SubscriptionPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      fetchUsageData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user?.id)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SubscriptionHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Unlock Your Writing Potential
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From beginners to professional authors, we have the perfect plan to help you create amazing stories.
          </p>
        </div>

        <ManageSubscriptionButton subscribed={subscriptionData?.subscribed || false} />

        <SubscriptionPlans subscriptionData={subscriptionData} usageData={usageData} />

        <ContactSalesCard />
      </div>
    </div>
  );
};

export default SubscriptionPage;
