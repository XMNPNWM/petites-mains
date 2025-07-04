
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticReport {
  timestamp: string;
  projectId: string;
  chapterId?: string;
  operation: 'knowledge_extraction' | 'chat_message';
  status: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  processingTime?: number;
  errors?: string[];
}

export class DiagnosticService {
  /**
   * Log a diagnostic event for analysis operations
   */
  static async logDiagnostic(report: DiagnosticReport): Promise<void> {
    try {
      console.log('📊 DiagnosticService: Logging diagnostic report', {
        operation: report.operation,
        status: report.status,
        projectId: report.projectId,
        processingTime: report.processingTime
      });

      // For now, we'll log to console and could extend to store in database
      const logEntry = {
        ...report,
        timestamp: new Date().toISOString()
      };

      console.log('🔍 DIAGNOSTIC_REPORT:', JSON.stringify(logEntry, null, 2));

      // Future: Could store these in a diagnostics table for historical analysis
      
    } catch (error) {
      console.error('❌ DiagnosticService: Failed to log diagnostic:', error);
    }
  }

  /**
   * Get project analysis diagnostics
   */
  static async getProjectDiagnostics(projectId: string): Promise<{
    recentExtractions: any[];
    recentChats: any[];
    errorSummary: Record<string, number>;
  }> {
    try {
      console.log('📊 DiagnosticService: Getting project diagnostics for', projectId);

      // Get recent processing jobs
      const { data: recentJobs } = await supabase
        .from('knowledge_processing_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get knowledge base stats
      const { data: knowledgeStats } = await supabase
        .from('knowledge_base')
        .select('category, confidence_score, is_flagged, extraction_method')
        .eq('project_id', projectId);

      // Get recent chat sessions
      const { data: recentChats } = await supabase
        .from('chat_sessions')
        .select('id, chat_type, created_at, status, messages')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      const diagnostics = {
        recentExtractions: recentJobs || [],
        recentChats: recentChats || [],
        errorSummary: this.summarizeErrors(recentJobs || [], knowledgeStats || [])
      };

      console.log('✅ DiagnosticService: Project diagnostics compiled', {
        recentExtractions: diagnostics.recentExtractions.length,
        recentChats: diagnostics.recentChats.length,
        errorTypes: Object.keys(diagnostics.errorSummary).length
      });

      return diagnostics;

    } catch (error) {
      console.error('❌ DiagnosticService: Failed to get project diagnostics:', error);
      return {
        recentExtractions: [],
        recentChats: [],
        errorSummary: {}
      };
    }
  }

  /**
   * Summarize error patterns from jobs and knowledge data
   */
  private static summarizeErrors(jobs: any[], knowledge: any[]): Record<string, number> {
    const errorSummary: Record<string, number> = {};

    // Analyze job failures
    jobs.forEach(job => {
      if (job.state === 'failed') {
        const errorType = job.error_message ? 'processing_error' : 'unknown_failure';
        errorSummary[errorType] = (errorSummary[errorType] || 0) + 1;
      }
    });

    // Analyze knowledge quality issues
    knowledge.forEach(item => {
      if (item.is_flagged) {
        errorSummary['flagged_knowledge'] = (errorSummary['flagged_knowledge'] || 0) + 1;
      }
      if (item.confidence_score < 0.5) {
        errorSummary['low_confidence'] = (errorSummary['low_confidence'] || 0) + 1;
      }
    });

    return errorSummary;
  }

  /**
   * Validate content accessibility
   */
  static async validateContentAccess(projectId: string, chapterId?: string): Promise<{
    isValid: boolean;
    issues: string[];
    contentStats: Record<string, any>;
  }> {
    try {
      console.log('🔍 DiagnosticService: Validating content access', { projectId, chapterId });

      const issues: string[] = [];
      const contentStats: Record<string, any> = {};

      // Check project exists and is accessible
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        issues.push('Project not found or not accessible');
        return { isValid: false, issues, contentStats };
      }

      contentStats.project = {
        title: project.title,
        hasDescription: !!project.description
      };

      // Check chapters if specified
      if (chapterId) {
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('id, title, content, word_count')
          .eq('id', chapterId)
          .eq('project_id', projectId)
          .single();

        if (chapterError || !chapter) {
          issues.push('Chapter not found or not accessible');
        } else {
          contentStats.chapter = {
            title: chapter.title,
            contentLength: chapter.content?.length || 0,
            wordCount: chapter.word_count || 0,
            hasContent: !!chapter.content
          };

          if (!chapter.content || chapter.content.trim().length === 0) {
            issues.push('Chapter has no content to analyze');
          }
        }
      }

      const isValid = issues.length === 0;
      console.log('✅ DiagnosticService: Content validation completed', { isValid, issueCount: issues.length });

      return { isValid, issues, contentStats };

    } catch (error) {
      console.error('❌ DiagnosticService: Content validation failed:', error);
      return {
        isValid: false,
        issues: ['Content validation failed due to system error'],
        contentStats: {}
      };
    }
  }
}
