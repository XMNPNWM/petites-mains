
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProcessingJobService } from '@/services/ProcessingJobService';
import { AnalysisStatus } from '@/types/knowledge';

interface AnalysisStatusIndicatorProps {
  projectId: string;
}

const AnalysisStatusIndicator = ({ projectId }: AnalysisStatusIndicatorProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchStatus = async () => {
    try {
      const analysisStatus = await ProcessingJobService.getProjectAnalysisStatus(projectId);
      setStatus(analysisStatus);
    } catch (error) {
      console.error('Error fetching analysis status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates if processing
    const interval = setInterval(() => {
      if (status.isProcessing) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId, status.isProcessing]);

  const handleClick = () => {
    // Navigate to AI Brain tab (index 3)
    navigate(`/project/${projectId}?tab=3`);
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
          <p className="font-medium text-blue-900">Analysis in Progress</p>
          {status.currentJob?.current_step && (
            <p className="text-blue-700">{status.currentJob.current_step}</p>
          )}
        </div>
      );
    }
    
    if (status.hasErrors || status.errorCount > 0) {
      return (
        <div className="text-sm">
          <p className="font-medium text-red-900">Issues Found</p>
          <p className="text-red-700">
            {status.errorCount} flagged facts, {status.lowConfidenceFactsCount} low confidence
          </p>
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
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50">
          {getTooltipContent()}
        </div>
      )}
    </div>
  );
};

export default AnalysisStatusIndicator;
