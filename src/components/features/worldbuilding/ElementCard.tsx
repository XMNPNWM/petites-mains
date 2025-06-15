
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WorldbuildingElement, WorldbuildingElementMock, convertMockToWorldbuildingElement } from '@/types/worldbuilding';

interface ElementCardProps {
  element: WorldbuildingElement | WorldbuildingElementMock;
  onEdit?: (element: WorldbuildingElement) => void;
  onDelete?: (id: string) => void;
}

interface LinkedNode {
  id: string;
  title: string;
  position: { x: number; y: number };
  created_at: string;
}

const ElementCard = ({ element, onEdit, onDelete }: ElementCardProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [linkedNodes, setLinkedNodes] = useState<LinkedNode[]>([]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);

  // Convert mock element to proper WorldbuildingElement if needed
  const worldbuildingElement: WorldbuildingElement = typeof element.id === 'number' 
    ? convertMockToWorldbuildingElement(element as WorldbuildingElementMock)
    : element as WorldbuildingElement;

  const findLinkedNodes = async (): Promise<LinkedNode[]> => {
    try {
      console.log('Finding linked nodes for element:', worldbuildingElement.name);
      
      // First, get the project_id for this element
      const { data: elementData, error: elementError } = await supabase
        .from('worldbuilding_elements')
        .select('project_id')
        .eq('id', worldbuildingElement.id)
        .single();

      if (elementError || !elementData) {
        console.error('Error getting element project:', elementError);
        return [];
      }

      // Find storyline nodes that reference this worldbuilding element by name or content
      const { data: nodes, error } = await supabase
        .from('storyline_nodes')
        .select('id, title, position, created_at, content')
        .eq('project_id', elementData.project_id)
        .not('position', 'is', null);

      if (error) {
        console.error('Error finding linked nodes:', error);
        return [];
      }

      // Filter nodes that contain references to this worldbuilding element
      const filteredNodes = (nodes || []).filter(node => {
        const elementName = worldbuildingElement.name.toLowerCase();
        const nodeTitle = node.title.toLowerCase();
        const nodeContent = (node.content || '').toLowerCase();
        
        return nodeTitle.includes(elementName) || nodeContent.includes(elementName);
      });

      // Transform and sort by creation date
      const linkedNodes: LinkedNode[] = filteredNodes
        .map(node => ({
          id: node.id,
          title: node.title,
          position: typeof node.position === 'string' ? JSON.parse(node.position) : node.position,
          created_at: node.created_at
        }))
        .filter(node => node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      console.log(`Found ${linkedNodes.length} linked nodes for "${worldbuildingElement.name}":`, linkedNodes);
      return linkedNodes;
    } catch (error) {
      console.error('Error finding linked nodes:', error);
      return [];
    }
  };

  const navigateToNode = (nodeId: string, position: { x: number; y: number }) => {
    console.log('Navigating to storyline node:', nodeId, position);
    
    // Dispatch custom event for storyline panel to listen to
    const event = new CustomEvent('navigateToStorylineNode', {
      detail: { 
        nodeId, 
        position,
        elementName: worldbuildingElement.name
      }
    });
    window.dispatchEvent(event);
  };

  const handleViewInStoryline = async () => {
    setIsNavigating(true);
    try {
      const nodes = await findLinkedNodes();
      
      if (nodes.length === 0) {
        console.warn('No linked storyline nodes found for:', worldbuildingElement.name);
        alert(`No storyline nodes found that reference "${worldbuildingElement.name}". Create nodes in the storyline that mention this element to establish links.`);
        return;
      }

      setLinkedNodes(nodes);
      setCurrentNodeIndex(0);
      setShowNavigation(nodes.length > 1);
      
      // Navigate to the first node
      navigateToNode(nodes[0].id, nodes[0].position);
      
    } catch (error) {
      console.error('Error navigating to storyline:', error);
      alert('Error navigating to storyline. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePreviousNode = () => {
    if (linkedNodes.length === 0) return;
    
    const newIndex = currentNodeIndex === 0 ? linkedNodes.length - 1 : currentNodeIndex - 1;
    setCurrentNodeIndex(newIndex);
    navigateToNode(linkedNodes[newIndex].id, linkedNodes[newIndex].position);
  };

  const handleNextNode = () => {
    if (linkedNodes.length === 0) return;
    
    const newIndex = (currentNodeIndex + 1) % linkedNodes.length;
    setCurrentNodeIndex(newIndex);
    navigateToNode(linkedNodes[newIndex].id, linkedNodes[newIndex].position);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      character: 'bg-blue-100 text-blue-800',
      protagonist: 'bg-blue-100 text-blue-800',
      antagonist: 'bg-red-100 text-red-800',
      supporting: 'bg-green-100 text-green-800',
      location: 'bg-green-100 text-green-800',
      forest: 'bg-green-100 text-green-800',
      castle: 'bg-purple-100 text-purple-800',
      item: 'bg-purple-100 text-purple-800',
      concept: 'bg-orange-100 text-orange-800',
      event: 'bg-red-100 text-red-800',
      'historical event': 'bg-red-100 text-red-800',
      'secret society': 'bg-gray-100 text-gray-800'
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{worldbuildingElement.name}</CardTitle>
            <Badge className={getTypeColor(worldbuildingElement.type)}>
              {worldbuildingElement.type}
            </Badge>
          </div>
          <div className="flex gap-1 ml-2">
            {/* Navigation Controls - only show when we have multiple nodes */}
            {showNavigation && linkedNodes.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousNode}
                  className="h-6 w-6 p-0"
                  title="Previous linked node"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-slate-500 px-1">
                  {currentNodeIndex + 1}/{linkedNodes.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextNode}
                  className="h-6 w-6 p-0"
                  title="Next linked node"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewInStoryline}
              disabled={isNavigating}
              className="h-8 w-8 p-0"
              title="View in Storyline"
            >
              <Map className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(worldbuildingElement)}
                className="h-8 w-8 p-0"
                title="Edit Element"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(worldbuildingElement.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Delete Element"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {worldbuildingElement.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-slate-600 line-clamp-3">
            {worldbuildingElement.description}
          </p>
          {showNavigation && linkedNodes.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Found in {linkedNodes.length} storyline node{linkedNodes.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ElementCard;
