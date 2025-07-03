import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, CheckCircle, Loader2, RefreshCw, Hash } from 'lucide-react';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { AnalysisJobManager } from '@/services/AnalysisJobManager';
import { ContentHashService } from '@/services/ContentHashService';
import { KnowledgeBase, AnalysisStatus } from '@/types/knowledge';
import { supabase } from '@/integrations/supabase/client';

interface AIBrainPanelProps {
  projectId: string;
}

const AIBrainPanel = ({ projectId }: AIBrainPanelProps) => {
  const [knowledge, setKnowledge] = useState<KnowledgeBase[]>([]);
  const [flaggedKnowledge, setFlaggedKnowledge] = useState<KnowledgeBase[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [contentHashStatus, setContentHashStatus] = useState<{
    hasOutdatedContent: boolean;
    chaptersNeedingAnalysis: number;
  }>({
    hasOutdatedContent: false,
    chaptersNeedingAnalysis: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasNeverAnalyzed, setHasNeverAnalyzed] = useState(false);
  
  const jobManager = new AnalysisJobManager();

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
      // Get all project chapters
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title, content')
        .eq('project_id', projectId);

      if (!chapters || chapters.length === 0) {
        setContentHashStatus({
          hasOutdatedContent: false,
          chaptersNeedingAnalysis: 0
        });
        return;
      }

      let outdatedCount = 0;

      // Check hash status for each chapter
      for (const chapter of chapters) {
        try {
          if (chapter.content) {
            const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
            if (hashResult.hasChanges) {
              outdatedCount++;
            }
          }
        } catch (error) {
          console.error(`Hash check failed for chapter ${chapter.id}:`, error);
          // Assume it needs analysis if we can't verify
          outdatedCount++;
        }
      }

      setContentHashStatus({
        hasOutdatedContent: outdatedCount > 0,
        chaptersNeedingAnalysis: outdatedCount
      });

    } catch (error) {
      console.error('Error checking content hash status:', error);
    }
  };

  const handleAnalyzeProject = async () => {
    try {
      setAnalysisStatus(prev => ({ ...prev, isProcessing: true }));
      console.log('🚀 Starting unified project analysis for:', projectId);
      
      // Use the new unified analysis architecture
      const result = await SmartAnalysisOrchestrator.analyzeProject(projectId);
      console.log('✅ Unified analysis completed:', result);
      
      // Update the never analyzed flag
      setHasNeverAnalyzed(false);
      
      // Show success message with extracted data count
      if (result.processingStats?.knowledgeExtracted > 0) {
        console.log(`🎉 Successfully extracted ${result.processingStats.knowledgeExtracted} knowledge items`);
      }
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchKnowledge();
        checkContentHashStatus();
      }, 1000);
    } catch (error) {
      console.error('❌ Error in unified project analysis:', error);
      setAnalysisStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Automatic initial analysis trigger
  const triggerInitialAnalysisIfNeeded = async () => {
    if (hasNeverAnalyzed && !analysisStatus.isProcessing) {
      console.log('🔄 Triggering initial analysis automatically');
      await handleAnalyzeProject();
    }
  };

  useEffect(() => {
    fetchKnowledge();
    checkContentHashStatus();
    
    // Set up polling for status updates during processing
    const interval = setInterval(() => {
      if (analysisStatus.isProcessing) {
        fetchKnowledge();
        checkContentHashStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Trigger initial analysis when detected as never analyzed
  useEffect(() => {
    if (hasNeverAnalyzed) {
      triggerInitialAnalysisIfNeeded();
    }
  }, [hasNeverAnalyzed]);

  const getCategoryColor = (category: string) => {
    const colors = {
      character: 'bg-blue-100 text-blue-800',
      plot_point: 'bg-green-100 text-green-800',
      world_building: 'bg-purple-100 text-purple-800',
      theme: 'bg-orange-100 text-orange-800',
      setting: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-slate-600">Loading AI Brain...</p>
        </div>
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

      {/* Content Hash Status */}
      {contentHashStatus.hasOutdatedContent && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                Content Analysis Needed
              </p>
              <p className="text-sm text-yellow-700">
                {contentHashStatus.chaptersNeedingAnalysis} chapter(s) have been modified and need re-analysis for up-to-date AI insights.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Status Overview */}
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

      {/* Processing Status */}
      {analysisStatus.isProcessing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {analysisStatus.currentJob?.current_step || 'Analyzing your project...'}
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

      {/* Flagged Knowledge (High Priority) */}
      {flaggedKnowledge.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Issues Requiring Review</span>
          </h4>
          <div className="space-y-3">
            {flaggedKnowledge.map((item) => (
              <Card key={item.id} className="p-4 border-red-200 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-slate-900">{item.name}</h5>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(item.confidence_score)}`}>
                        {Math.round(item.confidence_score * 100)}% confidence
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
        </div>
      )}

      {/* All Knowledge */}
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
                ? 'Click "Start Analysis" to extract insights from your story'
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
