import React from 'react';
import { Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabComponentProps } from '@/types/ai-brain-tabs';

export const WorldBuildingTab: React.FC<TabComponentProps> = ({ data }) => {
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
        <Card key={element.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h5 className="font-medium text-slate-900">{element.name}</h5>
            <Badge variant="outline">{element.type}</Badge>
          </div>
          <p className="text-sm text-slate-600 mb-2">{element.description}</p>
        </Card>
      ))}
    </div>
  );
};