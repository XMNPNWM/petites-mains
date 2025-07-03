
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
    
    console.log('Chat request received:', { 
      projectId, 
      chapterId, 
      messageLength: message?.length || 0,
      hasMessage: !!message 
    });

    if (!message) {
      console.error('Message is required but not provided');
      return new Response(JSON.stringify({ 
        error: 'Message is required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google AI API key from environment
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      console.error('Google AI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google AI API key not configured. Please check your Supabase Edge Function secrets.',
        details: 'GOOGLE_AI_API_KEY environment variable is missing',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get project context if projectId is provided
    let contextPrompt = '';
    if (projectId) {
      console.log('Fetching project context for:', projectId);
      
      try {
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

        // Get current chapter if provided
        let chapterContext = '';
        if (chapterId) {
          const { data: chapter } = await supabase
            .from('chapters')
            .select('title, content')
            .eq('id', chapterId)
            .single();

          if (chapter) {
            chapterContext = `\nCurrent Chapter: "${chapter.title}"\nChapter Content Preview: ${chapter.content?.substring(0, 500) || 'No content'}...`;
          }
        }

        if (project) {
          contextPrompt = `
Project Context:
- Title: ${project.title}
- Description: ${project.description}
${chapterContext}

Recent Knowledge Base (${knowledge?.length || 0} entries):
${knowledge?.map(k => `- ${k.name} (${k.category}, confidence: ${k.confidence_score}): ${k.description}`).join('\n') || 'No knowledge entries available'}

Please provide helpful responses about this creative writing project. Use the context above to give relevant advice and insights.
          `;
        }
      } catch (contextError) {
        console.error('Error fetching project context:', contextError);
        // Continue without context rather than failing
        contextPrompt = 'Unable to load project context, but I can still help with general writing advice.';
      }
    }

    // Prepare the prompt for Google AI
    const systemPrompt = `You are a helpful AI assistant specializing in creative writing and storytelling. You help authors with their writing projects by providing feedback, suggestions, and creative ideas.

${contextPrompt}

Please respond to the user's message in a helpful, creative, and encouraging manner. Keep responses concise but valuable.`;

    console.log('Calling Google AI API with system prompt length:', systemPrompt.length);

    // Call Google AI API (Gemini) - Updated to use gemini-2.5-flash-lite for chat
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey, {
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

    console.log('Google AI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return new Response(JSON.stringify({ 
        error: `Google AI API error: ${response.status} - ${response.statusText}`,
        details: errorText,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Google AI response received, candidates:', data.candidates?.length || 0);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Google AI API:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from Google AI API',
        details: 'Response does not contain expected candidates structure',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('AI response generated successfully, length:', aiResponse?.length || 0);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: 'Check the edge function logs for more information',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
