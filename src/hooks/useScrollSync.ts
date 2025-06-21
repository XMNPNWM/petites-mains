
import { useState, useCallback } from 'react';
import { ScrollPositions } from '@/types/shared';

export const useScrollSync = () => {
  const [scrollPositions, setScrollPositions] = useState<ScrollPositions>({
    original: 0,
    enhanced: 0
  });

  const handleScrollSync = useCallback((
    panelType: 'original' | 'enhanced',
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => {
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    
    setScrollPositions(prev => ({
      ...prev,
      [panelType]: scrollTop,
      [panelType === 'original' ? 'enhanced' : 'original']: scrollTop
    }));
  }, []);

  return {
    scrollPositions,
    handleScrollSync
  };
};
