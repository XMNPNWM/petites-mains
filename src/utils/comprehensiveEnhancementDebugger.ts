/**
 * Comprehensive Enhancement Debugging Script
 * Run this in the browser console to systematically debug the enhancement process
 */

import { supabase } from '@/integrations/supabase/client';
import { EnhancementService } from '@/services/EnhancementService';

export class ComprehensiveEnhancementDebugger {
  /**
   * Run comprehensive debugging on the enhancement process
   */
  static async debugEnhancementProcess(projectId: string, chapterId: string): Promise<void> {
    console.group('🔍 COMPREHENSIVE ENHANCEMENT DEBUGGING');
    console.log('🚀 Starting comprehensive enhancement debugging...');
    console.log('📋 Target:', { projectId, chapterId });

    try {
      // Phase 1: Pre-Enhancement State Check
      console.group('📊 PHASE 1: PRE-ENHANCEMENT STATE CHECK');
      await this.checkPreEnhancementState(chapterId);
      console.groupEnd();

      // Phase 2: Database Permissions Test
      console.group('🔒 PHASE 2: DATABASE PERMISSIONS TEST');
      await this.testDatabasePermissions(chapterId);
      console.groupEnd();

      // Phase 3: Edge Function Direct Test
      console.group('🚀 PHASE 3: EDGE FUNCTION DIRECT TEST');
      await this.testEdgeFunctionDirectly(projectId, chapterId);
      console.groupEnd();

      // Phase 4: Full Enhancement Process Test
      console.group('🎯 PHASE 4: FULL ENHANCEMENT PROCESS TEST');
      await this.testFullEnhancementProcess(projectId, chapterId);
      console.groupEnd();

      // Phase 5: Post-Enhancement State Check
      console.group('📊 PHASE 5: POST-ENHANCEMENT STATE CHECK');
      await this.checkPostEnhancementState(chapterId);
      console.groupEnd();

    } catch (error) {
      console.error('💥 DEBUGGING FAILED:', error);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Check the state before enhancement
   */
  static async checkPreEnhancementState(chapterId: string): Promise<void> {
    console.log('🔍 Checking pre-enhancement state...');

    // Check chapter exists
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (chapterError) {
      console.error('❌ Chapter fetch failed:', chapterError);
      return;
    }

    console.log('✅ Chapter found:', {
      id: chapter.id,
      title: chapter.title,
      contentLength: chapter.content?.length || 0,
      status: chapter.status
    });

    // Check refinement data
    const { data: refinement, error: refinementError } = await supabase
      .from('chapter_refinements')
      .select('*')
      .eq('chapter_id', chapterId)
      .maybeSingle();

    if (refinementError) {
      console.error('❌ Refinement fetch failed:', refinementError);
      return;
    }

    if (refinement) {
      console.log('✅ Existing refinement found:', {
        id: refinement.id,
        status: refinement.refinement_status,
        hasOriginalContent: !!refinement.original_content,
        hasEnhancedContent: !!refinement.enhanced_content,
        enhancedContentLength: refinement.enhanced_content?.length || 0
      });
    } else {
      console.log('ℹ️ No existing refinement data');
    }

    // Check change tracking
    if (refinement) {
      const { data: changes, error: changesError } = await supabase
        .from('ai_change_tracking')
        .select('*')
        .eq('refinement_id', refinement.id);

      if (changesError) {
        console.error('❌ Change tracking fetch failed:', changesError);
      } else {
        console.log('📊 Existing change tracking records:', changes?.length || 0);
      }
    }
  }

  /**
   * Test database permissions
   */
  static async testDatabasePermissions(chapterId: string): Promise<void> {
    console.log('🔒 Testing database permissions...');

    try {
      // Test chapter_refinements read
      const { data: refinementRead, error: refinementReadError } = await supabase
        .from('chapter_refinements')
        .select('*')
        .eq('chapter_id', chapterId)
        .limit(1);

      if (refinementReadError) {
        console.error('❌ Cannot read chapter_refinements:', refinementReadError);
      } else {
        console.log('✅ Can read chapter_refinements');
      }

      // Test chapter_refinements update (if record exists)
      if (refinementRead && refinementRead.length > 0) {
        const testUpdate = {
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('chapter_refinements')
          .update(testUpdate)
          .eq('id', refinementRead[0].id);

        if (updateError) {
          console.error('❌ Cannot update chapter_refinements:', updateError);
        } else {
          console.log('✅ Can update chapter_refinements');
        }
      }

      // Test ai_change_tracking permissions
      const { data: trackingRead, error: trackingReadError } = await supabase
        .from('ai_change_tracking')
        .select('*')
        .limit(1);

      if (trackingReadError) {
        console.error('❌ Cannot read ai_change_tracking:', trackingReadError);
      } else {
        console.log('✅ Can read ai_change_tracking');
      }

    } catch (error) {
      console.error('💥 Database permissions test failed:', error);
    }
  }

  /**
   * Test edge function directly
   */
  static async testEdgeFunctionDirectly(projectId: string, chapterId: string): Promise<void> {
    console.log('🚀 Testing edge function directly...');

    try {
      const { data: chapter } = await supabase
        .from('chapters')
        .select('content')
        .eq('id', chapterId)
        .single();

      if (!chapter?.content) {
        console.error('❌ No chapter content to test with');
        return;
      }

      console.log('📤 Calling enhance-chapter edge function...');
      const startTime = Date.now();

      const { data: result, error } = await supabase.functions.invoke('enhance-chapter', {
        body: {
          content: chapter.content,
          projectId: projectId,
          chapterId: chapterId,
          options: {
            enhancementLevel: 'moderate',
            preserveAuthorVoice: true,
            applyGrammarFixes: true,
            applyPunctuationFixes: true,
            applyFormattingFixes: true,
            improveReadability: true,
            improveStyle: true
          }
        }
      });

      const endTime = Date.now();
      console.log('⏱️ Edge function call took:', (endTime - startTime), 'ms');

      if (error) {
        console.error('❌ Edge function error:', error);
        return;
      }

      console.log('✅ Edge function success!');
      console.log('📊 Response analysis:');
      console.log('- Has data?:', !!result);
      console.log('- Response keys:', result ? Object.keys(result) : 'N/A');
      
      if (result) {
        console.log('- Has enhancedContent?:', 'enhancedContent' in result);
        console.log('- Enhanced content length:', result.enhancedContent?.length || 0);
        console.log('- Has changes?:', 'changes' in result);
        console.log('- Changes count:', result.changes?.length || 0);
        
        if (result.changes && Array.isArray(result.changes) && result.changes.length > 0) {
          console.log('- First change sample:', result.changes[0]);
        }
      }

    } catch (error) {
      console.error('💥 Edge function test failed:', error);
    }
  }

  /**
   * Test the full enhancement process
   */
  static async testFullEnhancementProcess(projectId: string, chapterId: string): Promise<void> {
    console.log('🎯 Testing full enhancement process...');

    try {
      console.log('🚀 Starting EnhancementService.enhanceChapter...');
      
      await EnhancementService.enhanceChapter(projectId, chapterId, () => {
        console.log('✅ Enhancement callback triggered');
      });

      console.log('🎉 Enhancement process completed successfully!');

    } catch (error) {
      console.error('💥 Full enhancement process failed:', error);
    }
  }

  /**
   * Check the state after enhancement
   */
  static async checkPostEnhancementState(chapterId: string): Promise<void> {
    console.log('🔍 Checking post-enhancement state...');

    // Check refinement status
    const { data: refinement, error: refinementError } = await supabase
      .from('chapter_refinements')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();

    if (refinementError) {
      console.error('❌ Post-enhancement refinement fetch failed:', refinementError);
      return;
    }

    console.log('📊 Post-enhancement refinement state:', {
      id: refinement.id,
      status: refinement.refinement_status,
      hasOriginalContent: !!refinement.original_content,
      hasEnhancedContent: !!refinement.enhanced_content,
      enhancedContentLength: refinement.enhanced_content?.length || 0,
      originalContentLength: refinement.original_content?.length || 0
    });

    // Check if content was actually enhanced
    if (refinement.enhanced_content && refinement.original_content) {
      const isContentDifferent = refinement.enhanced_content !== refinement.original_content;
      console.log('📝 Content change analysis:');
      console.log('- Content was modified?:', isContentDifferent);
      console.log('- Length difference:', (refinement.enhanced_content?.length || 0) - (refinement.original_content?.length || 0));
    }

    // Check change tracking records
    const { data: changes, error: changesError } = await supabase
      .from('ai_change_tracking')
      .select('*')
      .eq('refinement_id', refinement.id);

    if (changesError) {
      console.error('❌ Post-enhancement change tracking fetch failed:', changesError);
    } else {
      console.log('📊 Post-enhancement change tracking:');
      console.log('- Total changes:', changes?.length || 0);
      
      if (changes && changes.length > 0) {
        const changeTypes = changes.reduce((acc: any, change) => {
          acc[change.change_type] = (acc[change.change_type] || 0) + 1;
          return acc;
        }, {});
        
        console.log('- Change types breakdown:', changeTypes);
        console.log('- Sample change:', changes[0]);
      }
    }
  }
}

// Make it available globally for console testing
(window as any).ComprehensiveEnhancementDebugger = ComprehensiveEnhancementDebugger;

export default ComprehensiveEnhancementDebugger;