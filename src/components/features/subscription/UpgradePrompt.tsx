
import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  type: 'projects' | 'words' | 'worldbuilding' | 'ai-credits';
  currentTier: string;
  limit?: number;
  current?: number;
}

const UpgradePrompt = ({ type, currentTier, limit, current }: UpgradePromptProps) => {
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
        return {
          title: 'Word Limit Reached',
          description: `You've reached your limit of ${limit?.toLocaleString()} words on the ${currentTier} plan.`,
          suggestion: 'Upgrade to Une Main or Deux Mains for unlimited writing.'
        };
      case 'worldbuilding':
        return {
          title: 'Worldbuilding Limit Reached',
          description: `You've reached your limit of ${limit} worldbuilding elements on the ${currentTier} plan.`,
          suggestion: 'Upgrade to Une Main or Deux Mains for unlimited worldbuilding elements.'
        };
      case 'ai-credits':
        return {
          title: 'AI Credits Exhausted',
          description: 'You\'ve used all your AI credits for this month.',
          suggestion: 'AI credits reset monthly with your Deux Mains subscription.'
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
        <Button 
          onClick={() => navigate('/subscription')}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          View Plans
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
