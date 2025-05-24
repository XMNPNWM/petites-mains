import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Globe, BarChart3, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import InlineEditableText from '@/components/ui/inline-editable-text';
import ReadOnlyStorylineViewer from '@/components/features/dashboard/ReadOnlyStorylineViewer';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_active_chapter_id?: string;
}

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  status: string;
  order_index: number;
}

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
}

interface WorldElement {
  id: string;
  name: string;
  type: string;
  description: string;
}

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldElements, setWorldElements] = useState<WorldElement[]>([]);
  const [currentPanel, setCurrentPanel] = useState(0);

  const panels = [
    { id: 'storyline', title: 'Storyline', icon: BookOpen },
    { id: 'characters', title: 'Characters', icon: Users },
    { id: 'worldbuilding', title: 'Worldbuilding', icon: Globe },
    { id: 'chapters', title: 'Chapters', icon: Edit3 },
    { id: 'analytics', title: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);

      // Fetch worldbuilding elements
      const { data: worldData, error: worldError } = await supabase
        .from('worldbuilding_elements')
        .select('*')
        .eq('project_id', projectId);

      if (worldError) throw worldError;
      setWorldElements(worldData || []);

    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const updateProjectDescription = async (newDescription: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: newDescription })
        .eq('id', project.id);

      if (error) throw error;
      
      setProject(prev => prev ? { ...prev, description: newDescription } : null);
    } catch (error) {
      console.error('Error updating project description:', error);
      throw error;
    }
  };

  const goToWritingSpace = (chapterId?: string) => {
    const route = chapterId 
      ? `/project/${projectId}/write/${chapterId}`
      : `/project/${projectId}/write`;
    navigate(route);
  };

  const handleWriteButtonClick = () => {
    if (project?.last_active_chapter_id) {
      goToWritingSpace(project.last_active_chapter_id);
    } else {
      goToWritingSpace();
    }
  };

  const getWriteButtonText = () => {
    if (project?.last_active_chapter_id) {
      return 'Continue Writing';
    }
    return chapters.length > 0 ? 'Start Writing' : 'Create First Chapter';
  };

  const renderStorylinePanel = () => (
    <div className="h-full">
      <ReadOnlyStorylineViewer 
        projectId={projectId!}
      />
    </div>
  );

  const renderCharactersPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Characters</h3>
      {characters.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No characters created yet</p>
      ) : (
        <div className="space-y-3">
          {characters.map((character) => (
            <Card key={character.id} className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{character.name}</h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {character.role}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{character.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorldbuildingPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">World Elements</h3>
      {worldElements.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No world elements created yet</p>
      ) : (
        <div className="space-y-3">
          {worldElements.map((element) => (
            <Card key={element.id} className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{element.name}</h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {element.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{element.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderChaptersPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Chapters</h3>
      {chapters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">No chapters created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Card 
              key={chapter.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => goToWritingSpace(chapter.id)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{chapter.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">{chapter.word_count} words</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    chapter.status === 'published' ? 'bg-green-100 text-green-700' :
                    chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chapter.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsPanel = () => {
    const totalWords = chapters.reduce((sum, chapter) => sum + chapter.word_count, 0);
    const completedChapters = chapters.filter(c => c.status === 'published').length;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalWords}</div>
            <div className="text-sm text-slate-600">Total Words</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{chapters.length}</div>
            <div className="text-sm text-slate-600">Chapters</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedChapters}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{characters.length}</div>
            <div className="text-sm text-slate-600">Characters</div>
          </Card>
        </div>
      </div>
    );
  };

  const renderCurrentPanel = () => {
    switch (currentPanel) {
      case 0: return renderStorylinePanel();
      case 1: return renderCharactersPanel();
      case 2: return renderWorldbuildingPanel();
      case 3: return renderChaptersPanel();
      case 4: return renderAnalyticsPanel();
      default: return renderStorylinePanel();
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                <InlineEditableText
                  value={project.description}
                  onSave={updateProjectDescription}
                  placeholder="Add a project description..."
                  maxLength={200}
                />
              </div>
            </div>
            <div>
              <Button 
                onClick={handleWriteButtonClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {getWriteButtonText()}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {panels.map((panel, index) => (
              <button
                key={panel.id}
                onClick={() => setCurrentPanel(index)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentPanel === index
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <panel.icon className="w-4 h-4" />
                <span>{panel.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-8 h-full">
          <div className="h-full overflow-y-auto">
            {renderCurrentPanel()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
