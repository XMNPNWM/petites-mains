
import React from 'react';
import { MoreHorizontal, Edit3, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Element {
  id: number;
  name: string;
  type: string;
  description: string;
  tags: string[];
  image: string;
}

interface ElementCardProps {
  element: Element;
}

const ElementCard = ({ element }: ElementCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Image/Avatar */}
        <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-t-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {element.name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">{element.name}</h3>
              <p className="text-purple-600 text-sm font-medium">{element.type}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
            {element.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {element.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {element.tags.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                +{element.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementCard;
