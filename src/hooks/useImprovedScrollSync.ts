
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
  const lastSyncSource = useRef<string | null>(null);

  const handleScrollSync = useCallback((
    panelType: 'original' | 'enhanced' | 'changeTracking',
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => {
    // Prevent infinite scroll loops
    if (syncInProgress.current && lastSyncSource.current === panelType) {
      return;
    }

    syncInProgress.current = true;
    lastSyncSource.current = panelType;

    // Calculate scroll ratio (0 to 1) for the current panel
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const scrollRatio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    // Update the current panel's position
    setScrollPositions(prev => ({
      ...prev,
      [panelType]: scrollTop
    }));

    // Broadcast the scroll ratio to sync other panels
    const syncEvent = new CustomEvent('scrollSync', {
      detail: {
        sourcePanel: panelType,
        scrollRatio,
        sourceScrollTop: scrollTop
      }
    });
    
    window.dispatchEvent(syncEvent);

    // Reset sync flag after a brief delay
    setTimeout(() => {
      syncInProgress.current = false;
      lastSyncSource.current = null;
    }, 100);
  }, []);

  return {
    scrollPositions,
    handleScrollSync
  };
};
