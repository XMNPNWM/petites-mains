import React from 'react';
import { Card } from '@/components/ui/card';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { EditableSelect } from '@/components/ui/editable-select';
import { ChapterBadge } from '../ChapterBadge';

interface EditableKnowledgeCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    confidence_score?: number;
    is_verified?: boolean;
    is_flagged?: boolean;
    is_newly_extracted?: boolean;
    evidence?: string;
    category?: string;
    subcategory?: string;
    source_chapter_id?: string | null;
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
  chapters?: Array<{
    id: string;
    title: string;
    order_index: number;
  }>;
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
  descriptionPlaceholder,
  chapters
}) => {
  const worldBuildingTypes = [
    'Location', 'Organization', 'Culture', 'Magic System', 'Technology', 'Religion', 'Custom'
  ];
  
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
          value={item.name}
          onSave={(value) => onUpdateName(item.id, value)}
          placeholder={namePlaceholder}
          className="font-medium text-slate-900 flex-1"
          fieldName={nameFieldName}
        />
        <div className="flex items-center space-x-2 ml-2">
          <ChapterBadge 
            chapterId={item.source_chapter_id} 
            chapters={chapters}
          />
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