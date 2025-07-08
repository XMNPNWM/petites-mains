import { Users, Heart, BookOpen, GitBranch, Calendar, Globe, FileText, Lightbulb } from 'lucide-react';
import { TabMetadata } from '@/types/ai-brain-tabs';
import { AIBrainData } from '@/types/ai-brain';
import { CharactersTab } from '@/components/features/dashboard/ai-brain/tabs/CharactersTab';
import { RelationshipsTab } from '@/components/features/dashboard/ai-brain/tabs/RelationshipsTab';
import { PlotPointsTab } from '@/components/features/dashboard/ai-brain/tabs/PlotPointsTab';
import { PlotThreadsTab } from '@/components/features/dashboard/ai-brain/tabs/PlotThreadsTab';
import { TimelineTab } from '@/components/features/dashboard/ai-brain/tabs/TimelineTab';
import { WorldBuildingTab } from '@/components/features/dashboard/ai-brain/tabs/WorldBuildingTab';
import { SummariesTab } from '@/components/features/dashboard/ai-brain/tabs/SummariesTab';
import { ThemesTab } from '@/components/features/dashboard/ai-brain/tabs/ThemesTab';

export const getTabConfiguration = (data: AIBrainData): TabMetadata[] => [
  {
    key: 'characters',
    label: 'Characters',
    icon: Users,
    getCount: (data) => data.knowledge.filter(k => k.category === 'character').length,
    component: CharactersTab
  },
  {
    key: 'relationships',
    label: 'Relations',
    icon: Heart,
    getCount: (data) => data.characterRelationships.length,
    component: RelationshipsTab
  },
  {
    key: 'plot-points',
    label: 'Plot Points',
    icon: BookOpen,
    getCount: (data) => data.plotPoints.length,
    component: PlotPointsTab
  },
  {
    key: 'plot-threads',
    label: 'Threads',
    icon: GitBranch,
    getCount: (data) => data.plotThreads.length,
    component: PlotThreadsTab
  },
  {
    key: 'timeline',
    label: 'Timeline',
    icon: Calendar,
    getCount: (data) => data.timelineEvents.length,
    component: TimelineTab
  },
  {
    key: 'world-building',
    label: 'World',
    icon: Globe,
    getCount: (data) => data.worldBuilding.length,
    component: WorldBuildingTab
  },
  {
    key: 'summaries',
    label: 'Summaries',
    icon: FileText,
    getCount: (data) => data.chapterSummaries.length,
    component: SummariesTab
  },
  {
    key: 'themes',
    label: 'Themes',
    icon: Lightbulb,
    getCount: (data) => data.themes.length,
    component: ThemesTab
  }
];