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
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';
import { AIBrainHeader } from './ai-brain/AIBrainHeader';
import { AIBrainStatusCards } from './ai-brain/AIBrainStatusCards';
import SearchFilterPanel from './ai-brain/SearchFilterPanel';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { AIBrainUpdateService } from '@/services/AIBrainUpdateService';

interface EnhancedAIBrainPanelProps {
  projectId: string;
}

const EnhancedAIBrainPanel = ({ projectId }: EnhancedAIBrainPanelProps) => {
  const brainData = useAIBrainData(projectId);
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
    error: dataError,
    refresh
  } = brainData as any;

  const {
    filters,
    setFilters,
    filteredData,
    totalResults
  } = useSearchAndFilter(brainData);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const jobManager = new AnalysisJobManager();

  const handleUpdateKnowledge = async (id: string, field: 'name' | 'description', value: string) => {
    await AIBrainUpdateService.updateKnowledgeItem(id, { [field]: value });
    await refresh();
  };

  const handleUpdatePlotPoint = async (id: string, field: 'name' | 'description', value: string) => {
    await AIBrainUpdateService.updatePlotPoint(id, { [field]: value });
    await refresh();
  };

  const handleUpdatePlotThread = async (id: string, value: string) => {
    await AIBrainUpdateService.updatePlotThread(id, { thread_name: value });
    await refresh();
  };

  const handleUpdateTimelineEvent = async (id: string, field: 'event_name' | 'event_description', value: string) => {
    await AIBrainUpdateService.updateTimelineEvent(id, { [field]: value });
    await refresh();
  };

  const handleUpdateChapterSummary = async (id: string, field: 'title' | 'summary_long', value: string) => {
    await AIBrainUpdateService.updateChapterSummary(id, { [field]: value });
    await refresh();
  };

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

  const allKnowledge = [...filteredData.knowledge, ...filteredData.themes];
  const totalKnowledgeItems = allKnowledge.length + filteredData.chapterSummaries.length + filteredData.plotPoints.length + 
                             filteredData.plotThreads.length + filteredData.timelineEvents.length + filteredData.characterRelationships.length + filteredData.worldBuilding.length;
  const lowConfidenceItems = allKnowledge.filter(k => k.confidence_score < 0.6).length;
  const flaggedItems = allKnowledge.filter(k => k.is_flagged).length;

  return (
    <div className="space-y-6">
      <AIBrainHeader
        analysisStatus={analysisStatus}
        isAnalyzing={isAnalyzing}
        isRetrying={isRetrying}
        onAnalyzeProject={() => {}}
        onRetryAnalysis={() => {}}
        onCancelAnalysis={() => {}}
      />

      <AIBrainStatusCards
        totalKnowledgeItems={totalKnowledgeItems}
        lowConfidenceItems={lowConfidenceItems}
        flaggedItems={flaggedItems}
        analysisStatus={analysisStatus}
      />

      <SearchFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        resultsCount={totalResults}
      />

      <Card className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 gap-1">
            <TabsTrigger value="overview" className="flex items-center space-x-1 text-xs">
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center space-x-1 text-xs">
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Characters</span>
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center space-x-1 text-xs">
              <Heart className="w-3 h-3" />
              <span className="hidden sm:inline">Relations</span>
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

          <TabsContent value="characters" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Characters ({filteredData.knowledge.filter(k => k.category === 'character').length})</h4>
              </div>
              {filteredData.knowledge.filter(k => k.category === 'character').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No characters found with current filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredData.knowledge.filter(k => k.category === 'character').map((character) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <InlineEditableField
                          value={character.name}
                          onSave={(value) => handleUpdateKnowledge(character.id, 'name', value)}
                          placeholder="Character name..."
                          className="font-medium text-slate-900 flex-1"
                          fieldName="Character name"
                        />
                        <Badge variant="outline" className="text-xs ml-2">
                          {Math.round(character.confidence_score * 100)}%
                        </Badge>
                      </div>
                      <InlineEditableField
                        value={character.description || ''}
                        onSave={(value) => handleUpdateKnowledge(character.id, 'description', value)}
                        placeholder="Add character description..."
                        multiline
                        className="text-sm text-slate-600 mb-2"
                        fieldName="Character description"
                      />
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
                <h4 className="text-lg font-medium text-slate-900">Plot Points ({filteredData.plotPoints.length})</h4>
              </div>
              {filteredData.plotPoints.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plot points found with current filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredData.plotPoints.map((plotPoint) => (
                    <Card key={plotPoint.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <InlineEditableField
                          value={plotPoint.name}
                          onSave={(value) => handleUpdatePlotPoint(plotPoint.id, 'name', value)}
                          placeholder="Plot point name..."
                          className="font-medium text-slate-900 flex-1"
                          fieldName="Plot point name"
                        />
                        <Badge variant="outline" className="text-xs ml-2">
                          {Math.round((plotPoint.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <InlineEditableField
                        value={plotPoint.description || ''}
                        onSave={(value) => handleUpdatePlotPoint(plotPoint.id, 'description', value)}
                        placeholder="Add plot point description..."
                        multiline
                        className="text-sm text-slate-600 mb-2"
                        fieldName="Plot point description"
                      />
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

          <TabsContent value="summaries" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-slate-900">Chapter Summaries ({filteredData.chapterSummaries.length})</h4>
              </div>
              {filteredData.chapterSummaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No chapter summaries available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.chapterSummaries.map((summary) => (
                    <Card key={summary.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <InlineEditableField
                          value={summary.title || ''}
                          onSave={(value) => handleUpdateChapterSummary(summary.id, 'title', value)}
                          placeholder="Chapter title..."
                          className="font-medium text-slate-900 flex-1"
                          fieldName="Chapter title"
                        />
                        <Badge variant="outline" className="text-xs ml-2">
                          {Math.round((summary.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-slate-700 mb-2">Chapter Summary</h6>
                        <InlineEditableField
                          value={summary.summary_long || ''}
                          onSave={(value) => handleUpdateChapterSummary(summary.id, 'summary_long', value)}
                          placeholder="Add chapter summary..."
                          multiline
                          className="text-sm text-slate-600 leading-relaxed"
                          fieldName="Chapter summary"
                        />
                      </div>
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
