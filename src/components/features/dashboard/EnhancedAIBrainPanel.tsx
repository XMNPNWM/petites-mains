import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Brain, AlertTriangle, CheckCircle, Loader2, RefreshCw, Edit3, Save, X, Filter, Search, Flag, Trash2, Clock, XCircle, RotateCcw } from 'lucide-react';
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
  // Use the new comprehensive data hook
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

  const [filteredKnowledge, setFilteredKnowledge] = useState<KnowledgeBase[]>([]);
  const [flaggedKnowledge, setFlaggedKnowledge] = useState<KnowledgeBase[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isProcessing: false,
    hasErrors: false,
    errorCount: 0,
    lowConfidenceFactsCount: 0
  });
  const [editingItem, setEditingItem] = useState<EditingKnowledge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [showFlagged, setShowFlagged] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const jobManager = new AnalysisJobManager();

  // Calculate all knowledge items for filtering and stats
  const allKnowledge = [...knowledge, ...themes];

  useEffect(() => {
    // Update filtered and flagged knowledge when data changes
    const flagged = allKnowledge.filter(item => item.is_flagged);
    setFlaggedKnowledge(flagged);
    applyFilters(allKnowledge);

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
  }, [knowledge, themes, projectId, dataLoading]);

  const applyFilters = (knowledgeData: KnowledgeBase[] = allKnowledge) => {
    let filtered = [...knowledgeData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Confidence filter
    if (confidenceFilter !== 'all') {
      const threshold = parseFloat(confidenceFilter);
      filtered = filtered.filter(item => item.confidence_score >= threshold);
    }

    // Flagged filter
    if (showFlagged) {
      filtered = filtered.filter(item => item.is_flagged);
    }

    setFilteredKnowledge(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, confidenceFilter, showFlagged, allKnowledge]);

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

  const startEditing = (item: KnowledgeBase) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      description: item.description || '',
      confidence_score: item.confidence_score,
      evidence: item.evidence || ''
    });
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          name: editingItem.name,
          description: editingItem.description,
          confidence_score: editingItem.confidence_score,
          evidence: editingItem.evidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge item updated successfully",
      });

      setEditingItem(null);
    } catch (error) {
      console.error('Error updating knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge item",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const toggleFlag = async (item: KnowledgeBase) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ 
          is_flagged: !item.is_flagged,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Knowledge item ${item.is_flagged ? 'unflagged' : 'flagged'} successfully`,
      });

    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: "Error",
        description: "Failed to update flag status",
        variant: "destructive"
      });
    }
  };

  const deleteKnowledge = async (item: KnowledgeBase) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge item deleted successfully",
      });

    } catch (error) {
      console.error('Error deleting knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge item",
        variant: "destructive"
      });
    }
  };

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

  const categories = [...new Set(allKnowledge.map(k => k.category))];

  // Calculate comprehensive stats from real data
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

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search knowledge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Confidence</label>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="all">All Confidence</option>
              <option value="0.8">High (80%+)</option>
              <option value="0.6">Medium (60%+)</option>
              <option value="0.4">Low (40%+)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant={showFlagged ? "default" : "outline"}
              onClick={() => setShowFlagged(!showFlagged)}
              className="w-full"
            >
              <Flag className="w-4 h-4 mr-2" />
              {showFlagged ? 'Show All' : 'Show Flagged'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Knowledge Items Display */}
      <div className="space-y-3">
        {filteredKnowledge.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">
              {allKnowledge.length === 0 
                ? "No knowledge extracted yet" 
                : "No knowledge matches your filters"
              }
            </p>
            {allKnowledge.length === 0 && (
              <p className="text-sm text-slate-500">
                Click "Analyze Project" to start extracting insights from your story
              </p>
            )}
          </Card>
        ) : (
          filteredKnowledge.map((item) => (
            <Card key={item.id} className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50' : ''}`}>
              {editingItem?.id === item.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Name</label>
                    <Input
                      value={editingItem.name}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                    <Textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, description: e.target.value} : null)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Confidence Score ({Math.round(editingItem.confidence_score * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={editingItem.confidence_score}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, confidence_score: parseFloat(e.target.value)} : null)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Evidence</label>
                    <Textarea
                      value={editingItem.evidence}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, evidence: e.target.value} : null)}
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={saveEdit} size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
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
                      {item.is_flagged && (
                        <Badge variant="destructive">
                          <Flag className="w-3 h-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                    {item.evidence && (
                      <p className="text-xs text-slate-500 italic">Evidence: {item.evidence}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(item)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(item)}
                      className={item.is_flagged ? 'text-red-600' : ''}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKnowledge(item)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedAIBrainPanel;
