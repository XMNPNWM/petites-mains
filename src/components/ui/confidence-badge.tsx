
import React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  isUserModified?: boolean;
  className?: string;
}

export const ConfidenceBadge = ({ confidence, isUserModified = false, className }: ConfidenceBadgeProps) => {
  const percentage = Math.round(confidence * 100);
  
  // Determine color based on confidence level
  const getVariantAndColor = () => {
    if (isUserModified || confidence >= 0.99) {
      return { variant: 'default' as const, colorClass: 'bg-emerald-500 text-white border-emerald-500' };
    } else if (confidence >= 0.8) {
      return { variant: 'outline' as const, colorClass: 'bg-green-50 text-green-700 border-green-300' };
    } else if (confidence >= 0.6) {
      return { variant: 'outline' as const, colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-300' };
    } else {
      return { variant: 'outline' as const, colorClass: 'bg-red-50 text-red-700 border-red-300' };
    }
  };

  const { variant, colorClass } = getVariantAndColor();

  return (
    <Badge 
      variant={variant} 
      className={cn(
        'text-xs font-medium transition-colors',
        colorClass,
        className
      )}
    >
      {isUserModified ? '✓ 100%' : `${percentage}%`}
    </Badge>
  );
};
