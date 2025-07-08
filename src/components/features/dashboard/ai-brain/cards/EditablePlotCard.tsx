import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';

interface EditablePlotCardProps {
  item: {
    id: string;
    name?: string;
    thread_name?: string;
    description?: string;
    ai_confidence?: number;
    ai_confidence_new?: number;
    is_flagged?: boolean;
    plot_thread_name?: string;
    characters_involved_names?: string[];
    thread_type?: string;
    thread_status?: string;
    evidence?: string;
  };
  onUpdateName?: (id: string, value: string) => Promise<void>;
  onUpdateDescription?: (id: string, value: string) => Promise<void>;
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
  type: 'plot-point' | 'plot-thread';
}

export const EditablePlotCard: React.FC<EditablePlotCardProps> = ({
  item,
  onUpdateName,
  onUpdateDescription,
  onToggleFlag,
  type
}) => {
  return (
    <Card 
      className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <InlineEditableField
          value={type === 'plot-point' ? item.name || '' : item.thread_name || ''}
          onSave={(value) => onUpdateName?.(item.id, value)}
          placeholder={type === 'plot-point' ? "Plot point name..." : "Plot thread name..."}
          className="font-medium text-slate-900 flex-1"
          fieldName={type === 'plot-point' ? "Plot point name" : "Plot thread name"}
        />
        <div className="flex items-center space-x-2 ml-2">
          <ConfidenceBadge 
            confidence={item.ai_confidence || item.ai_confidence_new || 0}
          />
          <FlagToggleButton
            isFlagged={item.is_flagged || false}
            onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
          />
        </div>
      </div>
      
      {type === 'plot-point' && onUpdateDescription && (
        <InlineEditableField
          value={item.description || ''}
          onSave={(value) => onUpdateDescription(item.id, value)}
          placeholder="Add plot point description..."
          multiline
          className="text-sm text-slate-600 mb-2"
          fieldName="Plot point description"
        />
      )}
      
      <div className="flex flex-wrap gap-2 text-xs">
        {type === 'plot-point' && item.plot_thread_name && (
          <Badge variant="secondary">Thread: {item.plot_thread_name}</Badge>
        )}
        {type === 'plot-thread' && item.thread_type && (
          <Badge variant="secondary">{item.thread_type}</Badge>
        )}
        {type === 'plot-thread' && item.thread_status && (
          <Badge variant="outline">{item.thread_status}</Badge>
        )}
        {item.characters_involved_names && item.characters_involved_names.length > 0 && (
          <Badge variant="outline">Characters: {item.characters_involved_names.join(', ')}</Badge>
        )}
      </div>
      
      {item.evidence && (
        <p className="text-xs text-slate-500 italic mt-2">"{item.evidence}"</p>
      )}
    </Card>
  );
};