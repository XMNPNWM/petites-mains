
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, MessageSquare, Edit, Type, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIChange {
  id: string;
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  confidence_score: number;
}

interface ChangeTrackingPanelProps {
  refinementId: string;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
}

const ChangeTrackingPanel = ({ refinementId, onChangeDecision }: ChangeTrackingPanelProps) => {
  const [changes, setChanges] = useState<AIChange[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refinementId) {
      fetchChanges();
    }
  }, [refinementId]);

  const fetchChanges = async () => {
    if (!refinementId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_change_tracking')
        .select('*')
        .eq('refinement_id', refinementId)
        .order('position_start');

      if (error) throw error;
      setChanges(data || []);
    } catch (error) {
      console.error('Error fetching changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'structure':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'dialogue':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'style':
        return <Palette className="w-4 h-4 text-orange-500" />;
      default:
        return <Type className="w-4 h-4 text-slate-500" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'bg-blue-100 text-blue-700';
      case 'structure':
        return 'bg-green-100 text-green-700';
      case 'dialogue':
        return 'bg-purple-100 text-purple-700';
      case 'style':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleDecision = async (changeId: string, decision: 'accepted' | 'rejected') => {
    onChangeDecision(changeId, decision);
    setChanges(prev => prev.map(change => 
      change.id === changeId 
        ? { ...change, user_decision: decision }
        : change
    ));
  };

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Change Tracking</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {changes.length} AI suggestions
        </p>
      </div>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">AI Modifications</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : changes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No changes to review</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className={`p-3 rounded-lg border ${
                    change.user_decision === 'accepted'
                      ? 'bg-green-50 border-green-200'
                      : change.user_decision === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getChangeIcon(change.change_type)}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-1 ${getChangeColor(change.change_type)}`}
                      >
                        {change.change_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      {Math.round(change.confidence_score * 100)}% confident
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-red-600">Original: </span>
                      <span className="text-slate-700">{change.original_text}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-600">Enhanced: </span>
                      <span className="text-slate-700">{change.enhanced_text}</span>
                    </div>
                  </div>
                  
                  {change.user_decision === 'pending' && (
                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(change.id, 'accepted')}
                        className="flex items-center space-x-1 text-green-600 hover:bg-green-50"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(change.id, 'rejected')}
                        className="flex items-center space-x-1 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeTrackingPanel;
