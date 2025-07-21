
import { AIBrainData } from '@/types/ai-brain';

export interface AIBrainValidationResult {
  isValid: boolean;
  missingRequirements: string[];
  totalDataPoints: number;
  requirements: {
    characters: { current: number; minimum: number; met: boolean };
    relationships: { current: number; minimum: number; met: boolean };
    plotElements: { current: number; minimum: number; met: boolean };
    totalKnowledge: { current: number; minimum: number; met: boolean };
    chapterSummaries: { current: number; minimum: number; met: boolean };
  };
}

export const validateAIBrainData = (
  aiBrainData: AIBrainData,
  totalChapters: number
): AIBrainValidationResult => {
  const requirements = {
    characters: { current: 0, minimum: 2, met: false },
    relationships: { current: 0, minimum: 1, met: false },
    plotElements: { current: 0, minimum: 1, met: false },
    totalKnowledge: { current: 0, minimum: 3, met: false },
    chapterSummaries: { current: 0, minimum: Math.min(1, totalChapters), met: false }
  };

  // Count characters (from knowledge base)
  requirements.characters.current = aiBrainData.knowledge.filter(
    item => item.category === 'character'
  ).length;

  // Count relationships
  requirements.relationships.current = aiBrainData.characterRelationships.length;

  // Count plot elements (plot threads + timeline events)
  requirements.plotElements.current = 
    aiBrainData.plotThreads.length + aiBrainData.timelineEvents.length;

  // Count total knowledge base entries
  requirements.totalKnowledge.current = 
    aiBrainData.knowledge.length + 
    aiBrainData.worldBuilding.length + 
    aiBrainData.themes.length;

  // Count chapter summaries
  requirements.chapterSummaries.current = aiBrainData.chapterSummaries.length;

  // Check if requirements are met
  requirements.characters.met = requirements.characters.current >= requirements.characters.minimum;
  requirements.relationships.met = requirements.relationships.current >= requirements.relationships.minimum;
  requirements.plotElements.met = requirements.plotElements.current >= requirements.plotElements.minimum;
  requirements.totalKnowledge.met = requirements.totalKnowledge.current >= requirements.totalKnowledge.minimum;
  requirements.chapterSummaries.met = requirements.chapterSummaries.current >= requirements.chapterSummaries.minimum;

  // Collect missing requirements
  const missingRequirements: string[] = [];
  
  if (!requirements.characters.met) {
    missingRequirements.push(`At least ${requirements.characters.minimum} characters (currently ${requirements.characters.current})`);
  }
  
  if (!requirements.relationships.met) {
    missingRequirements.push(`At least ${requirements.relationships.minimum} character relationship (currently ${requirements.relationships.current})`);
  }
  
  if (!requirements.plotElements.met) {
    missingRequirements.push(`At least ${requirements.plotElements.minimum} plot thread or timeline event (currently ${requirements.plotElements.current})`);
  }
  
  if (!requirements.totalKnowledge.met) {
    missingRequirements.push(`At least ${requirements.totalKnowledge.minimum} total knowledge entries (currently ${requirements.totalKnowledge.current})`);
  }
  
  if (!requirements.chapterSummaries.met && totalChapters > 0) {
    missingRequirements.push(`At least ${requirements.chapterSummaries.minimum} chapter summary (currently ${requirements.chapterSummaries.current})`);
  }

  const isValid = missingRequirements.length === 0;
  const totalDataPoints = requirements.totalKnowledge.current + 
                         requirements.relationships.current + 
                         requirements.plotElements.current + 
                         requirements.chapterSummaries.current;

  return {
    isValid,
    missingRequirements,
    totalDataPoints,
    requirements
  };
};
