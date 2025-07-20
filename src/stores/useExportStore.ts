
import { create } from 'zustand';
import { Chapter } from '@/types/shared';

export interface ExportChapterSelection {
  chapterId: string;
  contentSource: 'original' | 'enhanced';
  order: number;
}

export interface ChapterTitleOptions {
  numberingStyle: 'none' | 'arabic' | 'roman' | 'words';
  prefix: 'chapter' | 'part' | 'section' | 'custom' | 'none';
  customPrefix: string;
  alignment: 'left' | 'center' | 'right';
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  includeUnderline: boolean;
  includeSeparator: boolean;
  separatorStyle: 'line' | 'ornament' | 'dots';
}

export interface ContentFormattingOptions {
  enableDropCaps: boolean;
  paragraphIndent: number;
  paragraphSpacing: number;
  textAlignment: 'left' | 'justify' | 'center';
  preserveFormatting: boolean;
  smartQuotes: boolean;
  autoTypography: boolean;
}

export interface TOCOptions {
  customTitle: string;
  includePageNumbers: boolean;
  pageNumberAlignment: 'left' | 'right';
  dotLeaders: boolean;
  tocDepth: number;
  tocFontSize: number;
  includeChapterNumbers: boolean;
}

export interface LayoutOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
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
  chapterTitleOptions: ChapterTitleOptions;
  contentFormatting: ContentFormattingOptions;
  tocOptions: TOCOptions;
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

const getDefaultLayoutOptions = (): LayoutOptions => ({
  fontFamily: 'serif',
  fontSize: 12,
  fontWeight: 'normal',
  lineHeight: 1.6,
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  chapterSeparator: 'page-break',
  includeTOC: true,
  includeTitlePage: true,
  headerFooter: true,
  chapterTitleOptions: {
    numberingStyle: 'arabic',
    prefix: 'chapter',
    customPrefix: '',
    alignment: 'left',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: 'bold',
    includeUnderline: false,
    includeSeparator: false,
    separatorStyle: 'line'
  },
  contentFormatting: {
    enableDropCaps: false,
    paragraphIndent: 0,
    paragraphSpacing: 1.2,
    textAlignment: 'left',
    preserveFormatting: true,
    smartQuotes: true,
    autoTypography: true
  },
  tocOptions: {
    customTitle: 'Table of Contents',
    includePageNumbers: true,
    pageNumberAlignment: 'right',
    dotLeaders: true,
    tocDepth: 1,
    tocFontSize: 12,
    includeChapterNumbers: true
  }
});

export const useExportStore = create<ExportState>((set, get) => ({
  selectedChapters: [],
  exportFormat: 'pdf',
  includeMetadata: true,
  templateId: 'default',
  assembledContent: '',
  layoutOptions: getDefaultLayoutOptions(),
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
    layoutOptions: getDefaultLayoutOptions(),
    isAssembling: false,
  }),

  updateAssembledContent: (content: string) => {
    console.log('ExportStore: Updating assembled content, length:', content.length);
    set({ assembledContent: content });
  },
  
  setLayoutOptions: (options: Partial<LayoutOptions>) => 
    set(state => ({ layoutOptions: { ...state.layoutOptions, ...options } })),
  
  setIsAssembling: (isAssembling: boolean) => {
    console.log('ExportStore: Setting isAssembling to:', isAssembling);
    set({ isAssembling });
  },
}));
