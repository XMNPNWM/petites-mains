
import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scrollToLineEnhanced } from '../utils/navigationUtils';

export const usePopupNavigation = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const goToLine = useCallback(async (chapterId: string, lineNumber: number) => {
    console.log('Enhanced goToLine function called with validation:', { chapterId, lineNumber });
    
    // Input validation
    if (!chapterId || !lineNumber || lineNumber < 1) {
      console.error('Invalid navigation parameters:', { chapterId, lineNumber });
      return;
    }

    try {
      const currentPath = window.location.pathname;
      const targetPath = `/project/${projectId}/write/${chapterId}`;
      
      if (!currentPath.includes(chapterId)) {
        console.log('Navigating to different chapter:', targetPath);
        navigate(targetPath);
        
        // Wait for navigation and component mount, then scroll
        setTimeout(() => {
          scrollToLineEnhanced(lineNumber);
        }, 1000);
      } else {
        console.log('Already on target chapter, scrolling to line:', lineNumber);
        scrollToLineEnhanced(lineNumber);
      }
    } catch (error) {
      console.error('Error in enhanced goToLine:', error);
    }
  }, [projectId, navigate]);

  return { goToLine };
};
