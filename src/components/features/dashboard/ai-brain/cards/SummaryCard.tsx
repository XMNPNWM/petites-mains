import React from 'react';
import { Card } from '@/components/ui/card';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';

interface SummaryCardProps {
  item: {
    id: string;
    title?: string;
    summary_long?: string;
    ai_confidence?: number;
  };
  onUpdateTitle: (id: string, value: string) => Promise<void>;
  onUpdateSummary: (id: string, value: string) => Promise<void>;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  item,
  onUpdateTitle,
  onUpdateSummary
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <InlineEditableField
          value={item.title || ''}
          onSave={(value) => onUpdateTitle(item.id, value)}
          placeholder="Chapter title..."
          className="font-medium text-slate-900 flex-1"
          fieldName="Chapter title"
        />
        <ConfidenceBadge 
          confidence={item.ai_confidence || 0}
        />
      </div>
      
      <div className="mb-4">
        <h6 className="text-sm font-medium text-slate-700 mb-2">Chapter Summary</h6>
        <InlineEditableField
          value={item.summary_long || ''}
          onSave={(value) => onUpdateSummary(item.id, value)}
          placeholder="Add chapter summary..."
          multiline
          className="text-sm text-slate-600 leading-relaxed"
          fieldName="Chapter summary"
        />
      </div>
    </Card>
  );
};