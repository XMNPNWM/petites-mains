
import { AIBrainData } from '@/types/ai-brain';

export interface AIBrainValidationResult {
  isValid: boolean;
  missingRequirements: string[];
  summary: {
    characters: number;
    relationships: number;
    plotElements: number;
    totalKnowledge: number;
    chapterSummaries: number;
    totalChapters?: number;
  };
}

export interface AIBrainValidationThresholds {
  minCharacters: number;
  minRelationships: number;
  minPlotElements: number;
  minTotalKnowledge: number;
  minChapterSummaries: number;
}

export const DEFAULT_VALIDATION_THRESHOLDS: AIBrainValidationThresholds = {
  minCharacters: 2,
  minRelationships: 1,
  minPlotElements: 1, // plot_threads + timeline_events
  minTotalKnowledge: 3,
  minChapterSummaries: 1 // only if multiple chapters exist
};

export const validateAIBrainData = (
  aiBrainData: AIBrainData,
  totalChapters: number = 1,
  thresholds: AIBrainValidationThresholds = DEFAULT_VALIDATION_THRESHOLDS
): AIBrainValidationResult => {
  if (aiBrainData.isLoading) {
    return {
      isValid: false,
      missingRequirements: ['AI Brain data is still loading...'],
      summary: {
        characters: 0,
        relationships: 0,
        plotElements: 0,
        totalKnowledge: 0,
        chapterSummaries: 0,
        totalChapters
      }
    };
  }

  if (aiBrainData.error) {
    return {
      isValid: false,
      missingRequirements: ['Failed to load AI Brain data'],
      summary: {
        characters: 0,
        relationships: 0,
        plotElements: 0,
        totalKnowledge: 0,
        chapterSummaries: 0,
        totalChapters
      }
    };
  }

  // Count characters from knowledge base
  const characters = aiBrainData.knowledge.filter(item => item.category === 'character').length;
  
  // Count relationships
  const relationships = aiBrainData.characterRelationships.length;
  
  // Count plot elements (plot threads + timeline events)
  const plotElements = aiBrainData.plotThreads.length + aiBrainData.timelineEvents.length;
  
  // Count total knowledge base entries
  const totalKnowledge = aiBrainData.knowledge.length + aiBrainData.worldBuilding.length + aiBrainData.themes.length;
  
  // Count chapter summaries
  const chapterSummaries = aiBrainData.chapterSummaries.length;

  const summary = {
    characters,
    relationships,
    plotElements,
    totalKnowledge,
    chapterSummaries,
    totalChapters
  };

  const missingRequirements: string[] = [];

  // Check characters
  if (characters < thresholds.minCharacters) {
    missingRequirements.push(`At least ${thresholds.minCharacters} characters needed (found ${characters})`);
  }

  // Check relationships
  if (relationships < thresholds.minRelationships) {
    missingRequirements.push(`At least ${thresholds.minRelationships} character relationship needed (found ${relationships})`);
  }

  // Check plot elements
  if (plotElements < thresholds.minPlotElements) {
    missingRequirements.push(`At least ${thresholds.minPlotElements} plot thread or timeline event needed (found ${plotElements})`);
  }

  // Check total knowledge
  if (totalKnowledge < thresholds.minTotalKnowledge) {
    missingRequirements.push(`At least ${thresholds.minTotalKnowledge} total knowledge entries needed (found ${totalKnowledge})`);
  }

  // Check chapter summaries (only if multiple chapters)
  if (totalChapters > 1 && chapterSummaries < thresholds.minChapterSummaries) {
    missingRequirements.push(`At least ${thresholds.minChapterSummaries} chapter summary needed for multi-chapter projects (found ${chapterSummaries})`);
  }

  return {
    isValid: missingRequirements.length === 0,
    missingRequirements,
    summary
  };
};

export const getAIBrainValidationMessage = (validationResult: AIBrainValidationResult): string => {
  if (validationResult.isValid) {
    return "AI Brain data is sufficient for enhancement";
  }

  if (validationResult.missingRequirements.length === 1 && 
      validationResult.missingRequirements[0].includes('loading')) {
    return "Loading AI Brain data...";
  }

  if (validationResult.missingRequirements.length === 1 && 
      validationResult.missingRequirements[0].includes('Failed to load')) {
    return "Failed to load AI Brain data";
  }

  return "Insufficient AI Brain data for enhancement. Please analyze your content in the Creation Space first.";
};

export const getDetailedValidationMessage = (validationResult: AIBrainValidationResult): string => {
  if (validationResult.isValid) {
    return "Your project has sufficient AI Brain data for enhancement.";
  }

  const requirements = validationResult.missingRequirements.join('\n• ');
  return `Enhancement requires sufficient AI Brain data. Missing requirements:\n\n• ${requirements}\n\nTo resolve this, go to the Creation Space and run "Analyze Content" to generate AI Brain data for your project.`;
};
