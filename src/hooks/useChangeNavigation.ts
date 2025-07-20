
import { useState, useCallback } from 'react';
import { ChangeNavigationService } from '@/services/ChangeNavigationService';

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

interface NavigationState {
  selectedChangeId: string | null;
  highlightedRange: { start: number; end: number } | null;
  targetScrollPositions: {
    original: number;
    enhanced: number;
  };
}

export const useChangeNavigation = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    selectedChangeId: null,
    highlightedRange: null,
    targetScrollPositions: { original: 0, enhanced: 0 }
  });

  const navigateToChange = useCallback((
    change: AIChange,
    originalContent: string,
    enhancedContent: string,
    originalContainer?: HTMLElement | null,
    enhancedContainer?: HTMLElement | null
  ) => {
    console.log('🎯 Navigating to change:', change.id, change.change_type);

    // Create highlighted range
    const highlightedRange = ChangeNavigationService.createHighlightedRange(change);

    // Calculate scroll positions
    const originalScrollTop = originalContainer 
      ? ChangeNavigationService.calculateScrollPosition(originalContent, change.position_start, originalContainer)
      : 0;

    const enhancedScrollTop = enhancedContainer
      ? ChangeNavigationService.calculateScrollPosition(enhancedContent, change.position_start, enhancedContainer)
      : 0;

    setNavigationState({
      selectedChangeId: change.id,
      highlightedRange,
      targetScrollPositions: {
        original: originalScrollTop,
        enhanced: enhancedScrollTop
      }
    });

    console.log('📍 Navigation state updated:', {
      changeId: change.id,
      highlightedRange,
      originalScrollTop,
      enhancedScrollTop
    });
  }, []);

  const clearNavigation = useCallback(() => {
    setNavigationState({
      selectedChangeId: null,
      highlightedRange: null,
      targetScrollPositions: { original: 0, enhanced: 0 }
    });
  }, []);

  return {
    navigationState,
    navigateToChange,
    clearNavigation
  };
};
