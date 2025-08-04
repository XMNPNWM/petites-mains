import React from 'react';
import { Lightbulb } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditableKnowledgeCard } from '../cards/EditableKnowledgeCard';
import { SynthesizedEntityCard } from '../cards/SynthesizedEntityCard';

export const ThemesTab: React.FC<TabComponentProps> = ({
  data,
  onUpdateKnowledge,
  onToggleKnowledgeFlag,
  isSynthesizedView = false,
  onResynthesize
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No themes found. Try running an analysis first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((theme) => {
        if (isSynthesizedView) {
          return (
            <SynthesizedEntityCard
              key={theme.id}
              item={theme}
              onUpdateName={(id, value) => onUpdateKnowledge(id, 'name', value)}
              onUpdateDescription={(id, value) => onUpdateKnowledge(id, 'description', value)}
              onToggleFlag={onToggleKnowledgeFlag}
              onResynthesize={onResynthesize}
              nameFieldName="Theme name"
              descriptionFieldName="Theme description"
              namePlaceholder="Theme name..."
              descriptionPlaceholder="Add theme description..."
            />
          );
        }
        
        return (
          <EditableKnowledgeCard
            key={theme.id}
            item={theme}
            onUpdateName={(id, value) => onUpdateKnowledge(id, 'name', value)}
            onUpdateDescription={(id, value) => onUpdateKnowledge(id, 'description', value)}
            onToggleFlag={onToggleKnowledgeFlag}
            nameFieldName="Theme name"
            descriptionFieldName="Theme description"
            namePlaceholder="Theme name..."
            descriptionPlaceholder="Add theme description..."
          />
        );
      })}
    </div>
  );
};