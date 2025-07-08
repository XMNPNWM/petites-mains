import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';

interface RelationshipCardProps {
  item: {
    id: string;
    character_a_name: string;
    character_b_name: string;
    relationship_type: string;
    ai_confidence_new?: number;
    is_flagged?: boolean;
    evidence?: string;
  };
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  item,
  onToggleFlag
}) => {
  return (
    <Card 
      className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="font-medium text-slate-900">
            {item.character_a_name} ↔ {item.character_b_name}
          </h5>
          <Badge variant="secondary" className="text-xs mt-1">
            {item.relationship_type}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <ConfidenceBadge 
            confidence={item.ai_confidence_new || 0}
          />
          <FlagToggleButton
            isFlagged={item.is_flagged || false}
            onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
          />
        </div>
      </div>
      {item.evidence && (
        <p className="text-xs text-slate-500 italic">"{item.evidence}"</p>
      )}
    </Card>
  );
};