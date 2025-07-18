
import { useState, useCallback, useRef } from 'react';

export interface TransitionState {
  isTransitioning: boolean;
  previousChapterId: string | null;
  currentChapterId: string | null;
  transitionStartTime: number | null;
}

export const useChapterTransition = () => {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    previousChapterId: null,
    currentChapterId: null,
    transitionStartTime: null
  });

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTransitionTime = 300; // Minimum time for smooth transition

  const startTransition = useCallback((fromChapterId: string | null, toChapterId: string) => {
    console.log('🔄 Starting chapter transition:', { from: fromChapterId, to: toChapterId });
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setTransitionState({
      isTransitioning: true,
      previousChapterId: fromChapterId,
      currentChapterId: toChapterId,
      transitionStartTime: Date.now()
    });

    // Ensure minimum transition time for smooth UX
    transitionTimeoutRef.current = setTimeout(() => {
      setTransitionState(prev => ({
        ...prev,
        isTransitioning: false,
        previousChapterId: null,
        transitionStartTime: null
      }));
    }, minTransitionTime);
  }, []);

  const completeTransition = useCallback(() => {
    console.log('✅ Completing chapter transition');
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setTransitionState(prev => ({
      ...prev,
      isTransitioning: false,
      previousChapterId: null,
      transitionStartTime: null
    }));
  }, []);

  const isTransitioningFrom = useCallback((chapterId: string) => {
    return transitionState.isTransitioning && transitionState.previousChapterId === chapterId;
  }, [transitionState]);

  const isTransitioningTo = useCallback((chapterId: string) => {
    return transitionState.isTransitioning && transitionState.currentChapterId === chapterId;
  }, [transitionState]);

  return {
    transitionState,
    startTransition,
    completeTransition,
    isTransitioningFrom,
    isTransitioningTo
  };
};
