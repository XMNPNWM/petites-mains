
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SubscriptionPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 3 projects',
        'Basic writing tools',
        'Character management',
        'Basic worldbuilding',
        'Community support'
      ],
      current: true,
      buttonText: 'Current Plan',
      buttonVariant: 'secondary' as const
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'month',
      description: 'For serious writers',
      features: [
        'Unlimited projects',
        'Advanced writing tools',
        'AI writing assistant',
        'Advanced analytics',
        'Export to multiple formats',
        'Priority support',
        'Collaboration features'
      ],
      current: false,
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$29',
      period: 'month',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced permissions',
        'Custom integrations',
        'Dedicated support',
        'Custom training'
      ],
      current: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-slate-500">/{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
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
                  disabled={plan.current}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Need a custom solution?</h3>
            <p className="text-slate-600 mb-6">
              We offer custom plans for publishers, writing schools, and large organizations. 
              Contact us to discuss your specific needs.
            </p>
            <Button variant="outline">Contact Sales</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
