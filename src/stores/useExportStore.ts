
import { create } from 'zustand';
import { Chapter } from '@/types/shared';

export interface ExportChapterSelection {
  chapterId: string;
  contentSource: 'original' | 'enhanced';
  order: number;
}

export interface LayoutOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  chapterSeparator: 'page-break' | 'section-break' | 'space';
  includeTOC: boolean;
  includeTitlePage: boolean;
  headerFooter: boolean;
}

interface ExportState {
  selectedChapters: ExportChapterSelection[];
  exportFormat: 'pdf' | 'docx' | 'txt' | 'epub';
  includeMetadata: boolean;
  templateId: string;
  assembledContent: string;
  layoutOptions: LayoutOptions;
  isAssembling: boolean;
  
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
  updateAssembledContent: (content: string) => void;
  setLayoutOptions: (options: Partial<LayoutOptions>) => void;
  setIsAssembling: (isAssembling: boolean) => void;
}

export const useExportStore = create<ExportState>((set, get) => ({
  selectedChapters: [],
  exportFormat: 'pdf',
  includeMetadata: true,
  templateId: 'default',
  assembledContent: '',
  layoutOptions: {
    fontFamily: 'serif',
    fontSize: 12,
    lineHeight: 1.6,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterSeparator: 'page-break',
    includeTOC: true,
    includeTitlePage: true,
    headerFooter: true,
  },
  isAssembling: false,

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
    templateId: 'default',
    assembledContent: '',
    layoutOptions: {
      fontFamily: 'serif',
      fontSize: 12,
      lineHeight: 1.6,
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      chapterSeparator: 'page-break',
      includeTOC: true,
      includeTitlePage: true,
      headerFooter: true,
    },
    isAssembling: false,
  }),

  updateAssembledContent: (content: string) => set({ assembledContent: content }),
  
  setLayoutOptions: (options: Partial<LayoutOptions>) => 
    set(state => ({ layoutOptions: { ...state.layoutOptions, ...options } })),
  
  setIsAssembling: (isAssembling: boolean) => set({ isAssembling }),
}));
