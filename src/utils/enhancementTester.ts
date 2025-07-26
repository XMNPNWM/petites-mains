/**
 * Comprehensive Enhancement Testing Utility
 * Tests all scenarios: new chapters, existing chapters, re-enhancements
 */

import { supabase } from '@/integrations/supabase/client';

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<string>; // Returns chapter ID
  test: (chapterId: string) => Promise<TestResult>;
  cleanup?: (chapterId: string) => Promise<void>;
}

export interface TestResult {
  success: boolean;
  details: {
    edgeFunctionCalled: boolean;
    statusTransition: string;
    changeTrackingPopulated: boolean;
    enhancedContentGenerated: boolean;
    aiChangesCount: number;
    errors: string[];
  };
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export class EnhancementTester {
  
  /**
   * Test Scenario 1: Brand new chapter (never enhanced)
   */
  static async testNewChapter(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      console.log('🧪 Testing new chapter enhancement...');
      
      // Create a test chapter
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          project_id: '0f4a3472-61f6-4631-9e71-14ab8aabbcfe',
          title: 'Test New Chapter',
          content: 'This is a test chapter for enhancement testing. It has some grammar errors and could be improved.',
          order_index: 999,
          status: 'draft'
        })
        .select()
        .single();
        
      if (chapterError) {
        errors.push(`Failed to create test chapter: ${chapterError.message}`);
        return this.createFailedResult(startTime, errors);
      }
      
      // Test enhancement
      const result = await this.testEnhancementProcess(chapter.id);
      
      // Cleanup
      await supabase.from('chapters').delete().eq('id', chapter.id);
      
      return result;
      
    } catch (error) {
      errors.push(`Unexpected error: ${error.message}`);
      return this.createFailedResult(startTime, errors);
    }
  }
  
  /**
   * Test Scenario 2: Existing untouched chapter
   */
  static async testExistingChapter(): Promise<TestResult> {
    const startTime = Date.now();
    console.log('🧪 Testing existing chapter enhancement...');
    
    // Use the current chapter in the route
    return await this.testEnhancementProcess('c8758b10-325e-4828-b659-86d09a354eea');
  }
  
  /**
   * Test Scenario 3: Re-enhancement of previously enhanced chapter
   */
  static async testReEnhancement(): Promise<TestResult> {
    const startTime = Date.now();
    console.log('🧪 Testing re-enhancement...');
    
    // First enhance the chapter
    const firstResult = await this.testEnhancementProcess('c8758b10-325e-4828-b659-86d09a354eea');
    
    if (!firstResult.success) {
      return firstResult;
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enhance again
    return await this.testEnhancementProcess('c8758b10-325e-4828-b659-86d09a354eea');
  }
  
  /**
   * Core enhancement testing logic
   */
  private static async testEnhancementProcess(chapterId: string): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let edgeFunctionCalled = false;
    let statusTransition = '';
    let changeTrackingPopulated = false;
    let enhancedContentGenerated = false;
    let aiChangesCount = 0;
    
    try {
      // Check initial refinement status
      const { data: initialRefinement } = await supabase
        .from('chapter_refinements')
        .select('*')
        .eq('chapter_id', chapterId)
        .maybeSingle();
        
      console.log('📊 Initial refinement status:', initialRefinement?.refinement_status || 'none');
      
      // Call enhancement service
      console.log('🚀 Calling enhancement service...');
      
      const { data: enhancementResult, error: enhancementError } = await supabase.functions.invoke('enhance-chapter', {
        body: { 
          projectId: '0f4a3472-61f6-4631-9e71-14ab8aabbcfe',
          chapterId: chapterId,
          enhancementOptions: {
            enhancementLevel: 'light',
            preserveAuthorVoice: true,
            applyGrammarFixes: true,
            applyPunctuationFixes: true,
            applyFormattingFixes: false,
            improveReadability: true,
            improveStyle: false
          }
        }
      });
      
      edgeFunctionCalled = !enhancementError;
      
      if (enhancementError) {
        errors.push(`Edge function error: ${enhancementError.message}`);
      } else {
        console.log('✅ Edge function called successfully');
        console.log('📥 Enhancement result:', enhancementResult);
      }
      
      // Check final refinement status
      const { data: finalRefinement } = await supabase
        .from('chapter_refinements')
        .select('*')
        .eq('chapter_id', chapterId)
        .single();
        
      if (finalRefinement) {
        statusTransition = `${initialRefinement?.refinement_status || 'none'} → ${finalRefinement.refinement_status}`;
        enhancedContentGenerated = !!finalRefinement.enhanced_content;
        console.log('📊 Final refinement status:', finalRefinement.refinement_status);
        console.log('📄 Enhanced content generated:', enhancedContentGenerated);
        
        // Check AI change tracking
        const { data: changes, count } = await supabase
          .from('ai_change_tracking')
          .select('*', { count: 'exact' })
          .eq('refinement_id', finalRefinement.id);
          
        aiChangesCount = count || 0;
        changeTrackingPopulated = aiChangesCount > 0;
        console.log('🔍 AI changes tracked:', aiChangesCount);
      } else {
        errors.push('No refinement record created');
      }
      
      const endTime = Date.now();
      
      return {
        success: errors.length === 0 && edgeFunctionCalled && enhancedContentGenerated,
        details: {
          edgeFunctionCalled,
          statusTransition,
          changeTrackingPopulated,
          enhancedContentGenerated,
          aiChangesCount,
          errors
        },
        timing: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
      
    } catch (error) {
      errors.push(`Test execution error: ${error.message}`);
      return this.createFailedResult(startTime, errors);
    }
  }
  
  private static createFailedResult(startTime: number, errors: string[]): TestResult {
    const endTime = Date.now();
    return {
      success: false,
      details: {
        edgeFunctionCalled: false,
        statusTransition: 'failed',
        changeTrackingPopulated: false,
        enhancedContentGenerated: false,
        aiChangesCount: 0,
        errors
      },
      timing: {
        startTime,
        endTime,
        duration: endTime - startTime
      }
    };
  }
  
  /**
   * Run all test scenarios
   */
  static async runComprehensiveTest(): Promise<{
    newChapter: TestResult;
    existingChapter: TestResult;
    reEnhancement: TestResult;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      overallSuccess: boolean;
    };
  }> {
    console.log('🚀 Starting comprehensive enhancement testing...');
    
    const newChapter = await this.testNewChapter();
    const existingChapter = await this.testExistingChapter();
    const reEnhancement = await this.testReEnhancement();
    
    const results = [newChapter, existingChapter, reEnhancement];
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    const summary = {
      totalTests: results.length,
      passedTests,
      failedTests,
      overallSuccess: passedTests === results.length
    };
    
    console.log('📊 Test Summary:', summary);
    
    return {
      newChapter,
      existingChapter,
      reEnhancement,
      summary
    };
  }
}

// Make it available globally for testing in console
(window as any).EnhancementTester = EnhancementTester;