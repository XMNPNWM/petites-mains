
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Zap, Crown, Star } from 'lucide-react';

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Writing Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and upgrade when you're ready to unlock the full potential of your creativity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="text-center hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">$0</CardDescription>
              <CardDescription>Perfect to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Basic writing workspace</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Character & world builder</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Export to PDF/DOCX</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Limited AI suggestions</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="text-center hover:shadow-lg transition-all duration-200 border-primary relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">$12</CardDescription>
              <CardDescription>per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Unlimited AI suggestions</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  <span>Export to EPUB</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Start Pro Trial
              </Button>
            </CardContent>
          </Card>

          {/* Studio Plan */}
          <Card className="text-center hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Studio</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">Coming Soon</CardDescription>
              <CardDescription>For professional writers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Advanced publishing tools</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Custom branding</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Enhanced AI features</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
