import React from 'react';
import { Card } from '@/components/ui/card';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { EditableSelect } from '@/components/ui/editable-select';
import { DeleteButton } from '@/components/ui/delete-button';

interface EditableWorldBuildingCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    subcategory?: string;
    confidence_score?: number;
    ai_confidence_new?: number;
    is_flagged?: boolean;
  };
  onUpdateName: (id: string, value: string) => Promise<void>;
  onUpdateType?: (id: string, value: string) => Promise<void>;
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const WORLD_BUILDING_TYPES = [
  'Location',
  'Organization',
  'Culture',
  'Magic System',
  'Technology',
  'Religion'
];

export const EditableWorldBuildingCard: React.FC<EditableWorldBuildingCardProps> = ({
  item,
  onUpdateName,
  onUpdateType,
  onToggleFlag,
  onDelete
}) => {
  return (
    <Card 
      className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <InlineEditableField
          value={item.name}
          onSave={(value) => onUpdateName(item.id, value)}
          placeholder="World building element name..."
          className="font-medium text-slate-900 flex-1"
          fieldName="Name"
        />
        <div className="flex items-center space-x-2 ml-2">
          <ConfidenceBadge 
            confidence={item.confidence_score || item.ai_confidence_new || 0}
          />
          <FlagToggleButton
            isFlagged={item.is_flagged || false}
            onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
          />
          {onDelete && (
            <DeleteButton
              onDelete={() => onDelete(item.id)}
              itemName={item.name}
              itemType="world building element"
            />
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs mb-2">
        {onUpdateType ? (
          <EditableSelect
            value={item.subcategory || 'Location'}
            options={WORLD_BUILDING_TYPES}
            onSave={(value) => onUpdateType(item.id, value)}
            variant="outline"
            className="text-xs"
            maxLength={200}
          />
        ) : (
          item.subcategory && (
            <span className="text-xs text-slate-500">{item.subcategory}</span>
          )
        )}
      </div>
      
      {item.description && (
        <p className="text-sm text-slate-600">{item.description}</p>
      )}
    </Card>
  );
};