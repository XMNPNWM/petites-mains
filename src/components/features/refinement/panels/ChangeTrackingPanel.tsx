
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { EnhancementService } from '@/services/EnhancementService';
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
  const [dataIntegrity, setDataIntegrity] = useState<{
    isValid: boolean;
    batchId: string | null;
    lastEnhancementAt: string | null;
    changeCount: number;
    issues: string[];
  } | null>(null);
  const [currentRefinementStatus, setCurrentRefinementStatus] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ENHANCED: Update current refinement ID tracking with immediate data clearing
  useEffect(() => {
    if (refinementId && refinementId !== currentRefinementId && !isTransitioning) {
      setCurrentRefinementId(refinementId);
      // ENHANCED: Immediately clear previous data and reset integrity state
      setChanges([]);
      setDataIntegrity(null);
      setLoading(true);
      fetchChanges();
    }
  }, [refinementId, currentRefinementId, isTransitioning]);

  // ENHANCED: Clear data when enhancement starts with integrity reset
  useEffect(() => {
    if (loading) {
      setChanges([]);
      setDataIntegrity(null);
    }
  }, [loading]);

  // ENHANCED: Monitor refinement status changes to immediately clear stale data
  useEffect(() => {
    if (!refinementId) return;

    let isSubscribed = true;

    const monitorRefinementStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('chapter_refinements')
          .select('refinement_status, last_enhancement_at')
          .eq('id', refinementId)
          .single();

        if (error || !isSubscribed) return;

        const newStatus = data.refinement_status;
        
        if (currentRefinementStatus !== newStatus) {
          console.log('📊 ENHANCED: Refinement status changed:', {
            from: currentRefinementStatus,
            to: newStatus,
            refinementId
          });

          setCurrentRefinementStatus(newStatus);

          // CRITICAL: Clear data immediately when enhancement starts
          if (newStatus === 'in_progress' && currentRefinementStatus !== 'in_progress') {
            console.log('🧹 ENHANCED: Enhancement started - clearing stale change data immediately');
            setChanges([]);
            setDataIntegrity(null);
            setLoading(true);
          }
        }
      } catch (error) {
        console.warn('⚠️ ENHANCED: Error monitoring refinement status:', error);
      }
    };

    // Initial status check
    monitorRefinementStatus();

    // Set up periodic monitoring (every 2 seconds during active enhancement)
    const interval = setInterval(monitorRefinementStatus, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [refinementId, currentRefinementStatus]);

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
      console.log('🔍 ENHANCED: Fetching changes for refinement with data integrity validation:', refinementId);
      
      // ENHANCED: Validate data integrity before fetching
      const validation = await EnhancementService.validateChangeDataIntegrity(refinementId);
      setDataIntegrity(validation);
      
      if (!validation.isValid) {
        console.warn('⚠️ ENHANCED: Data integrity issues detected:', validation.issues);
        // Continue with fetch but log issues for debugging
      }
      
      // ENHANCED: Query with batch ID validation
      const { data, error } = await supabase
        .from('ai_change_tracking')
        .select(`
          *,
          original_position_start,
          original_position_end,
          enhanced_position_start,
          enhanced_position_end,
          semantic_similarity,
          semantic_impact,
          processing_batch_id,
          created_at_enhanced
        `)
        .eq('refinement_id', refinementId)
        .order('original_position_start', { nullsFirst: false });

      if (error) {
        console.error('💥 ENHANCED: Database query error:', error);
        throw error;
      }
      
      // ENHANCED: Filter changes by current batch ID if available
      let filteredData = data || [];
      if (validation.batchId && data) {
        const currentBatchChanges = data.filter(change => 
          change.processing_batch_id === validation.batchId
        );
        
        if (currentBatchChanges.length > 0) {
          filteredData = currentBatchChanges;
          console.log('✅ ENHANCED: Filtered to current batch changes:', {
            totalChanges: data.length,
            currentBatchChanges: currentBatchChanges.length,
            batchId: validation.batchId
          });
        } else {
          console.warn('⚠️ ENHANCED: No changes found for current batch, using all changes');
        }
      }
      
      console.log('📊 ENHANCED: Raw database response:', {
        recordCount: filteredData.length,
        sampleRecord: filteredData[0] || null,
        hasNewPositionColumns: filteredData[0]?.original_position_start !== undefined,
        batchId: validation.batchId,
        dataIntegrityValid: validation.isValid
      });
      
      // Cast database results to proper types
      const typedChanges = filteredData.map(castToAIChange);
      
      setChanges(typedChanges);
      
      console.log(`📊 ENHANCED: Loaded ${typedChanges.length} changes with enhanced validation`);
      
      if (typedChanges.length === 0) {
        console.warn('⚠️ ENHANCED: No changes found for refinement:', refinementId);
      }
    } catch (error) {
      console.error('💥 ENHANCED: Error fetching changes:', error);
      console.error('💥 ENHANCED: Error details:', {
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
          <CardTitle className="text-sm text-slate-700">
            AI Modifications
            {dataIntegrity && !dataIntegrity.isValid && (
              <span className="text-xs text-amber-600 ml-2" title={`Data integrity issues: ${dataIntegrity.issues.join(', ')}`}>
                ⚠️
              </span>
            )}
          </CardTitle>
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
