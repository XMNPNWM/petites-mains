
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, chapterId } = await req.json();

    console.log('🤖 Chat request received:', {
      projectId,
      chapterId,
      messageLength: message?.length || 0
    });

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No message provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: message
    });

    const aiResponse = response.text;

    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    console.log('✅ Chat response generated successfully');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      usage: {
        inputTokens: 0, // GoogleGenAI doesn't provide detailed usage stats
        outputTokens: 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
