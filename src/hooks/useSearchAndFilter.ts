
import { useState, useMemo } from 'react';
import { FilterState } from '@/components/features/dashboard/ai-brain/SearchFilterPanel';
import { AIBrainData } from '@/types/ai-brain';
import { 
  filterKnowledge, 
  filterPlotThreads, 
  filterTimelineEvents, 
  filterCharacterRelationships, 
  filterWorldBuilding,
  applyFilters
} from '@/utils/filter-utils';

const defaultFilters: FilterState = {
  searchTerm: '',
  confidenceLevel: 'all',
  extractionStatus: 'all',
  categoryType: 'all',
  verificationStatus: 'all'
};

export const useSearchAndFilter = (data: AIBrainData) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredData = useMemo(() => {
    // Filter knowledge base items
    const filteredKnowledge = filterKnowledge(data.knowledge, filters);

    // Filter themes (subset of knowledge)
    const filteredThemes = filterKnowledge(data.themes, filters);

    // Filter plot points
    const filteredPlotPoints = applyFilters(
      data.plotPoints,
      filters,
      (item) => `${item.name} ${item.description} ${item.significance}`,
      (item) => item.ai_confidence || 0,
      (item) => item.is_newly_extracted || false,
      () => false,
      () => false,
    );

    // Filter other data types
    const filteredPlotThreads = filterPlotThreads(data.plotThreads, filters);
    const filteredTimelineEvents = filterTimelineEvents(data.timelineEvents, filters);
    const filteredCharacterRelationships = filterCharacterRelationships(data.characterRelationships, filters);
    const filteredWorldBuilding = filterWorldBuilding(data.worldBuilding, filters);

    // Filter chapter summaries
    const filteredChapterSummaries = applyFilters(
      data.chapterSummaries,
      filters,
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
