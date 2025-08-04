import { LucideIcon } from 'lucide-react';
import { AIBrainData } from '@/types/ai-brain';

export interface TabMetadata {
  key: string;
  label: string;
  icon: LucideIcon;
  getCount: (data: AIBrainData) => number;
  component: React.ComponentType<TabComponentProps>;
}

export interface TabComponentProps {
  data: any[];
  onDataRefresh: () => Promise<void>;
  // Core update handlers
  onUpdateKnowledge: (id: string, field: 'name' | 'description' | 'subcategory', value: string) => Promise<void>;
  onToggleKnowledgeFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onUpdatePlotPoint: (id: string, field: 'name' | 'description', value: string) => Promise<void>;
  onTogglePlotPointFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onUpdatePlotThread: (id: string, value: string) => Promise<void>;
  onTogglePlotThreadFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onUpdateTimelineEvent: (id: string, field: 'event_name' | 'event_description', value: string) => Promise<void>;
  onToggleTimelineEventFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onToggleCharacterRelationshipFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onUpdateChapterSummary: (id: string, field: 'title' | 'summary_long', value: string) => Promise<void>;
  // Delete handlers (optional)
  onDeleteRelationship?: (id: string) => Promise<void>;
  onDeletePlotPoint?: (id: string) => Promise<void>;
  onDeletePlotThread?: (id: string) => Promise<void>;
  onDeleteKnowledgeItem?: (id: string) => Promise<void>;
  onDeleteTimelineEvent?: (id: string) => Promise<void>;
  // Type update handlers (optional)
  onUpdatePlotThreadType?: (id: string, threadType: string) => Promise<void>;
  onUpdateTimelineEventType?: (id: string, eventType: string) => Promise<void>;
  // Synthesis-specific props
  isSynthesizedView?: boolean;
  onResynthesize?: (category: string, entityName: string) => Promise<void>;
  onSynthesizeAll?: () => Promise<void>;
}