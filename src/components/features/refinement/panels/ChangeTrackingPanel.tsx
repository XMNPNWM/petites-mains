
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
  
  // Detect legacy data (missing enhanced position fields)
  const isLegacyData = !dbChange.original_position_start && !dbChange.enhanced_position_start;
  
  return {
    id: dbChange.id,
    change_type: validChangeTypes.includes(dbChange.change_type) ? dbChange.change_type : 'grammar',
    original_text: dbChange.original_text,
    enhanced_text: dbChange.enhanced_text,
    position_start: dbChange.position_start,
    position_end: dbChange.position_end,
    user_decision: validDecisions.includes(dbChange.user_decision) ? dbChange.user_decision : 'pending',
    confidence_score: dbChange.confidence_score || 0.5,
    // Enhanced dual position tracking
    original_position_start: dbChange.original_position_start,
    original_position_end: dbChange.original_position_end,
    enhanced_position_start: dbChange.enhanced_position_start,
    enhanced_position_end: dbChange.enhanced_position_end,
    semantic_similarity: dbChange.semantic_similarity,
    semantic_impact: dbChange.semantic_impact,
    is_legacy_data: isLegacyData
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
  const [legacyDataCount, setLegacyDataCount] = useState(0);
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
        .order('position_start');

      if (error) throw error;
      
      // Cast database results to proper types and count legacy data
      const typedChanges = (data || []).map(castToAIChange);
      const legacyCount = typedChanges.filter(change => change.is_legacy_data).length;
      
      setChanges(typedChanges);
      setLegacyDataCount(legacyCount);
      
      console.log(`📊 Loaded ${typedChanges.length} changes, ${legacyCount} legacy`, {
        total: typedChanges.length,
        legacy: legacyCount,
        enhanced: typedChanges.length - legacyCount
      });
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
    if (isTransitioning) return;
    
    // Standard change click handling
    if (onChangeClick) {
      onChangeClick(change);
    }
    
    // Enhanced dual panel highlighting
    if (onHighlightChange) {
      // Highlight in both panels if enhanced positions are available
      if (change.original_position_start !== undefined) {
        onHighlightChange(change, 'original');
      }
      if (change.enhanced_position_start !== undefined) {
        onHighlightChange(change, 'enhanced');
      }
    }
  };

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col overflow-hidden">
      <ChangeTrackingHeader 
        changesCount={changes.length} 
        chapterId={chapterId}
        chapterTitle={chapterTitle}
      />
      
      {/* Legacy data warning */}
      {legacyDataCount > 0 && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <span className="font-medium">⚠️ Legacy Data Detected</span>
          </div>
          <p className="text-amber-700 text-xs mt-1">
            {legacyDataCount} change(s) use older position tracking. Advanced navigation features may be limited for these changes.
          </p>
        </div>
      )}
      
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
