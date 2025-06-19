
import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AICreditBooster = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-ai-credits');
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error purchasing AI credits:', error);
      toast({
        title: "Error",
        description: "Failed to start AI credits purchase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Card className="max-w-md mx-auto border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-6 h-6 text-purple-600 mr-2" />
            <CardTitle className="text-xl text-purple-800">AI Credit Booster</CardTitle>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            $3<span className="text-sm font-normal text-purple-600">/40 credits</span>
          </div>
          <CardDescription className="text-purple-700">
            Get extra AI assistance when you need it most
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-purple-700 mb-4">
              Perfect for when you've used up your monthly credits but need more AI help to finish your project.
            </p>
            <div className="bg-white/60 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-600 font-medium">
                • 40 AI credits = 40 AI messages
                <br />
                • One-time purchase, no subscription
                <br />
                • Credits added instantly to your account
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            onClick={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Processing...' : 'Buy AI Credits'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICreditBooster;
