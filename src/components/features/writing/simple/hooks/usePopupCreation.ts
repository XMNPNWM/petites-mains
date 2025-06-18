
import { v4 as uuidv4 } from 'uuid';
import { SimplePopup } from '../types/popupTypes';
import { calculateSafePosition, calculateTextPosition, createInitialMessages } from '../utils/popupUtils';

export const usePopupCreation = () => {
  const createPopupData = (
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ): SimplePopup => {
    console.log('Creating popup with validated navigation data:', { 
      type, position, projectId, chapterId, selectedText, lineNumber,
      hasValidNavigation: !!(chapterId && lineNumber && lineNumber > 0)
    });

    const safePosition = calculateSafePosition(position, type);
    
    // Enhanced text position calculation - only when we have valid line number
    const textPosition = selectedText && lineNumber && lineNumber > 0 
      ? calculateTextPosition(selectedText, lineNumber)
      : null;

    const newPopup: SimplePopup = {
      id: uuidv4(),
      type,
      position: safePosition,
      projectId,
      chapterId,
      selectedText: selectedText || null,
      lineNumber: (lineNumber && lineNumber > 0) ? lineNumber : null,
      isMinimized: false,
      createdAt: new Date(),
      messages: createInitialMessages(type, selectedText, lineNumber),
      status: 'open',
      textPosition: textPosition
    };

    console.log('Created popup with final navigation data:', {
      id: newPopup.id,
      lineNumber: newPopup.lineNumber,
      textPosition: newPopup.textPosition,
      selectedText: newPopup.selectedText,
      chapterId: newPopup.chapterId,
      hasValidNavigation: !!(newPopup.chapterId && newPopup.lineNumber)
    });

    return newPopup;
  };

  return { createPopupData };
};
