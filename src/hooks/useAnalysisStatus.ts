import { useState, useEffect } from 'react';
import { AnalysisStatus } from '@/types/knowledge';
import { useJobManager } from '@/hooks/useJobManager';

export const useAnalysisStatus = (projectId: string) => {
  const { getProjectAnalysisStatus } = useJobManager();
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });

  useEffect(() => {
    const loadAnalysisStatus = async () => {
      const status = await getProjectAnalysisStatus(projectId);
      setAnalysisStatus(status);
    };
    loadAnalysisStatus();
  }, [projectId, getProjectAnalysisStatus]);

  const refreshAnalysisStatus = async () => {
    const status = await getProjectAnalysisStatus(projectId);
    setAnalysisStatus(status);
  };

  return {
    analysisStatus,
    refreshAnalysisStatus
  };
};