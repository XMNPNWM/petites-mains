import React from 'react';
import { Card } from '@/components/ui/card';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { EditableSelect } from '@/components/ui/editable-select';

interface EditableKnowledgeCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    confidence_score?: number;
    is_verified?: boolean;
    is_flagged?: boolean;
    evidence?: string;
    category?: string;
    subcategory?: string;
  };
  onUpdateName: (id: string, value: string) => Promise<void>;
  onUpdateDescription: (id: string, value: string) => Promise<void>;
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateSubcategory?: (id: string, value: string) => Promise<void>;
  nameFieldName: string;
  descriptionFieldName: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
}

export const EditableKnowledgeCard: React.FC<EditableKnowledgeCardProps> = ({
  item,
  onUpdateName,
  onUpdateDescription,
  onToggleFlag,
  onDelete,
  onUpdateSubcategory,
  nameFieldName,
  descriptionFieldName,
  namePlaceholder,
  descriptionPlaceholder
}) => {
  const worldBuildingTypes = [
    'Location', 'Organization', 'Culture', 'Magic System', 'Technology', 'Religion', 'Custom'
  ];
  return (
    <Card 
      className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <InlineEditableField
          value={item.name}
          onSave={(value) => onUpdateName(item.id, value)}
          placeholder={namePlaceholder}
          className="font-medium text-slate-900 flex-1"
          fieldName={nameFieldName}
        />
        <div className="flex items-center space-x-2 ml-2">
          <ConfidenceBadge 
            confidence={item.confidence_score || 0} 
            isUserModified={item.is_verified}
          />
          <FlagToggleButton
            isFlagged={item.is_flagged || false}
            onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
          />
          {onDelete && (
            <DeleteButton
              onDelete={() => onDelete(item.id)}
              itemName={item.name}
              itemType="character"
            />
          )}
        </div>
      </div>
      <InlineEditableField
        value={item.description || ''}
        onSave={(value) => onUpdateDescription(item.id, value)}
        placeholder={descriptionPlaceholder}
        multiline
        className="text-sm text-slate-600 mb-2"
        fieldName={descriptionFieldName}
      />
      {item.category === 'world_building' && onUpdateSubcategory && (
        <div className="mb-2">
          <EditableSelect
            value={item.subcategory || 'Custom'}
            options={worldBuildingTypes}
            onSave={(value) => onUpdateSubcategory(item.id, value)}
            placeholder="Select type..."
            variant="secondary"
          />
        </div>
      )}
      {item.evidence && (
        <p className="text-xs text-slate-500 italic">"{item.evidence}"</p>
      )}
    </Card>
  );
};