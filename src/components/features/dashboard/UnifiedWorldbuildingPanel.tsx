
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Link, Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface WorldElement {
  id: string;
  name: string;
  type: string;
  description: string;
  storyline_node_id?: string | null;
  created_from_storyline?: boolean;
  source: 'worldbuilding' | 'characters';
}

interface UnifiedWorldbuildingPanelProps {
  projectId: string;
}

const CATEGORIES = [
  { value: 'scene', label: 'Scenes' },
  { value: 'character', label: 'Characters' },
  { value: 'location', label: 'Locations' },
  { value: 'lore', label: 'Lore' },
  { value: 'event', label: 'Events' },
  { value: 'organization', label: 'Organizations' },
  { value: 'religion', label: 'Religion' },
  { value: 'politics', label: 'Politics' },
  { value: 'artifact', label: 'Artifacts' }
];

const UnifiedWorldbuildingPanel = ({ projectId }: UnifiedWorldbuildingPanelProps) => {
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchElements = async () => {
    try {
      setLoading(true);
      
      // Fetch worldbuilding elements
      const { data: worldbuildingData, error: worldbuildingError } = await supabase
        .from('worldbuilding_elements')
        .select('*')
        .eq('project_id', projectId);

      if (worldbuildingError) throw worldbuildingError;

      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (charactersError) throw charactersError;

      // Convert worldbuilding elements
      const worldbuildingElements: WorldElement[] = (worldbuildingData || []).map(element => ({
        id: element.id,
        name: element.name,
        type: element.type,
        description: element.description || '',
        storyline_node_id: element.storyline_node_id,
        created_from_storyline: element.created_from_storyline,
        source: 'worldbuilding' as const
      }));

      // Convert characters to WorldElement format
      const characterElements: WorldElement[] = (charactersData || []).map(character => ({
        id: character.id,
        name: character.name,
        type: 'character',
        description: character.description || '',
        storyline_node_id: null,
        created_from_storyline: false,
        source: 'characters' as const
      }));

      // Remove duplicates: prioritize worldbuilding elements over characters table entries
      const worldbuildingNames = new Set(
        worldbuildingElements
          .filter(el => el.type === 'character')
          .map(el => el.name.toLowerCase())
      );

      const dedupedCharacters = characterElements.filter(
        char => !worldbuildingNames.has(char.name.toLowerCase())
      );

      // Combine all elements
      const combinedElements = [...worldbuildingElements, ...dedupedCharacters];

      setElements(combinedElements);
    } catch (error) {
      console.error('Error fetching elements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElements();
  }, [projectId]);

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
    element.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group elements by category
  const groupedElements = CATEGORIES.reduce((acc, category) => {
    acc[category.value] = filteredElements.filter(element => element.type === category.value);
    return acc;
  }, {} as Record<string, WorldElement[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">World Elements</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">World Elements</h3>
        <span className="text-sm text-slate-500">
          {filteredElements.length} total
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          placeholder="Search elements..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map((category) => {
          const categoryElements = groupedElements[category.value];
          const isCollapsed = collapsedCategories.has(category.value);
          
          if (categoryElements.length === 0 && searchTerm) return null;

          return (
            <div key={category.value} className="border border-slate-200 rounded-lg">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 rounded-t-lg"
                onClick={() => toggleCategory(category.value)}
              >
                <div className="flex items-center space-x-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <h4 className="font-medium text-slate-700">{category.label}</h4>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {categoryElements.length}
                  </span>
                </div>
              </div>

              {/* Category Elements */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-2 border-t border-slate-100">
                  {categoryElements.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4">No {category.label.toLowerCase()} yet</p>
                  ) : (
                    categoryElements.map((element) => (
                      <Card key={`${element.source}-${element.id}`} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-slate-900 text-sm">{element.name}</h5>
                                {element.storyline_node_id && (
                                  <div className="flex items-center gap-1">
                                    <Link className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                      {element.created_from_storyline ? 'Synced' : 'Linked'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {element.description && (
                                <p className="text-xs text-slate-600 line-clamp-2">{element.description}</p>
                              )}
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

      {filteredElements.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-slate-500">
            {searchTerm ? 'No elements match your search' : 'No world elements created yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UnifiedWorldbuildingPanel;
