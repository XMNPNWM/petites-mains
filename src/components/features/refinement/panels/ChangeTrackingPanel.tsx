
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ChangeTrackingHeader from './components/ChangeTrackingHeader';
import ChangeList from './components/ChangeList';

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
  onChangeClick?: (change: AIChange) => void;
  scrollPosition?: number;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

// Type casting function to handle database type mismatches
const castToAIChange = (dbChange: any): AIChange => {
  const validChangeTypes = ['grammar', 'structure', 'dialogue', 'style'];
  const validDecisions = ['accepted', 'rejected', 'pending'];
  
  return {
    id: dbChange.id,
    change_type: validChangeTypes.includes(dbChange.change_type) ? dbChange.change_type : 'grammar',
    original_text: dbChange.original_text,
    enhanced_text: dbChange.enhanced_text,
    position_start: dbChange.position_start,
    position_end: dbChange.position_end,
    user_decision: validDecisions.includes(dbChange.user_decision) ? dbChange.user_decision : 'pending',
    confidence_score: dbChange.confidence_score || 0.5
  };
};

const ChangeTrackingPanel = ({ 
  refinementId, 
  onChangeDecision, 
  onChangeClick,
  scrollPosition = 0,
  onScrollSync
}: ChangeTrackingPanelProps) => {
  const [changes, setChanges] = useState<AIChange[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (refinementId) {
      fetchChanges();
    }
  }, [refinementId]);

  // Handle scroll synchronization
  useEffect(() => {
    if (scrollContainerRef.current && scrollPosition !== undefined) {
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollSync) {
      const target = e.currentTarget;
      onScrollSync(target.scrollTop, target.scrollHeight, target.clientHeight);
    }
  };

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
      
      // Cast database results to proper types
      const typedChanges = (data || []).map(castToAIChange);
      setChanges(typedChanges);
    } catch (error) {
      console.error('Error fetching changes:', error);
    } finally {
      setLoading(false);
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

  const handleChangeClick = (change: AIChange) => {
    if (onChangeClick) {
      onChangeClick(change);
    }
  };

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col">
      <ChangeTrackingHeader changesCount={changes.length} />
      
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">AI Modifications</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
            onScroll={handleScroll}
          >
            <ChangeList
              changes={changes}
              loading={loading}
              onChangeDecision={handleDecision}
              onChangeClick={handleChangeClick}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeTrackingPanel;
