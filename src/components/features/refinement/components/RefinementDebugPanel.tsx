import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface RefinementData {
  id: string;
  chapter_id: string;
  original_content: string;
  enhanced_content: string;
  refinement_status: 'untouched' | 'in_progress' | 'completed' | 'updated';
  ai_changes: any[];
  context_summary: string;
}

interface RefinementDebugPanelProps {
  currentChapter?: Chapter | null;
  refinementData?: RefinementData | null;
  transitionState?: any;
  navigationState?: any;
  isVisible?: boolean;
}

/**
 * Debug panel to help diagnose chapter synchronization and change tracking issues
 * This component helps verify that the fixes are working correctly
 */
const RefinementDebugPanel = ({
  currentChapter,
  refinementData,
  transitionState,
  navigationState,
  isVisible = false
}: RefinementDebugPanelProps) => {
  if (!isVisible) return null;

  const chapterRefinementMatch = !!(
    currentChapter?.id && 
    refinementData?.chapter_id && 
    currentChapter.id === refinementData.chapter_id
  );

  const contentSyncStatus = !!(
    currentChapter?.content &&
    refinementData?.original_content &&
    currentChapter.content === refinementData.original_content
  );

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
          🔍 Refinement Debug Panel
          <Badge variant={chapterRefinementMatch ? "default" : "destructive"}>
            {chapterRefinementMatch ? "Synced" : "Mismatch"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Chapter Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-slate-700">Current Chapter</h4>
            <div className="text-xs space-y-1 mt-1">
              <div>ID: <code className="bg-slate-100 px-1 rounded">{currentChapter?.id || 'null'}</code></div>
              <div>Title: {currentChapter?.title || 'null'}</div>
              <div>Content Length: {currentChapter?.content?.length || 0}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-700">Refinement Data</h4>
            <div className="text-xs space-y-1 mt-1">
              <div>Chapter ID: <code className="bg-slate-100 px-1 rounded">{refinementData?.chapter_id || 'null'}</code></div>
              <div>Status: {refinementData?.refinement_status || 'null'}</div>
              <div>Enhanced Length: {refinementData?.enhanced_content?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="border-t pt-2">
          <h4 className="font-medium text-slate-700 mb-2">Synchronization Status</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={chapterRefinementMatch ? "default" : "destructive"} className="text-xs">
                {chapterRefinementMatch ? "✅" : "❌"}
              </Badge>
              Chapter IDs Match
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={contentSyncStatus ? "default" : "secondary"} className="text-xs">
                {contentSyncStatus ? "✅" : "⚠️"}
              </Badge>
              Content Synced
            </div>
          </div>
        </div>

        {/* Transition State */}
        {transitionState && (
          <div className="border-t pt-2">
            <h4 className="font-medium text-slate-700 mb-1">Transition State</h4>
            <div className="text-xs space-y-1">
              <div>Is Transitioning: {transitionState.isTransitioning ? 'Yes' : 'No'}</div>
              <div>From: {transitionState.fromChapterId || 'null'}</div>
              <div>To: {transitionState.toChapterId || 'null'}</div>
            </div>
          </div>
        )}

        {/* Navigation State */}
        {navigationState && (
          <div className="border-t pt-2">
            <h4 className="font-medium text-slate-700 mb-1">Navigation State</h4>
            <div className="text-xs space-y-1">
              <div>Selected Change: {navigationState.selectedChangeId || 'null'}</div>
              <div>Original Scroll: {navigationState.originalScrollPosition || 0}</div>
              <div>Enhanced Scroll: {navigationState.enhancedScrollPosition || 0}</div>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        <div className="border-t pt-2">
          <h4 className="font-medium text-slate-700 mb-1">Validation</h4>
          <div className="text-xs space-y-1">
            {!chapterRefinementMatch && (
              <div className="text-red-600">⚠️ Chapter ID mismatch detected! This will cause content display issues.</div>
            )}
            {!contentSyncStatus && refinementData && currentChapter && (
              <div className="text-yellow-600">⚠️ Original content is out of sync with current chapter content.</div>
            )}
            {!refinementData && currentChapter && (
              <div className="text-blue-600">ℹ️ No refinement data found for current chapter.</div>
            )}
            {chapterRefinementMatch && refinementData?.enhanced_content && (
              <div className="text-green-600">✅ Everything looks good! Chapter and refinement data are properly synchronized.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefinementDebugPanel;