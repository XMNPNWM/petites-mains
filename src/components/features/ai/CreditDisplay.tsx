import React from 'react';
import { Zap } from 'lucide-react';
import { useUserCreditStatus } from '@/hooks/useUserCreditStatus';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditDisplayProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  showLabel = true, 
  size = 'md' 
}) => {
  const { creditStatus, loading, error } = useUserCreditStatus();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Zap className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <Skeleton className="h-4 w-12" />
      </div>
    );
  }

  if (error || !creditStatus) {
    return null;
  }

  const { credits_remaining, credits_limit } = creditStatus;
  const isLow = credits_remaining <= 2;

  return (
    <div className={`flex items-center gap-1 ${isLow ? 'text-orange-600' : 'text-muted-foreground'}`}>
      <Zap className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} ${isLow ? 'text-orange-600' : ''}`} />
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        {credits_remaining}
        {showLabel && (
          <span className="text-muted-foreground">
            /{credits_limit} credits
          </span>
        )}
      </span>
    </div>
  );
};

export default CreditDisplay;