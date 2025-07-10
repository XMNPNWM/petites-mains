import React from 'react';
import { Globe } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditableKnowledgeCard } from '../cards/EditableKnowledgeCard';
import { UnifiedUpdateService } from '@/services/UnifiedUpdateService';
import { useToast } from '@/hooks/use-toast';

export const WorldBuildingTab: React.FC<TabComponentProps> = ({ 
  data, 
  onDataRefresh,
  onUpdateKnowledge,
  onToggleKnowledgeFlag,
  onDeleteKnowledgeItem
}) => {
  const { toast } = useToast();
  const worldBuildingElements = data.filter(k => k.category === 'world_building');

  if (worldBuildingElements.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No world building elements found. Try running an analysis first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {worldBuildingElements.map((element) => (
        <EditableKnowledgeCard
          key={element.id}
          item={element}
          onUpdateName={(id, value) => onUpdateKnowledge(id, 'name', value)}
          onUpdateDescription={(id, value) => onUpdateKnowledge(id, 'description', value)}
          onToggleFlag={onToggleKnowledgeFlag}
          onDelete={async (id) => {
            await onDeleteKnowledgeItem?.(id);
          }}
          nameFieldName="World building element name"
          descriptionFieldName="World building description"
          namePlaceholder="World building element name..."
          descriptionPlaceholder="Add world building description..."
        />
      ))}
    </div>
  );
};