
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
  onContextMenuTrigger: (position: { x: number; y: number }) => void;
}

const NODE_TYPES = [
  { value: 'scene', label: 'Scene' },
  { value: 'character', label: 'Characters' },
  { value: 'location', label: 'Locations' },
  { value: 'lore', label: 'Lore' },
  { value: 'event', label: 'Events' },
  { value: 'organization', label: 'Organizations' },
  { value: 'religion', label: 'Religion' },
  { value: 'politics', label: 'Politics' },
  { value: 'artifact', label: 'Artifacts' }
];

const StorylineContextMenu = ({
  children,
  worldbuildingElements,
  onCreateNode,
  onCreateFromWorldbuilding,
  onContextMenuTrigger
}: StorylineContextMenuProps) => {
  const [contextPosition, setContextPosition] = React.useState<{ x: number; y: number } | null>(null);

  // Group worldbuilding elements by type
  const groupedElements = worldbuildingElements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, WorldbuildingElement[]>);

  const handleCreateNode = (nodeType: string) => {
    if (contextPosition) {
      onCreateNode(nodeType, contextPosition);
    }
  };

  const handleCreateFromWorldbuilding = (element: WorldbuildingElement) => {
    if (contextPosition) {
      onCreateFromWorldbuilding(element, contextPosition);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setContextPosition(position);
    onContextMenuTrigger(position);
  };

  return (
    <ContextMenu 
      onOpenChange={(open) => {
        if (!open) {
          setContextPosition(null);
        }
      }}
    >
      <ContextMenuTrigger 
        className="w-full h-full flex flex-col"
        onContextMenu={handleContextMenu}
      >
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
