import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { EditableSelect } from '@/components/ui/editable-select';
import { DeleteButton } from '@/components/ui/delete-button';

interface EditableTimelineCardProps {
  item: {
    id: string;
    event_name: string;
    event_description?: string;
    event_type: string;
    ai_confidence_new?: number;
    characters_involved_names?: string[];
    is_flagged?: boolean;
    is_newly_extracted?: boolean;
  };
  onUpdateEventName: (id: string, value: string) => Promise<void>;
  onUpdateEventDescription: (id: string, value: string) => Promise<void>;
  onUpdateEventType?: (id: string, value: string) => Promise<void>;
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const EVENT_TYPES = [
  'Action',
  'Dialogue',
  'Discovery',
  'Conflict',
  'Resolution',
  'Character Development'
];

export const EditableTimelineCard: React.FC<EditableTimelineCardProps> = ({
  item,
  onUpdateEventName,
  onUpdateEventDescription,
  onUpdateEventType,
  onToggleFlag,
  onDelete
}) => {
  // Determine card styling based on status
  const getCardClassName = () => {
    let baseClass = 'p-4 transition-all duration-200';
    
    if (item.is_flagged) {
      return `${baseClass} border-red-200 bg-red-50/50`;
    }
    
    // Phase 4: Color-coded visual indicator for new extractions (deep green)
    if (item.is_newly_extracted) {
      return `${baseClass} border-emerald-500 bg-emerald-50/30 shadow-sm shadow-emerald-200`;
    }
    
    return baseClass;
  };
  
  return (
    <Card className={getCardClassName()}>
      <div className="flex items-start justify-between mb-2">
        <InlineEditableField
          value={item.event_name}
          onSave={(value) => onUpdateEventName(item.id, value)}
          placeholder="Event name..."
          className="font-medium text-slate-900 flex-1"
          fieldName="Event name"
        />
        <div className="flex items-center space-x-2 ml-2">
          <ConfidenceBadge 
            confidence={item.ai_confidence_new || 0}
          />
          <FlagToggleButton
            isFlagged={item.is_flagged || false}
            onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
          />
          {onDelete && (
            <DeleteButton
              onDelete={() => onDelete(item.id)}
              itemName={item.event_name}
              itemType="timeline event"
            />
          )}
        </div>
      </div>
      <InlineEditableField
        value={item.event_description || ''}
        onSave={(value) => onUpdateEventDescription(item.id, value)}
        placeholder="Add event description..."
        multiline
        className="text-sm text-slate-600 mb-2"
        fieldName="Event description"
      />
      <div className="flex flex-wrap gap-2 text-xs">
        {onUpdateEventType ? (
          <EditableSelect
            value={item.event_type}
            options={EVENT_TYPES}
            onSave={(value) => onUpdateEventType(item.id, value)}
            variant="secondary"
            className="text-xs"
            maxLength={200}
          />
        ) : (
          <Badge variant="secondary">{item.event_type}</Badge>
        )}
        {item.characters_involved_names && item.characters_involved_names.length > 0 && (
          <Badge variant="outline">Characters: {item.characters_involved_names.join(', ')}</Badge>
        )}
      </div>
    </Card>
  );
};