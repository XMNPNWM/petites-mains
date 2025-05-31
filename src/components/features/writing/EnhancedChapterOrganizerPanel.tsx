import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
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
  onChaptersChange?: (chapters: Chapter[]) => void;
}

const SortableChapterCard = ({ 
  chapter, 
  isSelected, 
  onSelect, 
  onDelete, 
  onStatusChange 
}: { 
  chapter: Chapter;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: chapter.id,
    data: {
      type: 'chapter',
      chapter
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-purple-500 bg-purple-50' 
          : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <div 
              {...attributes}
              {...listeners}
              className="w-4 h-4 mt-0.5 cursor-grab hover:cursor-grabbing flex-shrink-0"
            >
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              </svg>
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
                  status={chapter.status}
                  onStatusChange={(status) => {
                    onStatusChange(status);
                  }}
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
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EnhancedChapterOrganizerPanel = ({ 
  projectId, 
  currentChapter, 
  onChapterSelect,
  onChaptersChange 
}: ChapterOrganizerPanelProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      const chaptersData = data || [];
      setChapters(chaptersData);
      onChaptersChange?.(chaptersData);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const updateChapterStatus = async (chapterId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status })
        .eq('id', chapterId);

      if (error) throw error;
      
      setChapters(prev => prev.map(ch => 
        ch.id === chapterId ? { ...ch, status } : ch
      ));
    } catch (error) {
      console.error('Error updating chapter status:', error);
    }
  };

  const reorderChapters = async (newChapters: Chapter[]) => {
    try {
      const updates = newChapters.map((chapter, index) => ({
        id: chapter.id,
        order_index: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('chapters')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      setChapters(newChapters);
      onChaptersChange?.(newChapters);
    } catch (error) {
      console.error('Error reordering chapters:', error);
      // Revert on error
      fetchChapters();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = chapters.findIndex(chapter => chapter.id === active.id);
      const newIndex = chapters.findIndex(chapter => chapter.id === over?.id);
      
      const newChapters = arrayMove(chapters, oldIndex, newIndex).map((chapter, index) => ({
        ...chapter,
        order_index: index
      }));

      reorderChapters(newChapters);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
            {chapters.map((chapter) => (
              <SortableChapterCard
                key={chapter.id}
                chapter={chapter}
                isSelected={currentChapter?.id === chapter.id}
                onSelect={() => onChapterSelect(chapter)}
                onDelete={() => deleteChapter(chapter.id)}
                onStatusChange={(status) => updateChapterStatus(chapter.id, status)}
              />
            ))}
          </SortableContext>
        </DndContext>

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

export default EnhancedChapterOrganizerPanel;
