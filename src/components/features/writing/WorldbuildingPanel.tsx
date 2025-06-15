import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, ChevronDown, ChevronRight, Link, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useStorylineWorldbuildingNavigation } from '@/hooks/useStorylineWorldbuildingNavigation';

interface WorldElement {
  id: string;
  name: string;
  type: string;
  description: string;
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
}

interface WorldbuildingPanelProps {
  projectId: string;
  refreshTrigger?: number;
}

const CATEGORIES = [
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

const WorldbuildingPanel = ({ projectId, refreshTrigger }: WorldbuildingPanelProps) => {
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    type: 'scene',
    description: ''
  });

  const {
    isNavigating,
    linkedNodes,
    currentNodeIndex,
    navigateToWorldbuildingElement,
    navigateToNextNode,
    navigateToPreviousNode
  } = useStorylineWorldbuildingNavigation();

  const fetchElements = async () => {
    try {
      console.log('WorldbuildingPanel: Fetching elements...');
      const { data, error } = await supabase
        .from('worldbuilding_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('WorldbuildingPanel: Fetched elements:', data);
      setElements(data || []);
    } catch (error) {
      console.error('Error fetching elements:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchElements();
  }, [projectId]);

  // Refresh when trigger changes (from storyline updates)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('WorldbuildingPanel: Refresh triggered by storyline change');
      fetchElements();
    }
  }, [refreshTrigger]);

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
          .insert([{ 
            ...formData, 
            project_id: projectId,
            created_from_storyline: false
          }]);
        
        if (error) throw error;
      }
      
      setFormData({ name: '', type: 'scene', description: '' });
      setShowForm(false);
      setEditingElement(null);
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
    }
  };

  const handleEdit = (element: WorldElement) => {
    // Prevent editing elements that are linked to storyline nodes
    if (element.storyline_node_id) {
      alert('This element is linked to a storyline node. Edit it from the storyline map to sync changes.');
      return;
    }

    setEditingElement(element);
    setFormData({
      name: element.name,
      type: element.type,
      description: element.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const element = elements.find(el => el.id === id);
    
    // Prevent deleting elements that are linked to storyline nodes
    if (element?.storyline_node_id) {
      alert('This element is linked to a storyline node. Delete it from the storyline map to remove the link.');
      return;
    }

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

  const toggleCategory = (categoryType: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryType)) {
      newCollapsed.delete(categoryType);
    } else {
      newCollapsed.add(categoryType);
    }
    setCollapsedCategories(newCollapsed);
  };

  const filteredElements = elements.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group elements by category
  const groupedElements = CATEGORIES.reduce((acc, category) => {
    acc[category.value] = filteredElements.filter(element => element.type === category.value);
    return acc;
  }, {} as Record<string, WorldElement[]>);

  // Handle button clicks to prevent context menu propagation when needed
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Handle navigation to storyline
  const handleNavigateToStoryline = async (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    await navigateToWorldbuildingElement(elementId);
  };

  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Worldbuilding</h2>
          <Button 
            size="sm" 
            onClick={(e) => handleButtonClick(e, () => setShowForm(true))}
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

      {/* Categories and Elements */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map((category) => {
          const categoryElements = groupedElements[category.value];
          const isCollapsed = collapsedCategories.has(category.value);
          
          if (categoryElements.length === 0 && searchTerm) return null;

          return (
            <div key={category.value} className="border-b border-slate-100">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleCategory(category.value)}
              >
                <div className="flex items-center space-x-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <h3 className="font-medium text-slate-700 text-sm">{category.label}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {categoryElements.length}
                  </span>
                </div>
              </div>

              {/* Category Elements */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-2">
                  {categoryElements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-6">No {category.label.toLowerCase()} yet</p>
                  ) : (
                    categoryElements.map((element) => (
                      <Card key={element.id} className="hover:shadow-md transition-shadow ml-6">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900 text-sm">{element.name}</h4>
                                {element.storyline_node_id && (
                                  <div className="flex items-center gap-1">
                                    <Link className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                      {element.created_from_storyline ? 'Synced' : 'Linked'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{element.description}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={(e) => handleNavigateToStoryline(e, element.id)}
                                title="Navigate to storyline"
                                disabled={isNavigating}
                              >
                                <MapPin className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={(e) => handleButtonClick(e, () => handleEdit(element))}
                                title={element.storyline_node_id ? 'Edit from storyline map' : 'Edit element'}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={(e) => handleButtonClick(e, () => handleDelete(element.id))}
                                disabled={!!element.storyline_node_id}
                                title={element.storyline_node_id ? 'Delete from storyline map' : 'Delete element'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls - Show when navigating with multiple nodes */}
      {linkedNodes.length > 1 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>Storyline Navigation</span>
            <span>{currentNodeIndex + 1} of {linkedNodes.length}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={navigateToPreviousNode}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={navigateToNextNode}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
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
                  setFormData({ name: '', type: 'scene', description: '' });
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
