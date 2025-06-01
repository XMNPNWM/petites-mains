
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChapterStatusSelector from './ChapterStatusSelector';

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
  onChaptersChange?: () => void;
}

const ChapterOrganizerPanel = ({ projectId, currentChapter, onChapterSelect, onChaptersChange }: ChapterOrganizerPanelProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isReordering, setIsReordering] = useState<string | null>(null);
  const { toast } = useToast();

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
      onChaptersChange?.();
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
          status: 'outline'
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
      toast({
        title: "Error",
        description: "Failed to create chapter. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Chapter deleted",
        description: "Chapter has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const moveChapter = async (chapterId: string, direction: 'up' | 'down') => {
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    setIsReordering(chapterId);

    try {
      const currentChapter = chapters[currentIndex];
      const targetChapter = chapters[targetIndex];

      // Swap order_index values
      const { error: error1 } = await supabase
        .from('chapters')
        .update({ order_index: targetChapter.order_index })
        .eq('id', currentChapter.id);

      const { error: error2 } = await supabase
        .from('chapters')
        .update({ order_index: currentChapter.order_index })
        .eq('id', targetChapter.id);

      if (error1 || error2) throw error1 || error2;

      fetchChapters();
      toast({
        title: "Chapter moved",
        description: `Chapter "${currentChapter.title}" moved ${direction}.`,
      });
    } catch (error) {
      console.error('Error moving chapter:', error);
      toast({
        title: "Error",
        description: "Failed to move chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReordering(null);
    }
  };

  const updateChapterStatus = async (chapterId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status: newStatus })
        .eq('id', chapterId);

      if (error) throw error;

      // Update local state optimistically
      setChapters(prev => prev.map(ch => 
        ch.id === chapterId ? { ...ch, status: newStatus } : ch
      ));

      toast({
        title: "Status updated",
        description: "Chapter status has been updated.",
      });
    } catch (error) {
      console.error('Error updating chapter status:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter status. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update
      fetchChapters();
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
        {chapters.map((chapter, index) => (
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-1 mb-2">
                    {chapter.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <ChapterStatusSelector
                      status={chapter.status}
                      onStatusChange={(newStatus) => updateChapterStatus(chapter.id, newStatus)}
                    />
                    <span className="text-xs text-slate-500">
                      {chapter.word_count} words
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveChapter(chapter.id, 'up');
                    }}
                    disabled={index === 0 || isReordering === chapter.id}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveChapter(chapter.id, 'down');
                    }}
                    disabled={index === chapters.length - 1 || isReordering === chapter.id}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
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
