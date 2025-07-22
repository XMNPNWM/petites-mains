
import { useState, useRef, useCallback } from 'react';

interface NavigationState {
  isNavigating: boolean;
  lastNavigationId: string | null;
  navigationType: 'auto' | 'manual' | 'click';
}

export const useNavigationState = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    lastNavigationId: null,
    navigationType: 'auto'
  });
  
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockRef = useRef<boolean>(false);

  const startNavigation = useCallback((type: 'auto' | 'manual' | 'click', id?: string) => {
    if (lockRef.current) {
      console.log('🧭 Navigation blocked - already in progress');
      return false;
    }

    console.log('🧭 Starting navigation:', { type, id });
    lockRef.current = true;
    
    setNavigationState({
      isNavigating: true,
      lastNavigationId: id || null,
      navigationType: type
    });

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    return true;
  }, []);

  const endNavigation = useCallback(() => {
    console.log('🧭 Ending navigation');
    
    navigationTimeoutRef.current = setTimeout(() => {
      lockRef.current = false;
      setNavigationState({
        isNavigating: false,
        lastNavigationId: null,
        navigationType: 'auto'
      });
    }, 500); // Debounce to prevent rapid retriggering
  }, []);

  const cleanup = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    lockRef.current = false;
  }, []);

  return {
    navigationState,
    startNavigation,
    endNavigation,
    cleanup
  };
};
