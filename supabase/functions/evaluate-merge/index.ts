import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const ai = new GoogleGenAI({ apiKey: googleAIKey });

    const { prompt, itemType, options = {} } = await req.json();

    if (!prompt || !itemType) {
      throw new Error('Missing required parameters: prompt and itemType');
    }

    console.log(`🤖 Starting Gemini merge evaluation for ${itemType}`);
    console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');

    // Generate merge decision using Gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        temperature: options.temperature || 0.1,
        maxOutputTokens: options.maxTokens || 1000,
      }
    });

    if (!response || !response.text) {
      throw new Error('No response from Gemini AI');
    }

    console.log('🔍 Raw Gemini response:', response.text.substring(0, 500) + '...');

    // Parse the JSON response
    let decision;
    try {
      const cleanedResponse = response.text.replace(/```json\n?|\n?```/g, '').trim();
      decision = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      console.error('Raw response:', response.text);
      
      // Fallback decision on parse error
      decision = {
        action: 'keep_distinct',
        reason: 'Failed to parse AI response - defaulting to keep distinct for safety',
        confidence: 0.5
      };
    }

    // Validate the decision structure
    if (!decision.action || !['merge', 'discard', 'keep_distinct'].includes(decision.action)) {
      console.warn('⚠️ Invalid action in decision, defaulting to keep_distinct');
      decision.action = 'keep_distinct';
      decision.reason = 'Invalid AI response format - defaulting to keep distinct';
    }

    // Ensure confidence is a valid number
    if (typeof decision.confidence !== 'number' || decision.confidence < 0 || decision.confidence > 1) {
      decision.confidence = 0.7;
    }

    console.log('✅ Merge decision generated:', {
      action: decision.action,
      reason: decision.reason?.substring(0, 100) + '...',
      confidence: decision.confidence,
      hasMergedData: !!decision.mergedData
    });

    // Log the decision for audit purposes (backend only)
    try {
      await supabase
        .from('knowledge_change_log')
        .insert({
          change_type: 'ai_merge_decision',
          field_changed: itemType,
          new_value: JSON.stringify({
            action: decision.action,
            reason: decision.reason,
            confidence: decision.confidence
          }),
          change_reason: 'Conservative deduplication merge evaluation'
        });
    } catch (logError) {
      console.warn('Failed to log merge decision:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify({
      success: true,
      decision: {
        action: decision.action,
        reason: decision.reason,
        confidence: decision.confidence,
        mergedData: decision.mergedData || null
      },
      metadata: {
        itemType,
        evaluatedAt: new Date().toISOString(),
        model: 'gemini-2.5-flash'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in Gemini merge evaluation:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      decision: {
        action: 'keep_distinct',
        reason: 'Error in merge evaluation - defaulting to keep distinct for data safety',
        confidence: 0.5
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});