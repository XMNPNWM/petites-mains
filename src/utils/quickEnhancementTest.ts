/**
 * Quick test to verify the enhancement fix is working
 */
import { supabase } from '@/integrations/supabase/client';

export async function quickEnhancementTest() {
  console.log('🧪 Quick Enhancement Test Starting...');
  
  try {
    // Test the edge function directly
    console.log('📞 Calling enhance-chapter edge function...');
    
    const { data, error } = await supabase.functions.invoke('enhance-chapter', {
      body: {
        projectId: '0f4a3472-61f6-4631-9e71-14ab8aabbcfe',
        chapterId: 'c8758b10-325e-4828-b659-86d09a354eea',
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
    
    if (error) {
      console.error('❌ Edge function error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Edge function response:', data);
    
    // Check if refinement was created/updated
    const { data: refinement } = await supabase
      .from('chapter_refinements')
      .select('*')
      .eq('chapter_id', 'c8758b10-325e-4828-b659-86d09a354eea')
      .single();
      
    console.log('📊 Refinement status:', refinement?.refinement_status);
    
    // Check if change tracking was populated
    if (refinement) {
      const { data: changes, count } = await supabase
        .from('ai_change_tracking')
        .select('*', { count: 'exact' })
        .eq('refinement_id', refinement.id);
        
      console.log('🔍 AI changes count:', count);
      console.log('📝 Sample changes:', changes?.slice(0, 3));
    }
    
    return { 
      success: true, 
      refinementStatus: refinement?.refinement_status,
      changesCount: refinement ? await getChangesCount(refinement.id) : 0,
      data 
    };
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    return { success: false, error: error.message };
  }
}

async function getChangesCount(refinementId: string): Promise<number> {
  const { count } = await supabase
    .from('ai_change_tracking')
    .select('*', { count: 'exact' })
    .eq('refinement_id', refinementId);
  return count || 0;
}

// Auto-run the test
if (typeof window !== 'undefined') {
  (window as any).quickEnhancementTest = quickEnhancementTest;
  console.log('💡 Run quickEnhancementTest() in console to test enhancement');
}