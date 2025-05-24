
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface WorldElement {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface WorldbuildingPanelProps {
  projectId: string;
}

const WorldbuildingPanel = ({ projectId }: WorldbuildingPanelProps) => {
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'character',
    description: ''
  });

  useEffect(() => {
    fetchElements();
  }, [projectId]);

  const fetchElements = async () => {
    try {
      const { data, error } = await supabase
        .from('worldbuilding_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElements(data || []);
    } catch (error) {
      console.error('Error fetching elements:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingElement) {
        const { error } = await supabase
          .from('worldbuilding_elements')
          .update(formData)
          .eq('id', editingElement.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('worldbuilding_elements')
          .insert([{ ...formData, project_id: projectId }]);
        
        if (error) throw error;
      }
      
      setFormData({ name: '', type: 'character', description: '' });
      setShowForm(false);
      setEditingElement(null);
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
    }
  };

  const handleEdit = (element: WorldElement) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      type: element.type,
      description: element.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('worldbuilding_elements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const filteredElements = elements.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Worldbuilding</h2>
          <Button 
            size="sm" 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search elements..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Elements List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredElements.map((element) => (
          <Card key={element.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 text-sm">{element.name}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded mt-1 inline-block">
                    {element.type}
                  </span>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{element.description}</p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => handleEdit(element)}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => handleDelete(element.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="absolute inset-0 bg-white z-10 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              {editingElement ? 'Edit Element' : 'New Element'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="object">Object</option>
                <option value="concept">Concept</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600">
                {editingElement ? 'Update' : 'Create'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingElement(null);
                  setFormData({ name: '', type: 'character', description: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorldbuildingPanel;
