import React from 'react';
import { Globe } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditableWorldBuildingCard } from '../cards/EditableWorldBuildingCard';
import { UnifiedUpdateService } from '@/services/UnifiedUpdateService';
import { useToast } from '@/hooks/use-toast';

export const WorldBuildingTab: React.FC<TabComponentProps> = ({ data, onDataRefresh }) => {
  const { toast } = useToast();

  const handleUpdateName = async (id: string, name: string) => {
    try {
      await UnifiedUpdateService.updateWorldBuildingName(id, name);
      toast({
        title: "Name updated",
        description: `World building element name changed to "${name}"`,
      });
      onDataRefresh?.();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : 'Failed to update name',
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateType = async (id: string, type: string) => {
    try {
      await UnifiedUpdateService.updateWorldBuildingType(id, type);
      toast({
        title: "Type updated",
        description: `World building element type changed to "${type}"`,
      });
      onDataRefresh?.();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : 'Failed to update type',
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await UnifiedUpdateService.deleteKnowledgeItem(id);
      toast({
        title: "Element deleted",
        description: "World building element has been deleted",
      });
      onDataRefresh?.();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : 'Failed to delete element',
        variant: "destructive",
      });
      throw error;
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No world building elements found. Try running an analysis first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((element) => (
        <EditableWorldBuildingCard
          key={element.id}
          item={element}
          onUpdateName={handleUpdateName}
          onUpdateType={handleUpdateType}
          onToggleFlag={async (id, isFlagged) => {
            try {
              await UnifiedUpdateService.toggleKnowledgeFlag(id, isFlagged);
              onDataRefresh?.();
            } catch (error) {
              toast({
                title: "Flag update failed",
                description: error instanceof Error ? error.message : 'Failed to update flag',
                variant: "destructive",
              });
            }
          }}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};