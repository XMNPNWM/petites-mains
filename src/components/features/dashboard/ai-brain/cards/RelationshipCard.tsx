import React from 'react';
import { Card } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { EditableSelect } from '@/components/ui/editable-select';
import { DeleteButton } from '@/components/ui/delete-button';
import { UnifiedUpdateService } from '@/services/UnifiedUpdateService';
import { useToast } from '@/hooks/use-toast';

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
  onUpdate?: () => void;
  onDelete?: (id: string) => Promise<void>;
}

const RELATIONSHIP_TYPES = [
  'Friend',
  'Enemy', 
  'Family',
  'Romantic',
  'Mentor',
  'Rival',
  'Ally'
];

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  item,
  onToggleFlag,
  onUpdate,
  onDelete
}) => {
  const { toast } = useToast();

  const handleUpdateRelationshipType = async (newType: string) => {
    try {
      await UnifiedUpdateService.updateCharacterRelationshipType(item.id, newType);
      toast({
        title: "Relationship updated",
        description: `Relationship type changed to "${newType}"`,
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : 'Failed to update relationship type',
        variant: "destructive",
      });
      throw error;
    }
  };
  return (
    <Card 
      className={`p-4 ${item.is_flagged ? 'border-red-200 bg-red-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="font-medium text-slate-900">
            {item.character_a_name} ↔ {item.character_b_name}
          </h5>
          <div className="mt-1">
            <EditableSelect
              value={item.relationship_type}
              options={RELATIONSHIP_TYPES}
              onSave={handleUpdateRelationshipType}
              variant="secondary"
              className="text-xs"
              maxLength={200}
            />
          </div>
        </div>
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
              itemName={`${item.character_a_name} ↔ ${item.character_b_name}`}
              itemType="relationship"
            />
          )}
        </div>
      </div>
      {item.evidence && (
        <p className="text-xs text-slate-500 italic">"{item.evidence}"</p>
      )}
    </Card>
  );
};