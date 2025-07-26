
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ChangeTrackingHeader from './components/ChangeTrackingHeader';
import ChangeList from './components/ChangeList';

import { AIChange } from '@/types/shared';

interface ChangeTrackingPanelProps {
  refinementId: string;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onChangeClick?: (change: AIChange) => void;
  scrollPosition?: number;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  chapterId?: string;
  chapterTitle?: string;
  isTransitioning?: boolean;
  selectedChangeId?: string | null;
  // Enhanced dual panel support
  onHighlightChange?: (change: AIChange, panelType: 'original' | 'enhanced') => void;
}

// Enhanced type casting function with dual position support and legacy detection
const castToAIChange = (dbChange: any): AIChange => {
  const validChangeTypes = ['grammar', 'structure', 'dialogue', 'style', 'insertion', 'deletion', 'replacement', 'capitalization', 'punctuation_correction', 'whitespace_adjustment'];
  const validDecisions = ['accepted', 'rejected', 'pending'];
  
  return {
    id: dbChange.id,
    change_type: validChangeTypes.includes(dbChange.change_type) ? dbChange.change_type : 'grammar',
    original_text: dbChange.original_text,
    enhanced_text: dbChange.enhanced_text,
    position_start: dbChange.original_position_start, // Map to new dual position system
    position_end: dbChange.original_position_end,
    user_decision: validDecisions.includes(dbChange.user_decision) ? dbChange.user_decision : 'pending',
    confidence_score: dbChange.confidence_score || 0.5,
    // Enhanced dual position tracking
    original_position_start: dbChange.original_position_start,
    original_position_end: dbChange.original_position_end,
    enhanced_position_start: dbChange.enhanced_position_start,
    enhanced_position_end: dbChange.enhanced_position_end,
    semantic_similarity: dbChange.semantic_similarity,
    semantic_impact: dbChange.semantic_impact
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
  isTransitioning = false,
  selectedChangeId = null,
  onHighlightChange
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
      console.log('🔍 PHASE 3: Fetching changes for refinement:', refinementId);
      
      // PHASE 3: Enhanced query with explicit column selection and error handling
      const { data, error } = await supabase
        .from('ai_change_tracking')
        .select(`
          *,
          original_position_start,
          original_position_end,
          enhanced_position_start,
          enhanced_position_end,
          semantic_similarity,
          semantic_impact
        `)
        .eq('refinement_id', refinementId)
        .order('original_position_start', { nullsFirst: false });

      if (error) {
        console.error('💥 PHASE 3: Database query error:', error);
        throw error;
      }
      
      console.log('📊 PHASE 3: Raw database response:', {
        recordCount: data?.length || 0,
        sampleRecord: data?.[0] || null,
        hasNewPositionColumns: data?.[0]?.original_position_start !== undefined
      });
      
      // Cast database results to proper types
      const typedChanges = (data || []).map(castToAIChange);
      
      setChanges(typedChanges);
      
      console.log(`📊 PHASE 3: Loaded ${typedChanges.length} changes with dual positions`);
      
      if (typedChanges.length === 0) {
        console.warn('⚠️ PHASE 3: No changes found for refinement:', refinementId);
      }
    } catch (error) {
      console.error('💥 PHASE 3: Error fetching changes:', error);
      console.error('💥 PHASE 3: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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
    if (isTransitioning) return;
    
    // Standard change click handling
    if (onChangeClick) {
      onChangeClick(change);
    }
    
    // Enhanced dual panel highlighting
    if (onHighlightChange) {
      // Highlight in both panels using dual positions
      onHighlightChange(change, 'original');
      onHighlightChange(change, 'enhanced');
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
              selectedChangeId={selectedChangeId}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeTrackingPanel;
