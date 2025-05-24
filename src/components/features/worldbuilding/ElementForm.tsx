
import React, { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ElementFormProps {
  isOpen: boolean;
  onClose: () => void;
  elementType: string;
}

const ElementForm = ({ isOpen, onClose, elementType }: ElementFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    tags: '',
    details: ''
  });

  const getTypeOptions = () => {
    const options = {
      characters: ['Protagonist', 'Antagonist', 'Supporting', 'Minor'],
      locations: ['City', 'Town', 'Forest', 'Castle', 'Dungeon', 'Temple'],
      lore: ['Historical Event', 'Legend', 'Prophecy', 'Custom', 'Religion'],
      organizations: ['Guild', 'Kingdom', 'Secret Society', 'Military', 'Religious']
    };
    return options[elementType as keyof typeof options] || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            Add New {elementType.charAt(0).toUpperCase() + elementType.slice(0, -1)}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
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
                  <SelectItem key={option} value={option.toLowerCase()}>
                    {option}
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
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Element
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElementForm;
