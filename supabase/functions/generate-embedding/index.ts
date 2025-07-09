
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY');
    
    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey: googleAIKey });
    const { text, model = "text-embedding-004" } = await req.json();

    if (!text) {
      throw new Error('Text parameter is required');
    }

    console.log(`Generating embedding with model: ${model}`);

    const response = await ai.models.embedContent({
      model: model,
      content: {
        parts: [{ text }]
      }
    });

    if (!response.embedding?.values) {
      throw new Error('Invalid embedding response from Google AI');
    }

    return new Response(JSON.stringify({
      embedding: response.embedding.values,
      model: model,
      tokens_used: Math.ceil(text.length / 4)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
