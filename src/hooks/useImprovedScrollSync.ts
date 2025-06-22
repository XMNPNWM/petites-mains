
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
  
  const lastSyncSource = useRef<string>('');
  const syncInProgress = useRef(false);

  const handleScrollSync = useCallback((
    panelType: 'original' | 'enhanced' | 'changeTracking',
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => {
    // Prevent infinite scroll loops
    if (syncInProgress.current || lastSyncSource.current === panelType) {
      return;
    }

    syncInProgress.current = true;
    lastSyncSource.current = panelType;

    // Calculate scroll ratio (0 to 1)
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // Update positions for all panels
    setScrollPositions(prev => {
      const newPositions = { ...prev };
      
      // Set the source panel position
      newPositions[panelType] = scrollTop;
      
      // Calculate proportional positions for other panels based on scroll ratio
      if (panelType !== 'original') {
        newPositions.original = scrollRatio * maxScroll;
      }
      if (panelType !== 'enhanced') {
        newPositions.enhanced = scrollRatio * maxScroll;
      }
      if (panelType !== 'changeTracking') {
        newPositions.changeTracking = scrollRatio * maxScroll;
      }
      
      return newPositions;
    });

    // Reset sync flags after a brief delay
    setTimeout(() => {
      syncInProgress.current = false;
      lastSyncSource.current = '';
    }, 50);
  }, []);

  return {
    scrollPositions,
    handleScrollSync
  };
};
