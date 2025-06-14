
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ElementCard from './ElementCard';
import DemoElementForm from './DemoElementForm';
import { supabase } from '@/integrations/supabase/client';

// Remove mock data - use real database elements
interface WorldElement {
  id: string;
  name: string;
  type: string;
  description: string;
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
}

interface WorldElementLibraryProps {
  projectId: string;
}

const CATEGORIES = [
  { value: 'characters', label: 'Characters' },
  { value: 'locations', label: 'Locations' },
  { value: 'lore', label: 'Lore' },
  { value: 'organizations', label: 'Organizations' }
];

const WorldElementLibrary = ({ projectId }: WorldElementLibraryProps) => {
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('characters');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchElements();
  }, [projectId]);

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
    } finally {
      setIsLoading(false);
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

  const filteredElements = elements.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || element.type === selectedType;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(elements.map(element => element.type)));
  
  // Group elements by category
  const groupedElements = CATEGORIES.reduce((acc, category) => {
    acc[category.value] = filteredElements.filter(element => element.type === category.value);
    return acc;
  }, {} as Record<string, WorldElement[]>);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Element Library</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
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

      <CardContent className="flex-1 overflow-auto p-4">
        {CATEGORIES.map((category) => {
          const categoryElements = groupedElements[category.value];
          const isCollapsed = collapsedCategories.has(category.value);
          
          if (categoryElements.length === 0 && searchTerm) return null;

          return (
            <div key={category.value} className="mb-4">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-50 rounded"
                onClick={() => toggleCategory(category.value)}
              >
                <div className="flex items-center space-x-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <h3 className="font-medium text-slate-700">{category.label}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {categoryElements.length}
                  </span>
                </div>
              </div>

              {/* Category Elements */}
              {!isCollapsed && (
                <div className="ml-6 space-y-2">
                  {categoryElements.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4">No {category.label.toLowerCase()} yet</p>
                  ) : (
                    categoryElements.map((element) => (
                      <ElementCard
                        key={element.id}
                        element={element}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredElements.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No elements found.</p>
            <Button 
              onClick={() => setShowForm(true)} 
              variant="outline" 
              className="mt-2"
            >
              Create your first element
            </Button>
          </div>
        )}
      </CardContent>

      {/* Demo Form */}
      <DemoElementForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        elementType={selectedCategory}
      />
    </div>
  );
};

export default WorldElementLibrary;
