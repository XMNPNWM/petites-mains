
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface ChapterOrganizerPanelProps {
  projectId: string;
  currentChapter: Chapter | null;
  onChapterSelect: (chapter: Chapter) => void;
}

const ChapterOrganizerPanel = ({ projectId, currentChapter, onChapterSelect }: ChapterOrganizerPanelProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  useEffect(() => {
    fetchChapters();
  }, [projectId]);

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const createChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    try {
      const nextOrderIndex = Math.max(...chapters.map(c => c.order_index), 0) + 1;
      
      const { data, error } = await supabase
        .from('chapters')
        .insert([{
          title: newChapterTitle,
          content: '',
          word_count: 0,
          order_index: nextOrderIndex,
          project_id: projectId,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setNewChapterTitle('');
      setShowForm(false);
      fetchChapters();
      
      if (data) {
        onChapterSelect(data);
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;
      fetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  return (
    <div className="h-full bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Chapters</h2>
          <Button 
            size="sm" 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* New Chapter Form */}
      {showForm && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <form onSubmit={createChapter} className="space-y-3">
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title..."
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <Button type="submit" size="sm">Create</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewChapterTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chapters.map((chapter) => (
          <Card 
            key={chapter.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentChapter?.id === chapter.id 
                ? 'ring-2 ring-purple-500 bg-purple-50' 
                : ''
            }`}
            onClick={() => onChapterSelect(chapter)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <GripVertical className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 text-sm line-clamp-1">
                      {chapter.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {chapter.word_count} words
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        chapter.status === 'published' ? 'bg-green-100 text-green-700' :
                        chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {chapter.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(chapter.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {chapters.length === 0 && !showForm && (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">No chapters yet</p>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(true)}
            >
              Create First Chapter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterOrganizerPanel;
