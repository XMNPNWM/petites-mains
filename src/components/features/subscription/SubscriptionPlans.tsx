import React, { useState } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface SubscriptionPlansProps {
  subscriptionData: SubscriptionData | null;
  usageData: UsageData | null;
}

const SubscriptionPlans = ({ subscriptionData, usageData }: SubscriptionPlansProps) => {
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleContactSales = () => {
    // Create a hidden mailto link to avoid exposing email in UI
    const email = 'xmnp306@tutanota.com';
    const subject = 'Enterprise Plan Inquiry';
    const body = 'Hello,\n\nI am interested in learning more about the Enterprise plan.\n\nPlease let me know the best time to connect.\n\nThank you!';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const plans = [
    {
      id: 'plume',
      name: 'Plume',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 1 project',
        'Up to 10,000 words',
        'Up to 40 worldbuilding elements',
        'Advanced writing tools',
        'Character management'
      ],
      limits: {
        projects: 1,
        words: 10000,
        worldbuilding: 40
      },
      buttonText: 'Current Plan',
      buttonVariant: 'secondary' as const,
      isFree: true
    },
    {
      id: 'une_main',
      name: 'Une Main',
      price: '$7',
      period: 'month',
      description: 'For dedicated writers',
      features: [
        'Up to 5 projects',
        'Unlimited words',
        'Unlimited worldbuilding elements',
        '50 AI credits per month',
        'Advanced writing tools',
        'Export features'
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
      price: '$12',
      period: 'month',
      description: 'For professional writers',
      features: [
        'Unlimited projects',
        'Unlimited words',
        'Unlimited worldbuilding elements',
        '120 AI credits per month',
        'Advanced writing tools',
        'Advanced analytics'
      ],
      limits: {
        projects: -1, // unlimited
        words: -1, // unlimited
        worldbuilding: -1, // unlimited
        aiCredits: 120
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
        'Priority support'
      ],
      limits: {
        projects: -1, // unlimited
        words: -1, // unlimited
        worldbuilding: -1, // unlimited
        aiCredits: -1 // unlimited
      },
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
      isEnterprise: true
    }
  ];

  const getCurrentPlan = () => {
    if (!subscriptionData?.subscribed) return 'plume';
    return subscriptionData.subscription_tier || 'plume';
  };

  const getUsageDisplay = (planId: string) => {
    if (!usageData) return null;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan?.limits) return null;

    const usage = [];
    
    // For enterprise tier, show unlimited
    if (planId === 'enterprise') {
      return 'Unlimited usage';
    }
    
    if (plan.limits.projects > 0) {
      usage.push(`${usageData.current_projects}/${plan.limits.projects} projects`);
    } else if (plan.limits.projects === -1) {
      usage.push(`${usageData.current_projects} projects (unlimited)`);
    }
    
    if (plan.limits.words > 0) {
      usage.push(`${usageData.total_word_count.toLocaleString()}/${plan.limits.words.toLocaleString()} words`);
    } else if (plan.limits.words === -1) {
      usage.push(`${usageData.total_word_count.toLocaleString()} words (unlimited)`);
    }
    
    if (plan.limits.worldbuilding > 0) {
      usage.push(`${usageData.worldbuilding_elements_count}/${plan.limits.worldbuilding} elements`);
    } else if (plan.limits.worldbuilding === -1) {
      usage.push(`${usageData.worldbuilding_elements_count} elements (unlimited)`);
    }
    
    if (plan.limits.aiCredits && plan.limits.aiCredits > 0) {
      usage.push(`${usageData.ai_credits_used}/${plan.limits.aiCredits} AI credits`);
    } else if (plan.limits.aiCredits === -1) {
      usage.push(`${usageData.ai_credits_used} AI credits (unlimited)`);
    }

    return usage.length > 0 ? usage.join(' • ') : null;
  };

  const handleCheckout = async (priceId: string, planId: string) => {
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

  const currentPlan = getCurrentPlan();

  return (
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
                    handleContactSales();
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
  );
};

export default SubscriptionPlans;
