import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, AlertTriangle, CheckCircle, Loader2, RefreshCw, Edit3, Save, X, Filter, Search, Flag, Trash2, Clock, XCircle, RotateCcw, Users, BookOpen, GitBranch, Calendar, Globe, Lightbulb, FileText, Heart } from 'lucide-react';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { AnalysisJobManager } from '@/services/AnalysisJobManager';
import { KnowledgeBase, AnalysisStatus } from '@/types/knowledge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAIBrainData } from '@/hooks/useAIBrainData';

interface EnhancedAIBrainPanelProps {
  projectId: string;
}

interface EditingKnowledge {
  id: string;
  name: string;
  description: string;
  confidence_score: number;
  evidence: string;
}

const EnhancedAIBrainPanel = ({ projectId }: EnhancedAIBrainPanelProps) => {
  // Use the comprehensive data hook
  const {
    knowledge,
    chapterSummaries,
    plotPoints,
    plotThreads,
    timelineEvents,
    characterRelationships,
    worldBuilding,
    themes,
    isLoading: dataLoading,
    error: dataError
  } = useAIBrainData(projectId);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [editingItem, setEditingItem] = useState<EditingKnowledge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const jobManager = new AnalysisJobManager();

  useEffect(() => {
    // Get analysis status
    const fetchAnalysisStatus = async () => {
      try {
        const status = await jobManager.getProjectAnalysisStatus(projectId);
        setAnalysisStatus(status);
      } catch (statusError) {
        console.error('❌ Error fetching analysis status:', statusError);
      }
    };

    if (projectId && !dataLoading) {
      fetchAnalysisStatus();
    }
  }, [projectId, dataLoading]);

  // Real-time status polling when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (analysisStatus.isProcessing) {
      interval = setInterval(async () => {
        try {
          const status = await jobManager.getProjectAnalysisStatus(projectId);
          setAnalysisStatus(status);
        } catch (error) {
          console.error('Error polling analysis status:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analysisStatus.isProcessing, projectId]);

  const handleAnalyzeProject = async () => {
    console.log('🚀 Starting project analysis for:', projectId);
    
    try {
      setIsAnalyzing(true);
      setAnalysisStatus(prev => ({ ...prev, isProcessing: true }));
      
      const result = await SmartAnalysisOrchestrator.analyzeProject(projectId);
      
      console.log('✅ Analysis completed successfully:', result);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed project with ${result.processingStats?.knowledgeExtracted || 0} knowledge items extracted.`,
      });
      
    } catch (error) {
      console.error('❌ Error in handleAnalyzeProject:', error);
      
      setAnalysisStatus(prev => ({ ...prev, isProcessing: false }));
      
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Analysis failed",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryAnalysis = async () => {
    try {
      setIsRetrying(true);
      console.log('🔄 Retrying analysis for project:', projectId);
      
      await handleAnalyzeProject();
      
      toast({
        title: "Retry Started",
        description: "Analysis has been restarted.",
      });
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

  const handleCancelAnalysis = async () => {
    if (!analysisStatus.currentJob?.id) return;
    
    try {
      console.log('🚫 Cancelling analysis job:', analysisStatus.currentJob.id);
      await jobManager.cancelJob(analysisStatus.currentJob.id);
      
      toast({
        title: "Analysis Cancelled",
        description: "The analysis job has been cancelled.",
      });
      
    } catch (error) {
      console.error('❌ Error cancelling analysis:', error);
      toast({
        title: "Error",
        description: "Failed to cancel analysis",
        variant: "destructive"
      });
    }
  };

  // Calculate comprehensive stats from real data
  const allKnowledge = [...knowledge, ...themes];
  const totalKnowledgeItems = allKnowledge.length + chapterSummaries.length + plotPoints.length + 
                             plotThreads.length + timelineEvents.length + characterRelationships.length + worldBuilding.length;
  const lowConfidenceItems = allKnowledge.filter(k => k.confidence_score < 0.6).length;
  const flaggedItems = allKnowledge.filter(k => k.is_flagged).length;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-slate-600">Loading AI Brain Data...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-slate-600 mb-4">Error loading AI Brain data</p>
          <p className="text-sm text-red-600">{dataError}</p>
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
              Intelligent story analysis with knowledge extraction
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {analysisStatus.hasErrors && analysisStatus.currentJob?.state === 'failed' && (
            <Button 
              onClick={handleRetryAnalysis}
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
              onClick={handleCancelAnalysis}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleAnalyzeProject}
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

      {/* Success Status */}
      {!analysisStatus.isProcessing && !analysisStatus.hasErrors && totalKnowledgeItems > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Analysis Complete</span>
          </div>
          <p className="text-sm text-green-700">
            Successfully extracted {totalKnowledgeItems} total knowledge items from your story
            {analysisStatus.lastProcessedAt && (
              <span className="ml-2">
                • Last updated: {new Date(analysisStatus.lastProcessedAt).toLocaleString()}
              </span>
            )}
          </p>
        </Card>
      )}

      {/* Status Overview - Updated with real data stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Total Knowledge</p>
              <p className="text-2xl font-bold text-green-600">{totalKnowledgeItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Low Confidence</p>
              <p className="text-2xl font-bold text-yellow-600">{lowConfidenceItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Flag className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Flagged Items</p>
              <p className="text-2xl font-bold text-red-600">{flaggedItems}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabbed Interface */}
      <Card className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Characters</span>
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span className="hidden sm:inline">Relations</span>
            </TabsTrigger>
            <TabsTrigger value="plot-points" className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Plot Points</span>
            </TabsTrigger>
            <TabsTrigger value="plot-threads" className="flex items-center space-x-1">
              <GitBranch className="w-3 h-3" />
              <span className="hidden sm:inline">Threads</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="world-building" className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">World</span>
            </TabsTrigger>
            <TabsTrigger value="summaries" className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">Summaries</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">{knowledge.filter(k => k.category === 'character').length}</div>
                  <div className="text-sm text-slate-600">Characters</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{plotPoints.length}</div>
                  <div className="text-sm text-slate-600">Plot Points</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <GitBranch className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">{plotThreads.length}</div>
                  <div className="text-sm text-slate-600">Plot Threads</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Globe className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{worldBuilding.length}</div>
                  <div className="text-sm text-slate-600">World Elements</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {chapterSummaries.slice(0, 3).map((summary) => (
                      <div key={summary.id} className="text-sm text-slate-600 flex items-center space-x-2">
                        <FileText className="w-3 h-3" />
                        <span>Chapter summary: {summary.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Knowledge Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Confidence (80%+)</span>
                      <span className="font-medium">{allKnowledge.filter(k => k.confidence_score >= 0.8).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium Confidence (60-80%)</span>
                      <span className="font-medium">{allKnowledge.filter(k => k.confidence_score >= 0.6 && k.confidence_score < 0.8).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low Confidence (&lt;60%)</span>
                      <span className="font-medium text-yellow-600">{lowConfidenceItems}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Characters ({knowledge.filter(k => k.category === 'character').length})</h4>
              </div>
              {knowledge.filter(k => k.category === 'character').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No characters extracted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {knowledge.filter(k => k.category === 'character').map((character) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{character.name}</h5>
                        <Badge variant="outline" className="text-xs">
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

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Character Relationships ({characterRelationships.length})</h4>
              </div>
              {characterRelationships.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No relationships extracted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {characterRelationships.map((relationship) => (
                    <Card key={relationship.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{relationship.character_a_name}</span>
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-slate-900">{relationship.character_b_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((relationship.ai_confidence_new || 0) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>Type: {relationship.relationship_type}</span>
                        <span>Strength: {relationship.relationship_strength}/10</span>
                        {relationship.relationship_current_status && (
                          <span>Status: {relationship.relationship_current_status}</span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Plot Points Tab */}
          <TabsContent value="plot-points" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Plot Points ({plotPoints.length})</h4>
              </div>
              {plotPoints.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plot points extracted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plotPoints.map((plotPoint) => (
                    <Card key={plotPoint.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{plotPoint.name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((plotPoint.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      {plotPoint.description && (
                        <p className="text-sm text-slate-600 mb-2">{plotPoint.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {plotPoint.plot_thread_name && (
                          <Badge variant="secondary">Thread: {plotPoint.plot_thread_name}</Badge>
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

          {/* Plot Threads Tab */}
          <TabsContent value="plot-threads" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Plot Threads ({plotThreads.length})</h4>
              </div>
              {plotThreads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plot threads extracted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plotThreads.map((thread) => (
                    <Card key={thread.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{thread.thread_name}</h5>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round((thread.ai_confidence_new || 0) * 100)}%
                          </Badge>
                          <Badge variant={thread.thread_status === 'resolved' ? 'default' : 'secondary'}>
                            {thread.thread_status}
                          </Badge>
                        </div>
                      </div>
                      {thread.thread_type && (
                        <p className="text-sm text-slate-600 mb-2">Type: {thread.thread_type}</p>
                      )}
                      {thread.key_events && thread.key_events.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-slate-700 mb-1">Key Events:</p>
                          <ul className="text-xs text-slate-600 space-y-1 pl-4">
                            {thread.key_events.map((event, index) => (
                              <li key={index} className="list-disc">{event}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {thread.characters_involved_names && thread.characters_involved_names.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Characters: {thread.characters_involved_names.join(', ')}
                        </Badge>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Timeline Events ({timelineEvents.length})</h4>
              </div>
              {timelineEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No timeline events extracted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{event.event_name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((event.ai_confidence_new || 0) * 100)}%
                        </Badge>
                      </div>
                      {event.event_description && (
                        <p className="text-sm text-slate-600 mb-2">{event.event_description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">Order: {event.chronological_order}</Badge>
                        {event.date_or_time_reference && (
                          <Badge variant="outline">Time: {event.date_or_time_reference}</Badge>
                        )}
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

          {/* World Building Tab */}
          <TabsContent value="world-building" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">World Building Elements ({worldBuilding.length})</h4>
              </div>
              {worldBuilding.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No world building elements extracted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {worldBuilding.map((element) => (
                    <Card key={element.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{element.name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                      </div>
                      {element.description && (
                        <p className="text-sm text-slate-600">{element.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Chapter Summaries Tab */}
          <TabsContent value="summaries" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Chapter Summaries ({chapterSummaries.length})</h4>
              </div>
              {chapterSummaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No chapter summaries available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapterSummaries.map((summary) => (
                    <Card key={summary.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-medium text-slate-900">{summary.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((summary.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      
                      {/* Medium summary with all important details */}
                      {summary.summary_long && (
                        <div className="mb-4">
                          <h6 className="text-sm font-medium text-slate-700 mb-2">Chapter Summary</h6>
                          <p className="text-sm text-slate-600 leading-relaxed">{summary.summary_long}</p>
                        </div>
                      )}
                      
                      {/* Key events */}
                      {summary.key_events_in_chapter && summary.key_events_in_chapter.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-slate-700 mb-2">Key Events</h6>
                          <ul className="text-sm text-slate-600 space-y-1 pl-4">
                            {summary.key_events_in_chapter.map((event, index) => (
                              <li key={index} className="list-disc">{event}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Primary focus */}
                      {summary.primary_focus && summary.primary_focus.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-slate-700 mb-2">Primary Focus</h6>
                          <div className="flex flex-wrap gap-1">
                            {summary.primary_focus.map((focus, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {focus}
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
        </Tabs>
      </Card>
    </div>
  );
};

export default EnhancedAIBrainPanel;
