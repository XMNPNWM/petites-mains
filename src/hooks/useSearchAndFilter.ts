
import { useState, useMemo } from 'react';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';
import { FilterState } from '@/components/features/dashboard/ai-brain/SearchFilterPanel';

interface PlotThread {
  id: string;
  project_id: string;
  thread_name: string;
  thread_type: string;
  thread_status: string;
  ai_confidence_new?: number;
  characters_involved_names?: string[];
  is_newly_extracted?: boolean;
  evidence?: string;
  key_events?: string[];
}

interface TimelineEvent {
  id: string;
  project_id: string;
  event_name: string;
  event_type: string;
  event_description?: string;
  chronological_order: number;
  ai_confidence_new?: number;
  characters_involved_names?: string[];
  is_newly_extracted?: boolean;
  date_or_time_reference?: string;
  significance?: string;
}

interface CharacterRelationship {
  id: string;
  project_id: string;
  character_a_name: string;
  character_b_name: string;
  relationship_type: string;
  relationship_strength: number;
  relationship_current_status?: string;
  ai_confidence_new?: number;
  is_newly_extracted?: boolean;
  evidence?: string;
}

interface WorldBuildingElement {
  id: string;
  project_id: string;
  name: string;
  type: string;
  description?: string;
}

interface SearchAndFilterData {
  knowledge: KnowledgeBase[];
  chapterSummaries: ChapterSummary[];
  plotPoints: PlotPoint[];
  plotThreads: PlotThread[];
  timelineEvents: TimelineEvent[];
  characterRelationships: CharacterRelationship[];
  worldBuilding: WorldBuildingElement[];
  themes: KnowledgeBase[];
}

const defaultFilters: FilterState = {
  searchTerm: '',
  confidenceLevel: 'all',
  extractionStatus: 'all',
  categoryType: 'all',
  verificationStatus: 'all'
};

export const useSearchAndFilter = (data: SearchAndFilterData) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredData = useMemo(() => {
    const applyFilters = <T extends any>(items: T[], getSearchText: (item: T) => string, getConfidence: (item: T) => number, getIsNew: (item: T) => boolean, getIsFlagged: (item: T) => boolean, getIsVerified: (item: T) => boolean, getCategory?: (item: T) => string) => {
      return items.filter(item => {
        // Search filter
        if (filters.searchTerm) {
          const searchText = getSearchText(item).toLowerCase();
          if (!searchText.includes(filters.searchTerm.toLowerCase())) {
            return false;
          }
        }

        // Confidence filter
        if (filters.confidenceLevel !== 'all') {
          const confidence = getConfidence(item);
          switch (filters.confidenceLevel) {
            case 'high':
              if (confidence < 0.8) return false;
              break;
            case 'medium':
              if (confidence < 0.6 || confidence >= 0.8) return false;
              break;
            case 'low':
              if (confidence >= 0.6) return false;
              break;
          }
        }

        // Extraction status filter
        if (filters.extractionStatus !== 'all') {
          const isNew = getIsNew(item);
          if (filters.extractionStatus === 'new' && !isNew) return false;
          if (filters.extractionStatus === 'existing' && isNew) return false;
        }

        // Category filter
        if (filters.categoryType !== 'all' && getCategory) {
          const category = getCategory(item);
          if (category !== filters.categoryType) return false;
        }

        // Verification status filter
        if (filters.verificationStatus !== 'all') {
          const isFlagged = getIsFlagged(item);
          const isVerified = getIsVerified(item);
          
          switch (filters.verificationStatus) {
            case 'flagged':
              if (!isFlagged) return false;
              break;
            case 'verified':
              if (!isVerified) return false;
              break;
            case 'unverified':
              if (isVerified || isFlagged) return false;
              break;
          }
        }

        return true;
      });
    };

    // Filter knowledge base items
    const filteredKnowledge = applyFilters(
      data.knowledge,
      (item) => `${item.name} ${item.description} ${item.evidence}`,
      (item) => item.confidence_score,
      (item) => item.is_newly_extracted || false,
      (item) => item.is_flagged || false,
      (item) => item.is_verified || false,
      (item) => item.category
    );

    // Filter themes
    const filteredThemes = applyFilters(
      data.themes,
      (item) => `${item.name} ${item.description} ${item.evidence}`,
      (item) => item.confidence_score,
      (item) => item.is_newly_extracted || false,
      (item) => item.is_flagged || false,
      (item) => item.is_verified || false,
      (item) => item.category
    );

    // Filter plot points
    const filteredPlotPoints = applyFilters(
      data.plotPoints,
      (item) => `${item.name} ${item.description} ${item.significance}`,
      (item) => item.ai_confidence || 0,
      (item) => item.is_newly_extracted || false,
      () => false, // No flagged field
      () => false, // No verified field
    );

    // Filter plot threads
    const filteredPlotThreads = applyFilters(
      data.plotThreads,
      (item) => `${item.thread_name} ${item.thread_type} ${item.evidence}`,
      (item) => item.ai_confidence_new || 0,
      (item) => item.is_newly_extracted || false,
      () => false,
      () => false,
    );

    // Filter timeline events
    const filteredTimelineEvents = applyFilters(
      data.timelineEvents,
      (item) => `${item.event_name} ${item.event_description} ${item.significance || ''}`,
      (item) => item.ai_confidence_new || 0,
      (item) => item.is_newly_extracted || false,
      () => false,
      () => false,
    );

    // Filter character relationships
    const filteredCharacterRelationships = applyFilters(
      data.characterRelationships,
      (item) => `${item.character_a_name} ${item.character_b_name} ${item.relationship_type} ${item.evidence}`,
      (item) => item.ai_confidence_new || 0,
      (item) => item.is_newly_extracted || false,
      () => false,
      () => false,
    );

    // Filter world building elements
    const filteredWorldBuilding = applyFilters(
      data.worldBuilding,
      (item) => `${item.name} ${item.description}`,
      () => 1, // No confidence score
      () => false, // No extraction status
      () => false,
      () => false,
    );

    // Filter chapter summaries
    const filteredChapterSummaries = applyFilters(
      data.chapterSummaries,
      (item) => `${item.title} ${item.summary_long}`,
      (item) => item.ai_confidence || 0,
      (item) => item.is_newly_extracted || false,
      () => false,
      () => false,
    );

    return {
      knowledge: filteredKnowledge,
      chapterSummaries: filteredChapterSummaries,
      plotPoints: filteredPlotPoints,
      plotThreads: filteredPlotThreads,
      timelineEvents: filteredTimelineEvents,
      characterRelationships: filteredCharacterRelationships,
      worldBuilding: filteredWorldBuilding,
      themes: filteredThemes,
    };
  }, [data, filters]);

  const totalResults = Object.values(filteredData).reduce((sum, items) => sum + items.length, 0);

  return {
    filters,
    setFilters,
    filteredData,
    totalResults,
  };
};
