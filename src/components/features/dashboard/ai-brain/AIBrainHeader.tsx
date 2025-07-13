
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Loader2, RotateCcw, XCircle, Clock } from 'lucide-react';
import { AnalysisStatus } from '@/types/knowledge';

interface AIBrainHeaderProps {
  analysisStatus: AnalysisStatus;
  isAnalyzing: boolean;
  isRetrying: boolean;
  onAnalyzeProject: () => void;
  onRetryAnalysis: () => void;
  onCancelAnalysis: () => void;
  
}

export const AIBrainHeader = ({
  analysisStatus,
  isAnalyzing,
  isRetrying,
  onAnalyzeProject,
  onRetryAnalysis,
  onCancelAnalysis,
  
}: AIBrainHeaderProps) => {
  return (
    <>
      {/* Header with Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Brain</h3>
            <p className="text-sm text-slate-600">
              Intelligent story analysis with knowledge extraction
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {analysisStatus.hasErrors && analysisStatus.currentJob?.state === 'failed' && (
            <Button 
              onClick={onRetryAnalysis}
              disabled={isRetrying || analysisStatus.isProcessing}
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Retry
            </Button>
          )}
          
          {analysisStatus.isProcessing && (
            <Button 
              onClick={onCancelAnalysis}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          
          
          <Button
            onClick={onAnalyzeProject}
            disabled={analysisStatus.isProcessing || isAnalyzing || isRetrying}
            className="flex items-center space-x-2"
          >
            {(analysisStatus.isProcessing || isAnalyzing) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            <span>
              {analysisStatus.isProcessing ? 'Analyzing...' : 
               isAnalyzing ? 'Starting...' : 
               isRetrying ? 'Retrying...' : 'Analyze Project'}
            </span>
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {analysisStatus.isProcessing && analysisStatus.currentJob && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 animate-pulse text-blue-600" />
              <span className="font-medium text-blue-900">Analysis in Progress</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <Clock className="w-4 h-4" />
              <span>Processing Your Story</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">{analysisStatus.currentJob.current_step || 'Processing...'}</span>
              <span className="text-blue-700">{analysisStatus.currentJob.progress_percentage || 0}%</span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${analysisStatus.currentJob.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
