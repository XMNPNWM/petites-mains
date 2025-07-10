import { AIBrainUpdateService } from '@/services/AIBrainUpdateService';

export class UnifiedUpdateService {
  static async updateKnowledgeItem(id: string, field: 'name' | 'description' | 'subcategory', value: string) {
    return AIBrainUpdateService.updateKnowledgeItem(id, { [field]: value });
  }

  static async toggleKnowledgeFlag(id: string, isFlagged: boolean) {
    return AIBrainUpdateService.toggleKnowledgeFlag(id, isFlagged);
  }

  static async updatePlotPoint(id: string, field: 'name' | 'description', value: string) {
    return AIBrainUpdateService.updatePlotPoint(id, { [field]: value });
  }

  static async togglePlotPointFlag(id: string, isFlagged: boolean) {
    return AIBrainUpdateService.togglePlotPointFlag(id, isFlagged);
  }

  static async updatePlotThread(id: string, value: string) {
    return AIBrainUpdateService.updatePlotThread(id, { thread_name: value });
  }

  static async togglePlotThreadFlag(id: string, isFlagged: boolean) {
    return AIBrainUpdateService.togglePlotThreadFlag(id, isFlagged);
  }

  static async updateTimelineEvent(id: string, field: 'event_name' | 'event_description', value: string) {
    return AIBrainUpdateService.updateTimelineEvent(id, { [field]: value });
  }

  static async toggleTimelineEventFlag(id: string, isFlagged: boolean) {
    return AIBrainUpdateService.toggleTimelineEventFlag(id, isFlagged);
  }

  static async toggleCharacterRelationshipFlag(id: string, isFlagged: boolean) {
    return AIBrainUpdateService.toggleCharacterRelationshipFlag(id, isFlagged);
  }

  static async updateCharacterRelationshipType(id: string, relationshipType: string) {
    return AIBrainUpdateService.updateCharacterRelationship(id, { relationship_type: relationshipType });
  }

  static async updateChapterSummary(id: string, field: 'title' | 'summary_long', value: string) {
    return AIBrainUpdateService.updateChapterSummary(id, { [field]: value });
  }

  static async updatePlotThreadType(id: string, threadType: string) {
    return AIBrainUpdateService.updatePlotThread(id, { thread_type: threadType });
  }

  static async updateTimelineEventType(id: string, eventType: string) {
    return AIBrainUpdateService.updateTimelineEvent(id, { event_type: eventType });
  }

  static async updateWorldBuildingType(id: string, type: string) {
    return AIBrainUpdateService.updateKnowledgeItem(id, { subcategory: type });
  }

  static async updateWorldBuildingName(id: string, name: string) {
    return AIBrainUpdateService.updateKnowledgeItem(id, { name });
  }

  // Delete methods
  static async deleteCharacterRelationship(id: string) {
    return AIBrainUpdateService.deleteCharacterRelationship(id);
  }

  static async deletePlotPoint(id: string) {
    return AIBrainUpdateService.deletePlotPoint(id);
  }

  static async deletePlotThread(id: string) {
    return AIBrainUpdateService.deletePlotThread(id);
  }

  static async deleteTimelineEvent(id: string) {
    return AIBrainUpdateService.deleteTimelineEvent(id);
  }

  static async deleteKnowledgeItem(id: string) {
    return AIBrainUpdateService.deleteKnowledgeItem(id);
  }
}