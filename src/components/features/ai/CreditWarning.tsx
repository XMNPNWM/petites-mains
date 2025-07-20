import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CREDIT_COSTS, type CreditCosts } from '@/utils/creditUtils';

interface CreditWarningProps {
  operation: keyof CreditCosts;
  remainingCredits: number;
  onUpgrade?: () => void;
  showUpgrade?: boolean;
}

export const CreditWarning: React.FC<CreditWarningProps> = ({
  operation,
  remainingCredits,
  onUpgrade,
  showUpgrade = true
}) => {
  const requiredCredits = CREDIT_COSTS[operation];
  const hasEnoughCredits = remainingCredits >= requiredCredits;

  if (hasEnoughCredits) {
    return (
      <Alert className="border-blue-200 bg-blue-50 text-blue-900">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          This {operation.toLowerCase()} will use {requiredCredits} AI credit{requiredCredits > 1 ? 's' : ''}. 
          You have {remainingCredits} credit{remainingCredits !== 1 ? 's' : ''} remaining.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50 text-red-900">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          You need {requiredCredits} AI credit{requiredCredits > 1 ? 's' : ''} but only have {remainingCredits} remaining.
        </span>
        {showUpgrade && onUpgrade && (
          <Button 
            size="sm" 
            onClick={onUpgrade}
            className="ml-4"
          >
            Upgrade Plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default CreditWarning;