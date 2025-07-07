
import React, { useState } from 'react';
import { Button } from './button';
import { Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FlagToggleButtonProps {
  isFlagged: boolean;
  onToggle: (isFlagged: boolean) => Promise<void>;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const FlagToggleButton = ({ 
  isFlagged, 
  onToggle, 
  size = 'sm',
  className 
}: FlagToggleButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(!isFlagged);
      toast({
        title: isFlagged ? "Unflagged" : "Flagged",
        description: isFlagged ? "Item removed from flagged list" : "Item added to flagged list for review",
        duration: 2000
      });
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: "Error",
        description: "Failed to update flag status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'p-1 h-auto',
        isFlagged 
          ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
        className
      )}
      title={isFlagged ? 'Remove flag' : 'Flag for review'}
    >
      <Flag className={cn(
        'w-4 h-4 transition-colors',
        isFlagged && 'fill-current'
      )} />
    </Button>
  );
};
