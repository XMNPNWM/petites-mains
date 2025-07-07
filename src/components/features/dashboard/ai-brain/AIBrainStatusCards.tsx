
import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Flag } from 'lucide-react';
import { AnalysisStatus } from '@/types/knowledge';

interface AIBrainStatusCardsProps {
  totalKnowledgeItems: number;
  lowConfidenceItems: number;
  flaggedItems: number;
  analysisStatus: AnalysisStatus;
}

export const AIBrainStatusCards = ({
  totalKnowledgeItems,
  lowConfidenceItems,
  flaggedItems,
  analysisStatus
}: AIBrainStatusCardsProps) => {
  return (
    <>
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

      {/* Status Overview */}
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
    </>
  );
};
