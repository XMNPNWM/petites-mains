
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Plus, BookOpen } from 'lucide-react';

interface WorldbuildingElement {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface StorylineContextMenuProps {
  children: React.ReactNode;
  worldbuildingElements: WorldbuildingElement[];
  onCreateNode: (nodeType: string, position: { x: number; y: number }) => void;
  onCreateFromWorldbuilding: (element: WorldbuildingElement, position: { x: number; y: number }) => void;
  contextPosition: { x: number; y: number } | null;
  onContextMenuTrigger: (position: { x: number; y: number }) => void;
}

const NODE_TYPES = [
  { value: 'scene', label: 'Scene' },
  { value: 'character', label: 'Character' },
  { value: 'location', label: 'Location' },
  { value: 'plot_point', label: 'Plot Point' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'resolution', label: 'Resolution' }
];

const StorylineContextMenu = ({
  children,
  worldbuildingElements,
  onCreateNode,
  onCreateFromWorldbuilding,
  contextPosition,
  onContextMenuTrigger
}: StorylineContextMenuProps) => {
  // Group worldbuilding elements by type
  const groupedElements = worldbuildingElements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, WorldbuildingElement[]>);

  const handleCreateNode = (nodeType: string) => {
    console.log('Context menu create node:', nodeType, 'at position:', contextPosition);
    if (contextPosition) {
      onCreateNode(nodeType, contextPosition);
    }
  };

  const handleCreateFromWorldbuilding = (element: WorldbuildingElement) => {
    console.log('Context menu create from worldbuilding:', element.name, 'at position:', contextPosition);
    if (contextPosition) {
      onCreateFromWorldbuilding(element, contextPosition);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    console.log('Context menu event triggered', e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
    
    // Get position relative to the trigger element
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    onContextMenuTrigger(position);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Plus className="w-4 h-4 mr-2" />
            Create New Node
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {NODE_TYPES.map((nodeType) => (
              <ContextMenuItem
                key={nodeType.value}
                onClick={() => handleCreateNode(nodeType.value)}
              >
                {nodeType.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {Object.keys(groupedElements).length > 0 && (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <BookOpen className="w-4 h-4 mr-2" />
                Add from Worldbuilding
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {Object.entries(groupedElements).map(([type, elements]) => (
                  <ContextMenuSub key={type}>
                    <ContextMenuSubTrigger>
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {elements.map((element) => (
                        <ContextMenuItem
                          key={element.id}
                          onClick={() => handleCreateFromWorldbuilding(element)}
                        >
                          {element.name}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default StorylineContextMenu;
