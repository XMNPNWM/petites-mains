
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { supabase } from '@/integrations/supabase/client';
import WorldbuildingPanel from '@/components/features/writing/WorldbuildingPanel';
import TextEditorPanel from '@/components/features/writing/TextEditorPanel';
import ChapterOrganizerPanel from '@/components/features/writing/ChapterOrganizerPanel';
import StorylinePanel from '@/components/features/writing/StorylinePanel';

interface Project {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

const WritingSpace = () => {
  const { projectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      if (chapterId) {
        fetchChapter(chapterId);
      }
    }
  }, [projectId, chapterId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchChapter = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentChapter(data);
    } catch (error) {
      console.error('Error fetching chapter:', error);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    navigate(`/project/${projectId}/write/${chapter.id}`);
  };

  const handleSave = async () => {
    if (!currentChapter) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: currentChapter.content,
          word_count: currentChapter.content.split(' ').filter(word => word.length > 0).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      console.log('Chapter saved successfully');
    } catch (error) {
      console.error('Error saving chapter:', error);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading writing space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/project/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
              {currentChapter && (
                <p className="text-sm text-slate-600">{currentChapter.title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Vertical Layout */}
      <div className="flex-1">
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* Top Panel - Horizontal Writing Panels */}
          <ResizablePanel defaultSize={70} minSize={40}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Worldbuilding Panel */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <WorldbuildingPanel projectId={projectId!} />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Text Editor Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <TextEditorPanel 
                  chapter={currentChapter}
                  onContentChange={(content) => 
                    setCurrentChapter(prev => prev ? {...prev, content} : null)
                  }
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Chapter Organizer Panel */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <ChapterOrganizerPanel 
                  projectId={projectId!}
                  currentChapter={currentChapter}
                  onChapterSelect={handleChapterSelect}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom Panel - Storyline Panel (Permanent) */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <StorylinePanel 
              projectId={projectId!}
              chapterId={currentChapter?.id}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WritingSpace;
