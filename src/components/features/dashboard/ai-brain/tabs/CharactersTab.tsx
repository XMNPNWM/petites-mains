import React from 'react';
import { Users } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditableKnowledgeCard } from '../cards/EditableKnowledgeCard';

export const CharactersTab: React.FC<TabComponentProps> = ({
  data,
  onUpdateKnowledge,
  onToggleKnowledgeFlag,
  onDeleteKnowledgeItem,
  onDataRefresh
}) => {
  const characters = data.filter(k => k.category === 'character');

  if (characters.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No characters found with current filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {characters.map((character) => (
        <EditableKnowledgeCard
          key={character.id}
          item={character}
          onUpdateName={(id, value) => onUpdateKnowledge(id, 'name', value)}
          onUpdateDescription={(id, value) => onUpdateKnowledge(id, 'description', value)}
          onToggleFlag={onToggleKnowledgeFlag}
          onDelete={async (id) => {
            await onDeleteKnowledgeItem?.(id);
            onDataRefresh?.();
          }}
          nameFieldName="Character name"
          descriptionFieldName="Character description"
          namePlaceholder="Character name..."
          descriptionPlaceholder="Add character description..."
        />
      ))}
    </div>
  );
};