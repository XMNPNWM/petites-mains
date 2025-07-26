import { supabase } from '@/integrations/supabase/client';

export interface ValidationRequirement {
  name: string;
  current: number;
  required: number;
  met: boolean;
  message: string;
  actionButton?: {
    text: string;
    action: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  requirements: ValidationRequirement[];
  totalScore: number;
  maxScore: number;
}

export class EnhancementDataValidator {
  private projectId: string;
  private chapterId?: string;

  constructor(projectId: string, chapterId?: string) {
    this.projectId = projectId;
    this.chapterId = chapterId;
  }

  async validateEnhancementRequirements(): Promise<ValidationResult> {
    try {
      // Fetch all required data in parallel
      const [
        worldbuildingCount,
        chapterWordCount,
        aiBrainCount
      ] = await Promise.all([
        this.getWorldbuildingElementsCount(),
        this.getChapterWordCount(),
        this.getAIBrainElementsCount()
      ]);

      const requirements: ValidationRequirement[] = [
        {
          name: 'Worldbuilding Elements',
          current: worldbuildingCount,
          required: 10,
          met: worldbuildingCount >= 10,
          message: worldbuildingCount >= 10 
            ? `You have ${worldbuildingCount} worldbuilding elements` 
            : `Add ${10 - worldbuildingCount} more worldbuilding elements`,
          actionButton: worldbuildingCount < 10 ? {
            text: 'Add Worldbuilding',
            action: 'worldbuilding'
          } : undefined
        },
        {
          name: 'Chapter Word Count',
          current: chapterWordCount,
          required: 1500,
          met: chapterWordCount >= 1500,
          message: chapterWordCount >= 1500 
            ? `This chapter has ${chapterWordCount.toLocaleString()} words` 
            : `Write ${(1500 - chapterWordCount).toLocaleString()} more words in this chapter`,
          actionButton: chapterWordCount < 1500 ? {
            text: 'Write More Content',
            action: 'writing'
          } : undefined
        },
        {
          name: 'AI Brain Data',
          current: aiBrainCount,
          required: 10,
          met: aiBrainCount >= 10,
          message: aiBrainCount >= 10 
            ? `You have ${aiBrainCount} AI brain elements` 
            : `Analyze content to generate ${10 - aiBrainCount} more AI brain elements`,
          actionButton: aiBrainCount < 10 ? {
            text: 'Analyze Content',
            action: 'analyze'
          } : undefined
        }
      ];

      const metRequirements = requirements.filter(req => req.met).length;
      const totalRequirements = requirements.length;

      return {
        isValid: metRequirements === totalRequirements,
        requirements,
        totalScore: metRequirements,
        maxScore: totalRequirements
      };

    } catch (error) {
      console.error('Error validating enhancement requirements:', error);
      
      // Return a safe fallback that allows enhancement but shows error
      return {
        isValid: true,
        requirements: [{
          name: 'Validation Error',
          current: 0,
          required: 1,
          met: false,
          message: 'Unable to check requirements. You can still proceed with enhancement.',
          actionButton: undefined
        }],
        totalScore: 0,
        maxScore: 1
      };
    }
  }

  private async getWorldbuildingElementsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('worldbuilding_elements')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching worldbuilding elements count:', error);
      return 0;
    }

    return count || 0;
  }

  private async getChapterWordCount(): Promise<number> {
    if (!this.chapterId) {
      return 0;
    }

    const { data, error } = await supabase
      .from('chapters')
      .select('word_count')
      .eq('id', this.chapterId)
      .single();

    if (error) {
      console.error('Error fetching chapter word count:', error);
      return 0;
    }

    return data?.word_count || 0;
  }

  private async getAIBrainElementsCount(): Promise<number> {
    const [
      knowledgeCount,
      relationshipsCount,
      plotPointsCount,
      plotThreadsCount,
      timelineCount
    ] = await Promise.all([
      this.getKnowledgeCount(),
      this.getRelationshipsCount(),
      this.getPlotPointsCount(),
      this.getPlotThreadsCount(),
      this.getTimelineCount()
    ]);

    return knowledgeCount + relationshipsCount + plotPointsCount + plotThreadsCount + timelineCount;
  }

  private async getKnowledgeCount(): Promise<number> {
    const { count, error } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching knowledge_base count:', error);
      return 0;
    }

    return count || 0;
  }

  private async getRelationshipsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('character_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching character_relationships count:', error);
      return 0;
    }

    return count || 0;
  }

  private async getPlotPointsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('plot_points')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching plot_points count:', error);
      return 0;
    }

    return count || 0;
  }

  private async getPlotThreadsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('plot_threads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching plot_threads count:', error);
      return 0;
    }

    return count || 0;
  }

  private async getTimelineCount(): Promise<number> {
    const { count, error } = await supabase
      .from('timeline_events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', this.projectId);

    if (error) {
      console.error('Error fetching timeline_events count:', error);
      return 0;
    }

    return count || 0;
  }
}