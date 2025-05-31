
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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
}

const ChapterOrganizerPanel = ({ projectId, currentChapter, onChapterSelect }: ChapterOrganizerPanelProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isReordering, setIsReordering] = useState(false);
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
        description: "Chapter has been deleted successfully.",
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

  const updateChapterStatus = async (chapterId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', chapterId);

      if (error) throw error;
      
      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? { ...chapter, status: newStatus } : chapter
      ));

      toast({
        title: "Status updated",
        description: `Chapter status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating chapter status:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    setIsReordering(true);

    // Optimistically update the UI
    const reorderedChapters = Array.from(chapters);
    const [removed] = reorderedChapters.splice(sourceIndex, 1);
    reorderedChapters.splice(destinationIndex, 0, removed);

    // Update order_index for all chapters
    const updatedChapters = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order_index: index + 1
    }));

    setChapters(updatedChapters);

    try {
      // Update the database with new order
      const updatePromises = updatedChapters.map(chapter =>
        supabase
          .from('chapters')
          .update({ order_index: chapter.order_index })
          .eq('id', chapter.id)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Chapters reordered",
        description: "Chapter order has been updated successfully.",
      });
    } catch (error) {
      console.error('Error reordering chapters:', error);
      // Rollback on error
      fetchChapters();
      toast({
        title: "Error",
        description: "Failed to reorder chapters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReordering(false);
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

      {/* Chapters List with Drag & Drop */}
      <div className="flex-1 overflow-y-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-slate-50' : ''
                }`}
              >
                {chapters.map((chapter, index) => (
                  <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                    {(provided, snapshot) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          currentChapter?.id === chapter.id 
                            ? 'ring-2 ring-purple-500 bg-purple-50' 
                            : ''
                        } ${
                          snapshot.isDragging ? 'opacity-75 rotate-2 shadow-lg' : ''
                        }`}
                        onClick={() => !snapshot.isDragging && onChapterSelect(chapter)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-0.5 cursor-grab active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-slate-900 text-sm line-clamp-1">
                                  {chapter.title}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-slate-500">
                                    {chapter.word_count} words
                                  </span>
                                  <ChapterStatusSelector
                                    currentStatus={chapter.status}
                                    onChange={(newStatus) => updateChapterStatus(chapter.id, newStatus)}
                                    className="text-xs"
                                  />
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

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

        {isReordering && (
          <div className="text-center py-2">
            <div className="inline-flex items-center text-sm text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Updating chapter order...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterOrganizerPanel;
