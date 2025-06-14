import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import ElementCard from './ElementCard';
import ElementForm from './ElementForm';
import { WorldbuildingElement } from '@/types/worldbuilding';
import { useToast } from '@/hooks/use-toast';

interface WorldbuildingPanelProps {
  projectId: string;
  refreshTrigger?: number;
}

const WorldbuildingPanel = ({ projectId, refreshTrigger }: WorldbuildingPanelProps) => {
  const [elements, setElements] = useState<WorldbuildingElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldbuildingElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchElements();
  }, [projectId, refreshTrigger]);

  const fetchElements = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('worldbuilding_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElements(data || []);
    } catch (error) {
      console.error('Error fetching worldbuilding elements:', error);
      toast({
        title: "Error",
        description: "Failed to load worldbuilding elements",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (element: WorldbuildingElement) => {
    setEditingElement(element);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('worldbuilding_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Element deleted",
        description: "Worldbuilding element has been deleted successfully.",
      });
      
      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Error",
        description: "Failed to delete element",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingElement(null);
    fetchElements();
  };

  const filteredElements = elements.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || element.type === selectedType;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(elements.map(element => element.type)));

  if (showForm) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white">
          <Button
            onClick={() => {
              setShowForm(false);
              setEditingElement(null);
            }}
            variant="ghost"
            className="mb-2"
          >
            ← Back to Elements
          </Button>
          <h2 className="text-lg font-semibold">
            {editingElement ? 'Edit Element' : 'Create New Element'}
          </h2>
        </div>
        <div className="flex-1 overflow-auto">
          <ElementForm
            projectId={projectId}
            element={editingElement}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingElement(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Worldbuilding</CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredElements.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No worldbuilding elements found.</p>
            <Button 
              onClick={() => setShowForm(true)} 
              variant="outline" 
              className="mt-2"
            >
              Create your first element
            </Button>
          </div>
        ) : (
          filteredElements.map(element => (
            <ElementCard
              key={element.id}
              element={element}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </CardContent>
    </div>
  );
};

export default WorldbuildingPanel;
