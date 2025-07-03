
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, chapterId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Chat request received:', { projectId, chapterId, messageLength: message.length });

    // Get API key from environment
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get project context if projectId is provided
    let contextPrompt = '';
    if (projectId) {
      console.log('Fetching project context for:', projectId);
      
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('title, description')
        .eq('id', projectId)
        .single();

      // Get recent knowledge base entries
      const { data: knowledge } = await supabase
        .from('knowledge_base')
        .select('name, description, category, confidence_score')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (project) {
        contextPrompt = `
Project Context:
- Title: ${project.title}
- Description: ${project.description}

Recent Knowledge Base (${knowledge?.length || 0} entries):
${knowledge?.map(k => `- ${k.name} (${k.category}, confidence: ${k.confidence_score}): ${k.description}`).join('\n') || 'No knowledge entries available'}

Please provide helpful responses about this creative writing project. Use the context above to give relevant advice and insights.
        `;
      }
    }

    // Prepare the prompt for Google AI
    const systemPrompt = `You are a helpful AI assistant specializing in creative writing and storytelling. You help authors with their writing projects by providing feedback, suggestions, and creative ideas.

${contextPrompt}

Please respond to the user's message in a helpful, creative, and encouraging manner.`;

    console.log('Calling Google AI API...');

    // Call Google AI API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', errorText);
      throw new Error(`Google AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Google AI response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Google AI API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
