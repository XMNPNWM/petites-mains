
import { KnowledgeBase } from '@/types/knowledge';
import { PlotThread, TimelineEvent, CharacterRelationship } from '@/types/ai-brain';
import { FilterState } from '@/components/features/dashboard/ai-brain/SearchFilterPanel';

// Generic filter function for AI Brain data
export const applyFilters = <T extends any>(
  items: T[], 
  filters: FilterState,
  getSearchText: (item: T) => string, 
  getConfidence: (item: T) => number, 
  getIsNew: (item: T) => boolean, 
  getIsFlagged: (item: T) => boolean, 
  getIsVerified: (item: T) => boolean, 
  getCategory?: (item: T) => string
) => {
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

// Specific filter functions for each data type
export const filterKnowledge = (knowledge: KnowledgeBase[], filters: FilterState) => {
  return applyFilters(
    knowledge,
    filters,
    (item) => `${item.name} ${item.description} ${item.evidence}`,
    (item) => item.confidence_score,
    (item) => item.is_newly_extracted || false,
    (item) => item.is_flagged || false,
    (item) => item.is_verified || false,
    (item) => item.category
  );
};

export const filterPlotThreads = (plotThreads: PlotThread[], filters: FilterState) => {
  return applyFilters(
    plotThreads,
    filters,
    (item) => `${item.thread_name} ${item.thread_type} ${item.evidence}`,
    (item) => item.ai_confidence_new || 0,
    (item) => item.is_newly_extracted || false,
    () => false,
    () => false,
  );
};

export const filterTimelineEvents = (timelineEvents: TimelineEvent[], filters: FilterState) => {
  return applyFilters(
    timelineEvents,
    filters,
    (item) => `${item.event_name} ${item.event_description} ${item.significance || ''}`,
    (item) => item.ai_confidence_new || 0,
    (item) => item.is_newly_extracted || false,
    () => false,
    () => false,
  );
};

export const filterCharacterRelationships = (relationships: CharacterRelationship[], filters: FilterState) => {
  return applyFilters(
    relationships,
    filters,
    (item) => `${item.character_a_name} ${item.character_b_name} ${item.relationship_type} ${item.evidence}`,
    (item) => item.ai_confidence_new || 0,
    (item) => item.is_newly_extracted || false,
    () => false,
    () => false,
  );
};

export const filterWorldBuilding = (worldBuilding: KnowledgeBase[], filters: FilterState) => {
  return applyFilters(
    worldBuilding,
    filters,
    (item) => `${item.name} ${item.description} ${item.evidence}`,
    (item) => item.confidence_score,
    (item) => item.is_newly_extracted || false,
    (item) => item.is_flagged || false,
    (item) => item.is_verified || false,
    (item) => item.subcategory || 'general'
  );
};
