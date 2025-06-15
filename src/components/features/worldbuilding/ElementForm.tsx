
import React, { useState, useEffect } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { WorldbuildingElement } from '@/types/worldbuilding';
import { useToast } from '@/hooks/use-toast';

interface ElementFormProps {
  projectId: string;
  element?: WorldbuildingElement | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const ElementForm = ({ projectId, element, onSubmit, onCancel }: ElementFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    tags: '',
    details: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (element) {
      setFormData({
        name: element.name,
        type: element.type,
        description: element.description || '',
        tags: element.tags?.join(', ') || '',
        details: element.details ? JSON.stringify(element.details) : ''
      });
    } else {
      setFormData({
        name: '',
        type: 'character',
        description: '',
        tags: '',
        details: ''
      });
    }
  }, [element]);

  const getTypeOptions = () => {
    return [
      'character', 'location', 'lore', 'event', 'organization', 
      'religion', 'politics', 'artifact', 'scene'
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Name and type are required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const elementData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        details: formData.details ? JSON.parse(formData.details) : null,
        project_id: projectId
      };

      if (element) {
        // Update existing element
        const { error } = await supabase
          .from('worldbuilding_elements')
          .update(elementData)
          .eq('id', element.id);

        if (error) throw error;

        toast({
          title: "Element updated",
          description: "Worldbuilding element has been updated successfully.",
        });
      } else {
        // Create new element
        const { error } = await supabase
          .from('worldbuilding_elements')
          .insert([elementData]);

        if (error) throw error;

        toast({
          title: "Element created",
          description: "New worldbuilding element has been created successfully.",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving element:', error);
      toast({
        title: "Error",
        description: "Failed to save element. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            {element ? 'Edit Element' : 'Add New Element'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-slate-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" accept="image/*" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name..."
                className="mt-1"
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this element..."
                className="mt-1"
                rows={3}
                required
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas..."
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas</p>
            </div>

            {/* Additional Details */}
            <div>
              <Label htmlFor="details">Additional Details</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Add any additional details, backstory, or notes..."
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : (element ? 'Update Element' : 'Save Element')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElementForm;
