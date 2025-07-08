import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { AnalysisJobManager } from '@/services/AnalysisJobManager';
import { useToast } from '@/hooks/use-toast';
import { useAIBrainData } from '@/hooks/useAIBrainData';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { AIBrainHeader } from './ai-brain/AIBrainHeader';
import { AIBrainStatusCards } from './ai-brain/AIBrainStatusCards';
import { QualityReviewPanel } from './ai-brain/QualityReviewPanel';
import SearchFilterPanel from './ai-brain/SearchFilterPanel';
import { UnifiedUpdateService } from '@/services/UnifiedUpdateService';
import { getTabConfiguration } from '@/utils/tabConfiguration';

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

  const { analysisStatus, refreshAnalysisStatus } = useAnalysisStatus(projectId);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const jobManager = new AnalysisJobManager();

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
      await refreshAnalysisStatus();
    }
  };

  const handleRetryAnalysis = async () => {
    setIsRetrying(true);
    try {
      await handleAnalyzeProject();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancelAnalysis = async () => {
    if (analysisStatus.currentJob?.id) {
      try {
        await jobManager.cancelJob(analysisStatus.currentJob.id);
        toast({
          title: "Analysis Cancelled",
          description: "The analysis job has been cancelled"
        });
        await refreshAnalysisStatus();
      } catch (error) {
        console.error('Error cancelling job:', error);
        toast({
          title: "Error",
          description: "Failed to cancel analysis job",
          variant: "destructive"
        });
      }
    }
  };

  // Unified update handlers using the service
  const handleUpdateKnowledge = async (id: string, field: 'name' | 'description', value: string) => {
    await UnifiedUpdateService.updateKnowledgeItem(id, field, value);
    await refresh();
  };

  const handleToggleKnowledgeFlag = async (id: string, isFlagged: boolean) => {
    await UnifiedUpdateService.toggleKnowledgeFlag(id, isFlagged);
    await refresh();
  };

  const handleUpdatePlotPoint = async (id: string, field: 'name' | 'description', value: string) => {
    await UnifiedUpdateService.updatePlotPoint(id, field, value);
    await refresh();
  };

  const handleTogglePlotPointFlag = async (id: string, isFlagged: boolean) => {
    await UnifiedUpdateService.togglePlotPointFlag(id, isFlagged);
    await refresh();
  };

  const handleUpdatePlotThread = async (id: string, value: string) => {
    await UnifiedUpdateService.updatePlotThread(id, value);
    await refresh();
  };

  const handleTogglePlotThreadFlag = async (id: string, isFlagged: boolean) => {
    await UnifiedUpdateService.togglePlotThreadFlag(id, isFlagged);
    await refresh();
  };

  const handleUpdateTimelineEvent = async (id: string, field: 'event_name' | 'event_description', value: string) => {
    await UnifiedUpdateService.updateTimelineEvent(id, field, value);
    await refresh();
  };

  const handleToggleTimelineEventFlag = async (id: string, isFlagged: boolean) => {
    await UnifiedUpdateService.toggleTimelineEventFlag(id, isFlagged);
    await refresh();
  };

  const handleToggleCharacterRelationshipFlag = async (id: string, isFlagged: boolean) => {
    await UnifiedUpdateService.toggleCharacterRelationshipFlag(id, isFlagged);
    await refresh();
  };

  const handleUpdateChapterSummary = async (id: string, field: 'title' | 'summary_long', value: string) => {
    await UnifiedUpdateService.updateChapterSummary(id, field, value);
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

  // Calculate metrics for status cards
  const allKnowledge = [...filteredData.knowledge, ...filteredData.themes];
  const totalKnowledgeItems = allKnowledge.length + filteredData.chapterSummaries.length + filteredData.plotPoints.length + 
                             filteredData.plotThreads.length + filteredData.timelineEvents.length + filteredData.characterRelationships.length + filteredData.worldBuilding.length;
  const lowConfidenceItems = allKnowledge.filter(k => k.confidence_score < 0.6).length;
  const flaggedItems = allKnowledge.filter(k => k.is_flagged).length;

  // Get tab configuration
  const tabs = getTabConfiguration(brainData);

  // Helper function to get data for each tab
  const getTabData = (tabKey: string, filteredData: any) => {
    switch (tabKey) {
      case 'characters':
        return filteredData.knowledge.filter((k: any) => k.category === 'character');
      case 'relationships':
        return filteredData.characterRelationships;
      case 'plot-points':
        return filteredData.plotPoints;
      case 'plot-threads':
        return filteredData.plotThreads;
      case 'timeline':
        return filteredData.timelineEvents;
      case 'world-building':
        return filteredData.worldBuilding;
      case 'summaries':
        return filteredData.chapterSummaries;
      case 'themes':
        return filteredData.themes;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <AIBrainHeader
        analysisStatus={analysisStatus}
        isAnalyzing={isAnalyzing}
        isRetrying={isRetrying}
        onAnalyzeProject={handleAnalyzeProject}
        onRetryAnalysis={handleRetryAnalysis}
        onCancelAnalysis={handleCancelAnalysis}
      />

      <AIBrainStatusCards
        totalKnowledgeItems={totalKnowledgeItems}
        lowConfidenceItems={lowConfidenceItems}
        flaggedItems={flaggedItems}
        analysisStatus={analysisStatus}
      />

      <QualityReviewPanel 
        data={brainData}
        onDataRefresh={refresh}
      />

      <SearchFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        resultsCount={totalResults}
      />

      <Card className="p-6">
        <Tabs defaultValue="characters" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-2 h-auto p-2 bg-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const count = tab.getCount(brainData);
                return (
                  <TabsTrigger 
                    key={tab.key} 
                    value={tab.key} 
                    className="flex flex-col items-center space-y-1 p-3 text-xs h-auto"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label} ({count})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {tabs.map((tab) => {
            const TabComponent = tab.component;
            const data = getTabData(tab.key, filteredData);
            
            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-slate-900">
                      {tab.label} ({data.length})
                    </h4>
                  </div>
                  <TabComponent
                    data={data}
                    onDataRefresh={refresh}
                    onUpdateKnowledge={handleUpdateKnowledge}
                    onToggleKnowledgeFlag={handleToggleKnowledgeFlag}
                    onUpdatePlotPoint={handleUpdatePlotPoint}
                    onTogglePlotPointFlag={handleTogglePlotPointFlag}
                    onUpdatePlotThread={handleUpdatePlotThread}
                    onTogglePlotThreadFlag={handleTogglePlotThreadFlag}
                    onUpdateTimelineEvent={handleUpdateTimelineEvent}
                    onToggleTimelineEventFlag={handleToggleTimelineEventFlag}
                    onToggleCharacterRelationshipFlag={handleToggleCharacterRelationshipFlag}
                    onUpdateChapterSummary={handleUpdateChapterSummary}
                  />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
};

export default EnhancedAIBrainPanel;
