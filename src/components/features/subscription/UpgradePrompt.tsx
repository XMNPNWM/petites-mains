
import React from 'react';
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  type: 'projects' | 'words' | 'worldbuilding' | 'ai-credits';
  currentTier: string;
  limit?: number;
  current?: number;
}

const UpgradePrompt = ({ type, currentTier, limit }: UpgradePromptProps) => {
  const navigate = useNavigate();

  const getPromptContent = () => {
    switch (type) {
      case 'projects':
        return {
          title: 'Project Limit Reached',
          description: `You've reached your limit of ${limit} project${limit !== 1 ? 's' : ''} on the ${currentTier} plan.`,
          suggestion: 'Upgrade to Une Main for 5 projects or Deux Mains for unlimited projects.'
        };
      case 'words':
        if (currentTier === 'plume') {
          return {
            title: 'Word Limit Reached',
            description: `You've reached your limit of ${limit?.toLocaleString()} words on the ${currentTier} plan.`,
            suggestion: 'Upgrade to Une Main or Deux Mains for unlimited writing.'
          };
        }
        return {
          title: 'Word Limit Reached',
          description: `You've reached your word limit on the ${currentTier} plan.`,
          suggestion: 'Upgrade for unlimited writing.'
        };
      case 'worldbuilding':
        if (currentTier === 'plume') {
          return {
            title: 'Worldbuilding Limit Reached',
            description: `You've reached your limit of ${limit} worldbuilding elements on the ${currentTier} plan.`,
            suggestion: 'Upgrade to Une Main or Deux Mains for unlimited worldbuilding elements.'
          };
        }
        return {
          title: 'Worldbuilding Limit Reached',
          description: `You've reached your worldbuilding limit on the ${currentTier} plan.`,
          suggestion: 'Upgrade for unlimited worldbuilding elements.'
        };
      case 'ai-credits':
        return {
          title: 'AI Credits Exhausted',
          description: currentTier === 'plume' 
            ? 'You\'ve used all 15 AI credits for this month.'
            : 'You\'ve used all your AI credits for this month.',
          suggestion: currentTier === 'plume'
            ? 'Upgrade to Une Main (50 credits) or Deux Mains (120 credits) for more AI assistance.'
            : 'Upgrade for more monthly credits or get an AI Credit Booster for $5.'
        };
      default:
        return {
          title: 'Upgrade Required',
          description: 'You\'ve reached a limit on your current plan.',
          suggestion: 'Consider upgrading for more features.'
        };
    }
  };

  const content = getPromptContent();

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-800">{content.title}</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          {content.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-orange-700 mb-4">{content.suggestion}</p>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/subscription')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          {type === 'ai-credits' && currentTier !== 'plume' && (
            <Button 
              onClick={() => navigate('/subscription')}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              Credit Booster
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
