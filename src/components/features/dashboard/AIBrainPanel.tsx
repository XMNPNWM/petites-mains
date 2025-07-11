// DEPRECATED: This file is kept for reference but replaced by EnhancedAIBrainPanel.tsx
// TODO: Remove this file after confirming EnhancedAIBrainPanel works perfectly

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, AlertTriangle, CheckCircle, Loader2, RefreshCw, Users, BookOpen, GitBranch, Calendar, Globe, Lightbulb, FileText } from 'lucide-react';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { AnalysisJobManager } from '@/services/AnalysisJobManager';
import { KnowledgeBase, AnalysisStatus } from '@/types/knowledge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAIBrainData } from '@/hooks/useAIBrainData';
import { useJobManager } from '@/hooks/useJobManager';

interface AIBrainPanelProps {
  projectId: string;
}

const AIBrainPanel = ({ projectId }: AIBrainPanelProps) => {
  const brainDataResult = useAIBrainData(projectId);
  const {
    knowledge,
    chapterSummaries,
    plotPoints,
    plotThreads,
    timelineEvents,
    characterRelationships,
    worldBuilding,
    themes,
    isLoading,
    error
  } = brainDataResult;

  // Extract refresh function safely
  const refresh = (brainDataResult as any).refresh;

  const { getProjectAnalysisStatus } = useJobManager();
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const jobManager = new AnalysisJobManager();

  // Load analysis status on mount
  useEffect(() => {
    const loadAnalysisStatus = async () => {
      const status = await getProjectAnalysisStatus(projectId);
      setAnalysisStatus(status);
    };
    loadAnalysisStatus();
  }, [projectId, getProjectAnalysisStatus]);

  const handleAnalyzeProject = async () => {
    if (analysisStatus.isProcessing) return;
    
    setIsAnalyzing(true);
    try {
      console.log('🚀 Starting comprehensive analysis for project:', projectId);
      
      const result = await SmartAnalysisOrchestrator.analyzeProject(projectId);
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: `Successfully extracted ${result.totalExtracted || result.processingStats?.knowledgeExtracted || 0} knowledge items`,
        });
        if (refresh) {
          await refresh();
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
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
      // Refresh analysis status
      const status = await getProjectAnalysisStatus(projectId);
      setAnalysisStatus(status);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-slate-600">Loading AI Brain Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-slate-600 mb-4">Error loading AI Brain data</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalKnowledgeItems = knowledge.length + chapterSummaries.length + plotPoints.length + 
                             plotThreads.length + timelineEvents.length + characterRelationships.length + worldBuilding.length + themes.length;
  const lowConfidenceItems = knowledge.filter(k => k.confidence_score < 0.6).length;
  const flaggedItems = knowledge.filter(k => k.is_flagged).length;

  return (
    <div className="space-y-6">
      {/* Header with Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Brain (Deprecated)</h3>
            <p className="text-sm text-slate-600">
              This component is deprecated. Use EnhancedAIBrainPanel instead.
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleAnalyzeProject}
          disabled={analysisStatus.isProcessing || isAnalyzing}
          className="flex items-center space-x-2"
        >
          {(analysisStatus.isProcessing || isAnalyzing) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          <span>
            {analysisStatus.isProcessing ? 'Analyzing...' : 
             isAnalyzing ? 'Starting...' : 'Analyze Project'}
          </span>
        </Button>
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Items</p>
              <p className="text-xl font-semibold text-slate-900">{totalKnowledgeItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">High Confidence</p>
              <p className="text-xl font-semibold text-slate-900">
                {totalKnowledgeItems - lowConfidenceItems}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Low Confidence</p>
              <p className="text-xl font-semibold text-slate-900">{lowConfidenceItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Flagged</p>
              <p className="text-xl font-semibold text-slate-900">{flaggedItems}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8 gap-1">
            <TabsTrigger value="overview" className="flex items-center space-x-1 text-xs">
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center space-x-1 text-xs">
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Characters</span>
            </TabsTrigger>
            <TabsTrigger value="plot-points" className="flex items-center space-x-1 text-xs">
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Plot Points</span>
            </TabsTrigger>
            <TabsTrigger value="plot-threads" className="flex items-center space-x-1 text-xs">
              <GitBranch className="w-3 h-3" />
              <span className="hidden sm:inline">Threads</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-1 text-xs">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="world-building" className="flex items-center space-x-1 text-xs">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">World</span>
            </TabsTrigger>
            <TabsTrigger value="summaries" className="flex items-center space-x-1 text-xs">
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">Summaries</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center space-x-1 text-xs">
              <Lightbulb className="w-3 h-3" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Characters</h4>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{knowledge.filter(k => k.category === 'character').length}</p>
                <p className="text-sm text-slate-600">Extracted characters</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Plot Points</h4>
                  <BookOpen className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{plotPoints.length}</p>
                <p className="text-sm text-slate-600">Key plot moments</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">World Building</h4>
                  <Globe className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{worldBuilding.length}</p>
                <p className="text-sm text-slate-600">World elements</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Characters ({knowledge.filter(k => k.category === 'character').length})</h4>
              </div>
              {knowledge.filter(k => k.category === 'character').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No characters found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {knowledge.filter(k => k.category === 'character').map((character) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{character.name}</h5>
                        <Badge variant={character.confidence_score > 0.7 ? "default" : "secondary"}>
                          {Math.round(character.confidence_score * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{character.description}</p>
                      {character.evidence && (
                        <p className="text-xs text-slate-500 italic">"{character.evidence}"</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plot-points" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Plot Points ({plotPoints.length})</h4>
              </div>
              {plotPoints.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plot points found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plotPoints.map((plotPoint) => (
                    <Card key={plotPoint.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{plotPoint.name}</h5>
                        <Badge variant={plotPoint.ai_confidence && plotPoint.ai_confidence > 0.7 ? "default" : "secondary"}>
                          {Math.round((plotPoint.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{plotPoint.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {plotPoint.plot_thread_name && (
                          <Badge variant="outline">Thread: {plotPoint.plot_thread_name}</Badge>
                        )}
                        {plotPoint.characters_involved_names && plotPoint.characters_involved_names.length > 0 && (
                          <Badge variant="outline">Characters: {plotPoint.characters_involved_names.join(', ')}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plot-threads" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Plot Threads ({plotThreads.length})</h4>
              </div>
              {plotThreads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plot threads found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plotThreads.map((thread) => (
                    <Card key={thread.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{thread.thread_name}</h5>
                        <Badge variant={thread.ai_confidence_new && thread.ai_confidence_new > 0.7 ? "default" : "secondary"}>
                          {Math.round((thread.ai_confidence_new || 0) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{thread.thread_type}</Badge>
                        <Badge variant="outline">{thread.thread_status}</Badge>
                        {thread.characters_involved_names && thread.characters_involved_names.length > 0 && (
                          <Badge variant="outline">Characters: {thread.characters_involved_names.join(', ')}</Badge>
                        )}
                      </div>
                      {thread.evidence && (
                        <p className="text-xs text-slate-500 italic mt-2">"{thread.evidence}"</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Timeline Events ({timelineEvents.length})</h4>
              </div>
              {timelineEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No timeline events found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{event.event_name}</h5>
                        <Badge variant={event.ai_confidence_new && event.ai_confidence_new > 0.7 ? "default" : "secondary"}>
                          {Math.round((event.ai_confidence_new || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{event.event_description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{event.event_type}</Badge>
                        {event.characters_involved_names && event.characters_involved_names.length > 0 && (
                          <Badge variant="outline">Characters: {event.characters_involved_names.join(', ')}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="world-building" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">World Building ({worldBuilding.length})</h4>
              </div>
              {worldBuilding.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No world building elements found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worldBuilding.map((element) => (
                    <Card key={element.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{element.name}</h5>
                        <Badge variant="secondary">{element.subcategory || 'general'}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{element.description}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summaries" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Chapter Summaries ({chapterSummaries.length})</h4>
              </div>
              {chapterSummaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No chapter summaries available yet. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapterSummaries.map((summary) => (
                    <Card key={summary.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-medium text-slate-900">{summary.title || 'Untitled Chapter'}</h5>
                        <Badge variant={summary.ai_confidence && summary.ai_confidence > 0.7 ? "default" : "secondary"}>
                          {Math.round((summary.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      
                      {summary.summary_short && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-slate-700 mb-1">Quick Summary</h6>
                          <p className="text-sm text-slate-600">{summary.summary_short}</p>
                        </div>
                      )}
                      
                      {summary.summary_long && (
                        <div className="mb-4">
                          <h6 className="text-sm font-medium text-slate-700 mb-2">Detailed Summary</h6>
                          <p className="text-sm text-slate-600 leading-relaxed">{summary.summary_long}</p>
                        </div>
                      )}
                      
                      {summary.key_events_in_chapter && Array.isArray(summary.key_events_in_chapter) && summary.key_events_in_chapter.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-slate-700 mb-2">Key Events</h6>
                          <div className="flex flex-wrap gap-1">
                            {summary.key_events_in_chapter.map((event, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="themes" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Themes ({themes.length})</h4>
              </div>
              {themes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No themes found. Try running an analysis first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <Card key={theme.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{theme.name}</h5>
                        <Badge variant={theme.confidence_score > 0.7 ? "default" : "secondary"}>
                          {Math.round(theme.confidence_score * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{theme.description}</p>
                      {theme.evidence && (
                        <p className="text-xs text-slate-500 italic">"{theme.evidence}"</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AIBrainPanel;
