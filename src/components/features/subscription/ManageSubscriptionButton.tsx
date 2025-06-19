
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManageSubscriptionButtonProps {
  subscribed: boolean;
}

const ManageSubscriptionButton = ({ subscribed }: ManageSubscriptionButtonProps) => {
  const { toast } = useToast();

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

  if (!subscribed) return null;

  return (
    <div className="mb-8 text-center">
      <Button onClick={handleManageSubscription} variant="outline">
        Manage Subscription
      </Button>
    </div>
  );
};

export default ManageSubscriptionButton;
