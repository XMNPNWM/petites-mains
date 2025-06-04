
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
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
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

  const synchronizedElements = worldbuildingElements.filter(element => 
    element.created_from_storyline === true && element.storyline_node_id !== null
  );

  const groupedElements = synchronizedElements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, WorldbuildingElement[]>);

  const handleCreateNode = (nodeType: string) => {
    if (contextPosition) {
      console.log('Creating node:', nodeType, 'at position:', contextPosition);
      onCreateNode(nodeType, contextPosition);
    }
  };

  const handleCreateFromWorldbuilding = (element: WorldbuildingElement) => {
    if (contextPosition) {
      console.log('Creating node from worldbuilding:', element.name, 'at position:', contextPosition);
      onCreateFromWorldbuilding(element, contextPosition);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    console.log('Storyline context menu triggered at position:', position);
    setContextPosition(position);
    onContextMenuTrigger(position);
  };

  const getCategoryDisplayName = (type: string) => {
    const nodeType = NODE_TYPES.find(nt => nt.value === type);
    return nodeType ? nodeType.label : type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <ContextMenu 
      onOpenChange={(open) => {
        console.log('Storyline context menu open state changed:', open);
        if (!open) {
          setContextPosition(null);
        }
      }}
    >
      <ContextMenuTrigger 
        className="w-full h-full flex flex-col"
        onContextMenu={handleContextMenu}
        asChild
      >
        <div 
          className="w-full h-full"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="w-56"
        style={{ zIndex: 310 }}
      >
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Plus className="w-4 h-4 mr-2" />
            Create New Node
          </ContextMenuSubTrigger>
          <ContextMenuSubContent style={{ zIndex: 320 }}>
            {NODE_TYPES.map((nodeType) => (
              <ContextMenuItem
                key={nodeType.value}
                onClick={() => handleCreateNode(nodeType.value)}
                onSelect={(e) => e.preventDefault()}
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
              <ContextMenuSubContent style={{ zIndex: 320 }}>
                {Object.entries(groupedElements).map(([type, elements]) => (
                  <ContextMenuSub key={type}>
                    <ContextMenuSubTrigger>
                      {getCategoryDisplayName(type)}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent style={{ zIndex: 330 }}>
                      {elements.map((element) => (
                        <ContextMenuItem
                          key={element.id}
                          onClick={() => handleCreateFromWorldbuilding(element)}
                          onSelect={(e) => e.preventDefault()}
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
