
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
  chapterId?: string;
  chapterTitle?: string;
  isTransitioning?: boolean;
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
  onScrollSync,
  chapterId,
  chapterTitle,
  isTransitioning = false
}: ChangeTrackingPanelProps) => {
  const [changes, setChanges] = useState<AIChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRefinementId, setCurrentRefinementId] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update current refinement ID tracking to prevent unnecessary fetches during transitions
  useEffect(() => {
    if (refinementId && refinementId !== currentRefinementId && !isTransitioning) {
      setCurrentRefinementId(refinementId);
      fetchChanges();
    }
  }, [refinementId, currentRefinementId, isTransitioning]);

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
    if (isTransitioning) return; // Prevent actions during transitions
    
    onChangeDecision(changeId, decision);
    setChanges(prev => prev.map(change => 
      change.id === changeId 
        ? { ...change, user_decision: decision }
        : change
    ));
  };

  const handleChangeClick = (change: AIChange) => {
    if (onChangeClick && !isTransitioning) {
      onChangeClick(change);
    }
  };

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col overflow-hidden">
      <ChangeTrackingHeader 
        changesCount={changes.length} 
        chapterId={chapterId}
        chapterTitle={chapterTitle}
      />
      
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm text-slate-700">AI Modifications</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0 overflow-hidden min-h-0">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
            onScroll={handleScroll}
            style={{ maxHeight: '100%' }}
          >
            <ChangeList
              changes={changes}
              loading={loading || isTransitioning}
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
