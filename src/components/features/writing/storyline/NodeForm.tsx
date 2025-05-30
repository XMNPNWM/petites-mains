
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StorylineNode, NodeFormData } from './types';
import { NODE_TYPES } from './constants/nodeConstants';

interface NodeFormProps {
  isVisible: boolean;
  editingNode: StorylineNode | null;
  formData: NodeFormData;
  onFormChange: (field: keyof NodeFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const NodeForm = ({ isVisible, editingNode, formData, onFormChange, onSubmit, onCancel }: NodeFormProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <Card className="w-80 max-w-full mx-4">
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">
            {editingNode ? 'Edit Node' : 'Create New Node'}
          </h3>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => onFormChange('title', e.target.value)}
                required
                className="text-sm h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.node_type}
                onChange={(e) => onFormChange('node_type', e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm h-8"
              >
                {NODE_TYPES.map((nodeType) => (
                  <option key={nodeType.value} value={nodeType.value}>
                    {nodeType.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => onFormChange('content', e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 text-xs h-7">
                {editingNode ? 'Update' : 'Create'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="text-xs h-7"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeForm;
