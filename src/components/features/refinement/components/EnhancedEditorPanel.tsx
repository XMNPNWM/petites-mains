
import React from 'react';
import { Edit3, Download, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EditableSegmentedDisplay from './EditableSegmentedDisplay';
import { EnhancementService } from '@/services/EnhancementService';
import { RefinementData } from '@/types/shared';

interface EnhancedEditorPanelProps {
  projectId: string;
  chapterId: string;
  refinementData: RefinementData | null;
  onContentChange: (content: string) => void;
  onImportToCreation: () => void;
  onRefreshData: () => void;
  isEnhancing?: boolean; // NEW: Enhancement state
  startEnhancement?: () => void; // NEW: Start enhancement callback
  completeEnhancement?: () => void; // NEW: Complete enhancement callback
}

const EnhancedEditorPanel = ({
  projectId,
  chapterId,
  refinementData,
  onContentChange,
  onImportToCreation,
  onRefreshData,
  isEnhancing = false,
  startEnhancement,
  completeEnhancement
}: EnhancedEditorPanelProps) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleEnhancement = async () => {
    if (!refinementData || isProcessing || isEnhancing) return;
    
    setIsProcessing(true);
    
    // Start enhancement lock
    if (startEnhancement) {
      startEnhancement();
    }
    
    try {
      console.log('🚀 EnhancedEditorPanel: Starting enhancement process');
      
      await EnhancementService.enhanceChapter(
        projectId,
        chapterId,
        () => {
          console.log('✅ EnhancedEditorPanel: Enhancement completed, refreshing data');
          onRefreshData();
          
          // Complete enhancement lock
          if (completeEnhancement) {
            completeEnhancement();
          }
        }
      );
      
    } catch (error) {
      console.error('❌ EnhancedEditorPanel: Enhancement failed:', error);
      
      // Complete enhancement lock even on failure
      if (completeEnhancement) {
        completeEnhancement();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusInfo = () => {
    if (isProcessing || isEnhancing) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Enhancing...',
        variant: 'default' as const,
        color: 'text-blue-500'
      };
    }
    
    if (!refinementData) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'No data',
        variant: 'secondary' as const,
        color: 'text-slate-500'
      };
    }
    
    switch (refinementData.refinement_status) {
      case 'untouched':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Ready to enhance',
          variant: 'outline' as const,
          color: 'text-slate-500'
        };
      case 'in_progress':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Processing...',
          variant: 'default' as const,
          color: 'text-blue-500'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Enhanced',
          variant: 'default' as const,
          color: 'text-green-500'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Unknown',
          variant: 'secondary' as const,
          color: 'text-slate-500'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <Edit3 className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Enhanced Content</h3>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <span className={statusInfo.color}>{statusInfo.icon}</span>
            <span className={statusInfo.color}>{statusInfo.text}</span>
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnhancement}
            disabled={!refinementData || isProcessing || isEnhancing}
            className="flex items-center gap-2"
          >
            {isProcessing || isEnhancing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Edit3 className="h-4 w-4" />
            )}
            {isProcessing || isEnhancing ? 'Enhancing...' : 'Re-enhance'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onImportToCreation}
            disabled={!refinementData?.enhanced_content || isProcessing || isEnhancing}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Import to Creation
          </Button>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-hidden">
        <EditableSegmentedDisplay
          content={refinementData?.enhanced_content || ''}
          onContentChange={onContentChange}
          placeholder="Enhanced content will appear here after processing..."
          chapterKey={`enhanced-${chapterId}`}
          readOnly={isProcessing || isEnhancing} // Make read-only during enhancement
          isLoading={isProcessing || isEnhancing}
          isTransitioning={false}
        />
      </div>
    </div>
  );
};

export default EnhancedEditorPanel;
