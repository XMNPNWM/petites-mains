import React from 'react';
import { Heart } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { RelationshipCard } from '../cards/RelationshipCard';

export const RelationshipsTab: React.FC<TabComponentProps> = ({
  data,
  onToggleCharacterRelationshipFlag,
  onDataRefresh
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No character relationships found with current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((relationship) => (
        <RelationshipCard
          key={relationship.id}
          item={relationship}
          onToggleFlag={onToggleCharacterRelationshipFlag}
          onUpdate={onDataRefresh}
        />
      ))}
    </div>
  );
};