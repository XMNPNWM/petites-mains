
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Map } from 'lucide-react';
import { useStorylineWorldbuildingNavigation } from '@/hooks/useStorylineWorldbuildingNavigation';

interface WorldbuildingElement {
  id: string;
  name: string;
  type: string;
  description: string | null;
  details?: any; // Make details optional to handle mock data
}

interface ElementCardProps {
  element: WorldbuildingElement;
  onEdit?: (element: WorldbuildingElement) => void;
  onDelete?: (id: string) => void;
}

const ElementCard = ({ element, onEdit, onDelete }: ElementCardProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const { navigateToWorldbuildingElement } = useStorylineWorldbuildingNavigation();

  const handleViewInStoryline = async () => {
    setIsNavigating(true);
    try {
      await navigateToWorldbuildingElement(element.id);
    } catch (error) {
      console.error('Error navigating to storyline:', error);
    } finally {
      setIsNavigating(false);
    }
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
            <CardTitle className="text-lg font-semibold mb-2">{element.name}</CardTitle>
            <Badge className={getTypeColor(element.type)}>
              {element.type}
            </Badge>
          </div>
          <div className="flex gap-1 ml-2">
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
                onClick={() => onEdit(element)}
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
                onClick={() => onDelete(element.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Delete Element"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {element.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-slate-600 line-clamp-3">
            {element.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default ElementCard;
