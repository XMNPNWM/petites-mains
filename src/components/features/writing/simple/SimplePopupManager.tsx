import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minus } from 'lucide-react';
import { usePopupCreation } from './hooks/usePopupCreation';
import { usePopupNavigation } from './hooks/usePopupNavigation';
import { useDragBehavior } from './hooks/useDragBehavior';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { Popup } from './types/popupTypes';
import SimpleChatPopup from './SimpleChatPopup';
import SimpleCommentBox from './SimpleCommentBox';

interface SimplePopupManagerProps {
  projectId: string;
  chapterId?: string;
  textContent: string;
  popups: Popup[];
  setPopups: React.Dispatch<React.SetStateAction<Popup[]>>;
  onTextSelect?: (selection: { text: string; range: Range }) => void;
}

const SimplePopupManager = ({ 
  projectId, 
  chapterId, 
  textContent, 
  popups, 
  setPopups,
  onTextSelect 
}: SimplePopupManagerProps) => {
  const { 
    contextMenuPosition, 
    showContextMenu, 
    handleTextSelection, 
    resetContextMenu 
  } = usePopupCreation(popups, setPopups, projectId, chapterId);

  const { 
    currentPopupIndex, 
    navigateToPopup, 
    getNavigationInfo 
  } = usePopupNavigation(popups);

  const {
    isDragging,
    dragOffset,
    handleMouseDown,
    handleGlobalMouseMove,
    handleGlobalMouseUp
  } = useDragBehavior();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleAnalyzeContent = async () => {
    if (!chapterId) return;
    
    try {
      setIsAnalyzing(true);
      await SmartAnalysisOrchestrator.analyzeChapter(projectId, chapterId);
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePopup = (id: string, updates: Partial<Popup>) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, ...updates } : popup
    ));
  };

  const removePopup = (id: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      handleTextSelection(e, selection);
      if (onTextSelect) {
        const range = selection.getRangeAt(0);
        onTextSelect({ text: selection.toString(), range });
      }
    }
  };

  return (
    <>
      <div onMouseUp={handleMouseUp}>
        {/* Content selection area */}
      </div>

      {/* Render popups */}
      {popups.map((popup) => (
        <div
          key={popup.id}
          style={{
            position: 'fixed',
            left: popup.position.x + (isDragging ? dragOffset.x : 0),
            top: popup.position.y + (isDragging ? dragOffset.y : 0),
            zIndex: 1000,
          }}
        >
          {popup.type === 'chat' ? (
            <SimpleChatPopup
              popup={popup}
              onUpdate={(updates) => updatePopup(popup.id, updates)}
              onRemove={() => removePopup(popup.id)}
              onMouseDown={handleMouseDown}
              projectId={projectId}
              chapterId={chapterId}
            />
          ) : (
            <SimpleCommentBox
              popup={popup}
              onUpdate={(updates) => updatePopup(popup.id, updates)}
              onRemove={() => removePopup(popup.id)}
              onMouseDown={handleMouseDown}
            />
          )}
        </div>
      ))}

      {/* Context menu */}
      {showContextMenu && contextMenuPosition && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Create chat popup logic here
              resetContextMenu();
            }}
          >
            Ask AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Create comment popup logic here
              resetContextMenu();
            }}
          >
            Add Comment
          </Button>
        </div>
      )}
    </>
  );
};

export default SimplePopupManager;
