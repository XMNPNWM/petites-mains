
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
import { Plus, BookOpen, MessageSquare, Brain, ArrowRight, MessageCircle } from 'lucide-react';
import { SelectedTextContext } from '@/types/comments';

interface WorldbuildingElement {
  id: string;
  name: string;
  type: string;
  description?: string;
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
}

interface UnifiedContextMenuProps {
  children: React.ReactNode;
  worldbuildingElements: WorldbuildingElement[];
  // Writing context menu handlers
  onComment: (position: { x: number; y: number }, selectedText?: SelectedTextContext) => void;
  onCoherence: (position: { x: number; y: number }) => void;
  onNextSteps: (position: { x: number; y: number }) => void;
  onChat: (position: { x: number; y: number }) => void;
  // Storyline context menu handlers
  onCreateNode: (nodeType: string, position: { x: number; y: number }) => void;
  onCreateFromWorldbuilding: (element: WorldbuildingElement, position: { x: number; y: number }) => void;
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

const UnifiedContextMenu = ({
  children,
  worldbuildingElements,
  onComment,
  onCoherence,
  onNextSteps,
  onChat,
  onCreateNode,
  onCreateFromWorldbuilding
}: UnifiedContextMenuProps) => {
  const [contextPosition, setContextPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isStorylineArea, setIsStorylineArea] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Detect if right-click is in storyline area
    const target = e.target as HTMLElement;
    const isInStoryline = target.closest('[data-storyline-area]') !== null;
    setIsStorylineArea(isInStoryline);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    console.log('Unified context menu triggered at position:', position, 'isStoryline:', isInStoryline);
    setContextPosition(position);
  };

  const getSelectedTextContext = (): SelectedTextContext | null => {
    return (window as any).selectedTextContext || null;
  };

  // Storyline menu handlers
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

  const getCategoryDisplayName = (type: string) => {
    const nodeType = NODE_TYPES.find(nt => nt.value === type);
    return nodeType ? nodeType.label : type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Writing menu handlers
  const handleCommentClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Comment clicked, position:', contextPosition);
    if (contextPosition) {
      const selectedText = getSelectedTextContext();
      onComment(contextPosition, selectedText);
    }
  };

  const handleCoherenceClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Coherence clicked, position:', contextPosition);
    if (contextPosition) {
      onCoherence(contextPosition);
    }
  };

  const handleNextStepsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Next steps clicked, position:', contextPosition);
    if (contextPosition) {
      onNextSteps(contextPosition);
    }
  };

  const handleChatClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Chat clicked, position:', contextPosition);
    if (contextPosition) {
      onChat(contextPosition);
    }
  };

  const selectedText = getSelectedTextContext();

  return (
    <ContextMenu 
      onOpenChange={(open) => {
        console.log('Unified context menu open state changed:', open);
        if (!open) {
          setContextPosition(null);
          setIsStorylineArea(false);
        }
      }}
    >
      <ContextMenuTrigger 
        className="w-full h-full flex flex-col"
        onContextMenu={handleContextMenu}
        asChild
      >
        <div className="w-full h-full">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="w-56"
        style={{ zIndex: 310 }}
      >
        {isStorylineArea ? (
          // Storyline menu content
          <>
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
          </>
        ) : (
          // Writing menu content
          <>
            <ContextMenuItem 
              onClick={handleCommentClick}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span>Comment</span>
                {selectedText && (
                  <span className="text-xs text-slate-500 truncate max-w-40">
                    on "{selectedText.text}"
                  </span>
                )}
              </div>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={handleCoherenceClick}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <Brain className="w-4 h-4 text-purple-600" />
              <span>AI/Coherence</span>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={handleNextStepsClick}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <ArrowRight className="w-4 h-4 text-green-600" />
              <span>AI/Next Steps</span>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={handleChatClick}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <MessageCircle className="w-4 h-4 text-orange-600" />
              <span>Chat</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default UnifiedContextMenu;
