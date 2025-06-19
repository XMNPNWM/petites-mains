
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'plume',
      name: 'Plume',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 1 project',
        'Up to 2,000 words',
        'Up to 20 worldbuilding elements',
        'Basic writing tools',
        'Character management',
        'Community support'
      ],
      limits: {
        projects: 1,
        words: 2000,
        worldbuilding: 20
      },
      buttonText: 'Current Plan',
      buttonVariant: 'secondary' as const,
      isFree: true
    },
    {
      id: 'une_main',
      name: 'Une Main',
      price: '$5',
      period: 'month',
      description: 'For dedicated writers',
      features: [
        'Up to 5 projects',
        'Unlimited words',
        'Unlimited worldbuilding elements',
        '50 AI credits per month',
        'AI writing assistant',
        'Advanced writing tools',
        'Export features',
        'Priority support'
      ],
      limits: {
        projects: 5,
        words: -1, // unlimited
        worldbuilding: -1, // unlimited
        aiCredits: 50
      },
      buttonText: 'Upgrade to Une Main',
      buttonVariant: 'default' as const,
      popular: true,
      priceId: 'price_une_main'
    },
    {
      id: 'deux_mains',
      name: 'Deux Mains',
      price: '$10',
      period: 'month',
      description: 'For professional writers',
      features: [
        'Unlimited projects',
        'Unlimited words',
        'Unlimited worldbuilding elements',
        '100 AI credits per month',
        'AI writing assistant',
        'Advanced analytics',
        'Collaboration features',
        'Priority support'
      ],
      limits: {
        projects: -1, // unlimited
        words: -1, // unlimited
        worldbuilding: -1, // unlimited
        aiCredits: 100
      },
      buttonText: 'Upgrade to Deux Mains',
      buttonVariant: 'default' as const,
      priceId: 'price_deux_mains'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and organizations',
      features: [
        'Everything in Deux Mains',
        'Custom AI credit limits',
        'Team collaboration',
        'Advanced permissions',
        'Custom integrations',
        'Dedicated support',
        'Custom training'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
      isEnterprise: true
    }
  ];

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

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!user) return;
    
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive"
      });
    }
  };

  const getCurrentPlan = () => {
    if (!subscriptionData?.subscribed) return 'plume';
    return subscriptionData.subscription_tier || 'plume';
  };

  const getUsageDisplay = (planId: string) => {
    if (!usageData) return null;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan?.limits) return null;

    const usage = [];
    
    if (plan.limits.projects > 0) {
      usage.push(`${usageData.current_projects}/${plan.limits.projects} projects`);
    }
    
    if (plan.limits.words > 0) {
      usage.push(`${usageData.total_word_count}/${plan.limits.words} words`);
    }
    
    if (plan.limits.worldbuilding > 0) {
      usage.push(`${usageData.worldbuilding_elements_count}/${plan.limits.worldbuilding} elements`);
    }
    
    if (plan.limits.aiCredits) {
      usage.push(`${usageData.ai_credits_used}/${plan.limits.aiCredits} AI credits`);
    }

    return usage.length > 0 ? usage.join(' • ') : null;
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

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
              <p className="text-slate-600">Choose the plan that fits your writing needs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Unlock Your Writing Potential
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From beginners to professional authors, we have the perfect plan to help you create amazing stories.
          </p>
        </div>

        {subscriptionData?.subscribed && (
          <div className="mb-8 text-center">
            <Button onClick={handleManageSubscription} variant="outline">
              Manage Subscription
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const usage = getUsageDisplay(plan.id);
            
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''} ${isCurrent ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                )}
                
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                    Your Plan
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {!plan.isEnterprise && <span className="text-sm font-normal text-slate-500">/{plan.period}</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  {usage && (
                    <div className="text-xs text-slate-600 bg-slate-100 p-2 rounded">
                      {usage}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.buttonVariant === 'default' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
                    variant={plan.buttonVariant}
                    disabled={isCurrent || checkoutLoading === plan.id}
                    onClick={() => {
                      if (plan.isEnterprise) {
                        window.location.href = 'mailto:contact@example.com';
                      } else if (!plan.isFree && !isCurrent) {
                        handleCheckout(plan.priceId!, plan.id);
                      }
                    }}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrent ? 'Current Plan' : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Need a custom solution?</h3>
            <p className="text-slate-600 mb-6">
              We offer custom plans for publishers, writing schools, and large organizations. 
              Contact us to discuss your specific needs.
            </p>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:contact@example.com'}>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
