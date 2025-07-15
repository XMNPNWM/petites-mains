
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Minimize2, Maximize2, X, Trash2, Brain, Loader2 } from 'lucide-react';
import { GapAwareAnalysisOrchestrator } from '@/services/smart';
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  selectedText?: string;
  isMinimized: boolean;
  showDeleteConfirm?: boolean;
  projectId?: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMinimize: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

const ChatHeader = ({ 
  selectedText, 
  isMinimized, 
  showDeleteConfirm = false,
  projectId,
  onMouseDown, 
  onMinimize, 
  onClose,
  onDelete
}: ChatHeaderProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleTriggerAnalysis = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!projectId || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      console.log('🧠 Triggering analysis from chat popup for project:', projectId);
      
      const result = await GapAwareAnalysisOrchestrator.analyzeProject(projectId);
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: "Project analysis has been updated successfully",
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div 
      className="flex items-center justify-between p-4 border-b bg-blue-50 cursor-move"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-800">AI Chat</h3>
        {selectedText && (
          <span className="text-xs text-slate-500 truncate max-w-[200px]">
            "{selectedText}"
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        {projectId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTriggerAnalysis}
            disabled={isAnalyzing}
            className="h-8 w-8 p-0 hover:bg-purple-100"
            title="Trigger AI Analysis"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Brain className="w-4 h-4 text-purple-600" />
            )}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className={`h-8 w-8 p-0 ${
              showDeleteConfirm 
                ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                : 'hover:bg-red-100'
            }`}
            title={showDeleteConfirm ? "Click again to confirm deletion" : "Delete chat"}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMinimize();
          }}
          className="h-8 w-8 p-0 hover:bg-blue-100"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="h-8 w-8 p-0 hover:bg-red-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
