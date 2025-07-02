import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalysisJobManager } from '@/services/AnalysisJobManager';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { AnalysisStatus } from '@/types/knowledge';
import { useToast } from '@/hooks/use-toast';

interface AnalysisStatusIndicatorProps {
  projectId: string;
}

const AnalysisStatusIndicator = ({ projectId }: AnalysisStatusIndicatorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const jobManager = new AnalysisJobManager();

  const fetchStatus = async () => {
    try {
      console.log('🔄 Fetching analysis status for project:', projectId);
      const analysisStatus = await jobManager.getProjectAnalysisStatus(projectId);
      setStatus(analysisStatus);
      console.log('📊 Status updated:', {
        isProcessing: analysisStatus.isProcessing,
        hasErrors: analysisStatus.hasErrors,
        errorCount: analysisStatus.errorCount
      });
    } catch (error) {
      console.error('❌ Error fetching analysis status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates if processing - more frequent polling
    const interval = setInterval(() => {
      if (status.isProcessing) {
        fetchStatus();
      }
    }, 2000); // Poll every 2 seconds when processing

    return () => clearInterval(interval);
  }, [projectId, status.isProcessing]);

  const handleClick = () => {
    // Navigate to AI Brain tab (index 3)
    navigate(`/project/${projectId}?tab=3`);
  };

  const handleCancelAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!status.currentJob?.id) return;
    
    try {
      console.log('🚫 Cancelling analysis from indicator:', status.currentJob.id);
      await jobManager.cancelJob(status.currentJob.id);
      
      toast({
        title: "Analysis Cancelled",
        description: "The analysis job has been cancelled.",
      });
      
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error('❌ Error cancelling analysis:', error);
      toast({
        title: "Error",
        description: "Failed to cancel analysis",
        variant: "destructive"
      });
    }
  };

  const handleRetryAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsRetrying(true);
      console.log('🔄 Retrying analysis from indicator for project:', projectId);
      
      // Start new analysis
      await SmartAnalysisOrchestrator.analyzeProject(projectId);
      
      toast({
        title: "Analysis Restarted",
        description: "Project analysis has been restarted.",
      });
      
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error('❌ Error retrying analysis:', error);
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "Failed to retry analysis",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const formatProcessingTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s`;
    return `${Math.floor(diffSeconds / 3600)}h ${Math.floor((diffSeconds % 3600) / 60)}m`;
  };

  const getStatusIcon = () => {
    if (status.isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (status.hasErrors || status.errorCount > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getTooltipContent = () => {
    if (status.isProcessing) {
      return (
        <div className="text-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-blue-900">Analysis in Progress</p>
            {status.currentJob?.started_at && (
              <div className="flex items-center space-x-1 text-blue-700">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatProcessingTime(status.currentJob.started_at)}</span>
              </div>
            )}
          </div>
          {status.currentJob?.current_step && (
            <p className="text-blue-700 mb-2">{status.currentJob.current_step}</p>
          )}
          {status.currentJob?.progress_percentage !== undefined && (
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{status.currentJob.progress_percentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${status.currentJob.progress_percentage}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex space-x-1">
            <button
              onClick={handleCancelAnalysis}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded"
            >
              <XCircle className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      );
    }
    
    if (status.hasErrors || status.errorCount > 0) {
      return (
        <div className="text-sm">
          <p className="font-medium text-red-900">Issues Found</p>
          <p className="text-red-700 mb-2">
            {status.errorCount} flagged facts, {status.lowConfidenceFactsCount} low confidence
          </p>
          {status.currentJob?.state === 'failed' && status.currentJob.error_message && (
            <p className="text-xs text-red-600 mb-2">{status.currentJob.error_message}</p>
          )}
          <div className="flex space-x-1">
            <button
              onClick={handleRetryAnalysis}
              disabled={isRetrying}
              className="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              <span>Retry</span>
            </button>
          </div>
          <p className="text-xs text-red-600 mt-1">Click to review in AI Brain</p>
        </div>
      );
    }
    
    return (
      <div className="text-sm">
        <p className="font-medium text-green-900">Analysis Complete</p>
        <p className="text-green-700">No issues found</p>
        {status.lastProcessedAt && (
          <p className="text-xs text-green-600 mt-1">
            Last updated: {new Date(status.lastProcessedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="p-2 hover:bg-slate-100 relative"
      >
        {getStatusIcon()}
      </Button>
      
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50">
          {getTooltipContent()}
        </div>
      )}
    </div>
  );
};

export default AnalysisStatusIndicator;
