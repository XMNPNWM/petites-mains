
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
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form data when element prop changes
  useEffect(() => {
    if (element) {
      setFormData({
        name: element.name,
        type: element.type,
        description: element.description || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'character',
        description: ''
      });
    }
  }, [element]);

  const getTypeOptions = () => {
    return [
      'scene', 'character', 'location', 'lore', 'event', 
      'organization', 'religion', 'politics', 'artifact'
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (element) {
        // Update existing element
        const { error } = await supabase
          .from('worldbuilding_elements')
          .update({
            name: formData.name,
            type: formData.type,
            description: formData.description
          })
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
          .insert([{
            project_id: projectId,
            name: formData.name,
            type: formData.type,
            description: formData.description,
            created_from_storyline: false
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Element created",
          description: "Worldbuilding element has been created successfully.",
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error saving element:', error);
      toast({
        title: "Error",
        description: "Failed to save element",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this element..."
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
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : (element ? 'Update Element' : 'Save Element')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ElementForm;
