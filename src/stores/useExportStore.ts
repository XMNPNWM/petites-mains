
import { create } from 'zustand';
import { Chapter } from '@/types/shared';

export interface ExportChapterSelection {
  chapterId: string;
  contentSource: 'original' | 'enhanced';
  order: number;
}

interface ExportState {
  selectedChapters: ExportChapterSelection[];
  exportFormat: 'pdf' | 'docx' | 'txt' | 'epub';
  includeMetadata: boolean;
  templateId: string;
  
  // Actions
  toggleChapterSelection: (chapterId: string, chapter: Chapter) => void;
  setContentSource: (chapterId: string, source: 'original' | 'enhanced') => void;
  reorderChapters: (newOrder: ExportChapterSelection[]) => void;
  setExportFormat: (format: 'pdf' | 'docx' | 'txt' | 'epub') => void;
  setIncludeMetadata: (include: boolean) => void;
  setTemplateId: (templateId: string) => void;
  selectAllChapters: (chapters: Chapter[]) => void;
  selectByStatus: (chapters: Chapter[], status: string) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useExportStore = create<ExportState>((set, get) => ({
  selectedChapters: [],
  exportFormat: 'pdf',
  includeMetadata: true,
  templateId: 'default',

  toggleChapterSelection: (chapterId: string, chapter: Chapter) => {
    const { selectedChapters } = get();
    const existing = selectedChapters.find(c => c.chapterId === chapterId);
    
    if (existing) {
      set({
        selectedChapters: selectedChapters.filter(c => c.chapterId !== chapterId)
      });
    } else {
      const newSelection: ExportChapterSelection = {
        chapterId,
        contentSource: 'original',
        order: selectedChapters.length
      };
      set({
        selectedChapters: [...selectedChapters, newSelection]
      });
    }
  },

  setContentSource: (chapterId: string, source: 'original' | 'enhanced') => {
    set(state => ({
      selectedChapters: state.selectedChapters.map(c =>
        c.chapterId === chapterId ? { ...c, contentSource: source } : c
      )
    }));
  },

  reorderChapters: (newOrder: ExportChapterSelection[]) => {
    const reorderedChapters = newOrder.map((chapter, index) => ({
      ...chapter,
      order: index
    }));
    set({ selectedChapters: reorderedChapters });
  },

  setExportFormat: (format) => set({ exportFormat: format }),
  setIncludeMetadata: (include) => set({ includeMetadata: include }),
  setTemplateId: (templateId) => set({ templateId }),

  selectAllChapters: (chapters: Chapter[]) => {
    const selections: ExportChapterSelection[] = chapters.map((chapter, index) => ({
      chapterId: chapter.id,
      contentSource: 'original' as const,
      order: index
    }));
    set({ selectedChapters: selections });
  },

  selectByStatus: (chapters: Chapter[], status: string) => {
    const filteredChapters = chapters.filter(c => c.status === status);
    const selections: ExportChapterSelection[] = filteredChapters.map((chapter, index) => ({
      chapterId: chapter.id,
      contentSource: 'original' as const,
      order: index
    }));
    set({ selectedChapters: selections });
  },

  clearSelection: () => set({ selectedChapters: [] }),
  
  reset: () => set({
    selectedChapters: [],
    exportFormat: 'pdf',
    includeMetadata: true,
    templateId: 'default'
  })
}));
