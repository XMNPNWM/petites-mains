import React, { useState, useEffect } from 'react';
import {
  Brain,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Hash
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { ContentHashService } from '@/services/ContentHashService';
import { useJobManager } from '@/hooks/useJobManager';
import { supabase } from '@/integrations/supabase/client';

interface AIBrainPanelProps {
  projectId: string;
}

interface AnalysisStatus {
  isProcessing: boolean;
  lastProcessedAt: string | null;
  lowConfidenceFactsCount: number;
  errorCount: number;
  currentJob: any | null;
}

interface ContentHashStatus {
  hasOutdatedContent: boolean;
  chaptersNeedingAnalysis: number;
  statusDetails: { chapterId: string; title: string; reason: string }[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'character':
      return 'bg-purple-100 text-purple-800';
    case 'relationship':
      return 'bg-pink-100 text-pink-800';
    case 'plot_thread':
      return 'bg-orange-100 text-orange-800';
    case 'timeline_event':
      return 'bg-blue-100 text-blue-800';
    case 'world_building':
      return 'bg-green-100 text-green-800';
    case 'theme':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence > 0.75) {
    return 'text-green-600';
  } else if (confidence > 0.5) {
    return 'text-yellow-600';
  } else {
    return 'text-red-600';
  }
};

const AIBrainPanel = ({ projectId }: AIBrainPanelProps) => {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [flaggedKnowledge, setFlaggedKnowledge] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    lastProcessedAt: null,
    lowConfidenceFactsCount: 0,
    errorCount: 0,
    currentJob: null
  });
  const [contentHashStatus, setContentHashStatus] = useState<ContentHashStatus>({
    hasOutdatedContent: false,
    chaptersNeedingAnalysis: 0,
    statusDetails: []
  });
  const [hasNeverAnalyzed, setHasNeverAnalyzed] = useState(false);
  const jobManager = useJobManager();

  const fetchKnowledge = async () => {
    try {
      const [allKnowledge, flagged, status] = await Promise.all([
        SmartAnalysisOrchestrator.getProjectKnowledge(projectId),
        SmartAnalysisOrchestrator.getFlaggedKnowledge(projectId),
        jobManager.getProjectAnalysisStatus(projectId)
      ]);

      setKnowledge(allKnowledge);
      setFlaggedKnowledge(flagged);
      setAnalysisStatus(status);
      
      // Check if this project has never been analyzed
      const hasKnowledge = allKnowledge.length > 0;
      const hasProcessingJobs = status.isProcessing || status.lastProcessedAt;
      setHasNeverAnalyzed(!hasKnowledge && !hasProcessingJobs);
      
      console.log('Knowledge analysis state:', {
        knowledgeCount: allKnowledge.length,
        hasProcessingJobs,
        hasNeverAnalyzed: !hasKnowledge && !hasProcessingJobs
      });
      
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkContentHashStatus = async () => {
    try {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, content, title')
        .eq('project_id', projectId);

      if (!chapters) return;

      let chaptersNeedingAnalysis = 0;
      const statusDetails = [];

      for (const chapter of chapters) {
        if (chapter.content) {
          try {
            const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
            if (hashResult.hasChanges) {
              chaptersNeedingAnalysis++;
              statusDetails.push({
                chapterId: chapter.id,
                title: chapter.title,
                reason: hashResult.reason || 'Content modified'
              });
            }
          } catch (error) {
            console.error(`Hash check failed for chapter ${chapter.id}:`, error);
          }
        }
      }

      setContentHashStatus({
        hasOutdatedContent: chaptersNeedingAnalysis > 0,
        chaptersNeedingAnalysis,
        statusDetails
      });

      console.log('Content hash status:', {
        chaptersNeedingAnalysis,
        statusDetails
      });
    } catch (error) {
      console.error('Error checking content hash status:', error);
    }
  };

  const handleAnalyzeProject = async () => {
    try {
      setAnalysisStatus(prev => ({ ...prev, isProcessing: true }));
      console.log('🚀 Starting hash-aware unified project analysis for:', projectId);

      // Use the new hash-aware analysis architecture
      const result = await SmartAnalysisOrchestrator.analyzeProject(projectId);
      console.log('✅ Hash-aware unified analysis completed:', result);
      
      // Update the never analyzed flag
      setHasNeverAnalyzed(false);
      
      // Show success message with hash verification savings
      if (result.processingStats?.hashVerificationSaved) {
        console.log(`💰 Hash verification saved costs by skipping ${result.processingStats.chaptersSkipped} unchanged chapters`);
      }
      
      if (result.processingStats?.knowledgeExtracted > 0) {
        console.log(`🎉 Successfully extracted ${result.processingStats.knowledgeExtracted} knowledge items`);
      }
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchKnowledge();
        checkContentHashStatus();
      }, 1000);
    } catch (error) {
      console.error('❌ Error in hash-aware unified project analysis:', error);
      setAnalysisStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  useEffect(() => {
    fetchKnowledge();
    checkContentHashStatus();
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      jobManager.subscribeToProjectAnalysisStatus(projectId, (status) => {
        setAnalysisStatus(status);
      });

      return () => {
        jobManager.unsubscribeFromProjectAnalysisStatus(projectId);
      };
    }
  }, [projectId, jobManager]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Loading Knowledge...
              </p>
              <p className="text-sm text-blue-700">
                Fetching extracted knowledge and analysis status
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Brain</h3>
            <p className="text-sm text-slate-600">
              Extracted knowledge and insights from your story
            </p>
          </div>
        </div>

        <Button
          onClick={handleAnalyzeProject}
          disabled={analysisStatus.isProcessing}
          className="flex items-center space-x-2"
        >
          {analysisStatus.isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>
            {analysisStatus.isProcessing ? 'Analyzing...' : 
             hasNeverAnalyzed ? 'Start Analysis' : 'Analyze Project'}
          </span>
        </Button>
      </div>

      {/* Hash Verification Status - High Priority */}
      {contentHashStatus.hasOutdatedContent && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                Smart Analysis Ready
              </p>
              <p className="text-sm text-yellow-700">
                {contentHashStatus.chaptersNeedingAnalysis} chapter(s) have been modified since last analysis. 
                Hash verification will save costs by only analyzing changed content.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Initial Analysis Prompt */}
      {hasNeverAnalyzed && !analysisStatus.isProcessing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Ready to Analyze Your Project
              </p>
              <p className="text-sm text-blue-700">
                No analysis has been performed yet. Click "Start Analysis" to extract characters, relationships, plot threads, and themes from your story.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Status */}
      {analysisStatus.isProcessing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {analysisStatus.currentJob?.current_step || 'Performing hash-aware analysis...'}
              </p>
              <p className="text-sm text-blue-700">
                Using hash verification to optimize analysis and save costs
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-32 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisStatus.currentJob?.progress_percentage || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-blue-700">
                  {analysisStatus.currentJob?.progress_percentage || 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status Overview - Updated with hash verification info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Knowledge Facts</p>
              <p className="text-2xl font-bold text-green-600">{knowledge.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Low Confidence</p>
              <p className="text-2xl font-bold text-yellow-600">{analysisStatus.lowConfidenceFactsCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Flagged Issues</p>
              <p className="text-2xl font-bold text-red-600">{analysisStatus.errorCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Needs Analysis</p>
              <p className="text-2xl font-bold text-blue-600">{contentHashStatus.chaptersNeedingAnalysis}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* All Knowledge Display */}
      <div>
        <h4 className="text-md font-semibold text-slate-900 mb-3">Extracted Knowledge</h4>
        {knowledge.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">
              {hasNeverAnalyzed ? 'Ready to analyze your project' : 'No knowledge extracted yet'}
            </p>
            <p className="text-sm text-slate-500">
              {hasNeverAnalyzed 
                ? 'Click "Start Analysis" to extract insights from your story using smart hash verification'
                : 'Click "Analyze Project" to extract insights from your story'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {knowledge.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-slate-900">{item.name}</h5>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(item.confidence_score)}`}>
                        {Math.round(item.confidence_score * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                    {item.evidence && (
                      <p className="text-xs text-slate-500 italic">Evidence: {item.evidence}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBrainPanel;
