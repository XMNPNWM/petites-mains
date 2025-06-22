
import { useState, useCallback, useRef } from 'react';

interface ScrollPositions {
  original: number;
  enhanced: number;
  changeTracking: number;
}

export const useImprovedScrollSync = () => {
  const [scrollPositions, setScrollPositions] = useState<ScrollPositions>({
    original: 0,
    enhanced: 0,
    changeTracking: 0
  });
  
  const syncInProgress = useRef(false);

  const handleScrollSync = useCallback((
    panelType: 'original' | 'enhanced' | 'changeTracking',
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => {
    // Prevent infinite scroll loops
    if (syncInProgress.current) {
      return;
    }

    syncInProgress.current = true;

    // Calculate scroll ratio (0 to 1) for the current panel
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // Update positions - other panels will use this ratio with their own dimensions
    setScrollPositions(prev => ({
      ...prev,
      [panelType]: scrollTop
    }));

    // Broadcast the scroll ratio to other panels
    setTimeout(() => {
      if (panelType !== 'original') {
        setScrollPositions(prev => ({ ...prev, original: scrollRatio }));
      }
      if (panelType !== 'enhanced') {
        setScrollPositions(prev => ({ ...prev, enhanced: scrollRatio }));
      }
      if (panelType !== 'changeTracking') {
        setScrollPositions(prev => ({ ...prev, changeTracking: scrollRatio }));
      }
    }, 0);

    // Reset sync flag after a brief delay
    setTimeout(() => {
      syncInProgress.current = false;
    }, 50);
  }, []);

  return {
    scrollPositions,
    handleScrollSync
  };
};
