
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
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
  const [isReordering, setIsReordering] = useState(false);
  const [movingChapterId, setMovingChapterId] = useState<string | null>(null);
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

    // Prevent multiple simultaneous operations
    if (isReordering) return;

    setIsReordering(true);
    setMovingChapterId(chapterId);

    // Optimistic UI update - immediately show the new order
    const newChapters = [...chapters];
    const [movedChapter] = newChapters.splice(currentIndex, 1);
    newChapters.splice(targetIndex, 0, movedChapter);
    
    // Update order indices sequentially
    const updatedChapters = newChapters.map((chapter, index) => ({
      ...chapter,
      order_index: index + 1
    }));
    
    // Update local state immediately for fluid UI
    setChapters(updatedChapters);

    try {
      // Batch update all chapters with new order indices using individual updates
      // We need to update each chapter individually since we're only changing order_index
      const updatePromises = updatedChapters.map(chapter => 
        supabase
          .from('chapters')
          .update({ order_index: chapter.order_index })
          .eq('id', chapter.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any update failed
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error('One or more chapter updates failed');
      }

      toast({
        title: "Chapter moved",
        description: `Chapter "${movedChapter.title}" moved ${direction}.`,
      });

      // Trigger parent callback for any dependent updates
      onChaptersChange?.();
    } catch (error) {
      console.error('Error moving chapter:', error);
      
      // Revert optimistic update on error
      fetchChapters();
      
      toast({
        title: "Error",
        description: "Failed to move chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReordering(false);
      setMovingChapterId(null);
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

  // Handle button clicks to prevent context menu propagation when needed
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Handle card clicks for chapter selection
  const handleChapterCardClick = (e: React.MouseEvent, chapter: Chapter) => {
    // Allow context menu on non-interactive areas, but handle chapter selection on click
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) {
      return; // Don't select chapter if clicking on buttons or selects
    }
    onChapterSelect(chapter);
  };

  return (
    <div className="h-full bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Chapters</h2>
          <Button 
            size="sm" 
            onClick={(e) => handleButtonClick(e, () => setShowForm(true))}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
            disabled={isReordering}
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
              disabled={isReordering}
            />
            <div className="flex items-center space-x-2">
              <Button type="submit" size="sm" disabled={isReordering}>Create</Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewChapterTitle('');
                }}
                disabled={isReordering}
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
            } ${movingChapterId === chapter.id ? 'opacity-75' : ''}`}
            onClick={(e) => handleChapterCardClick(e, chapter)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-slate-900 text-sm line-clamp-1 flex-1">
                      {chapter.title}
                    </h3>
                    {movingChapterId === chapter.id && (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    )}
                  </div>
                  
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
                    onClick={(e) => handleButtonClick(e, () => moveChapter(chapter.id, 'up'))}
                    disabled={index === 0 || isReordering}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => handleButtonClick(e, () => moveChapter(chapter.id, 'down'))}
                    disabled={index === chapters.length - 1 || isReordering}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => handleButtonClick(e, () => deleteChapter(chapter.id))}
                  disabled={isReordering}
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
              disabled={isReordering}
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
