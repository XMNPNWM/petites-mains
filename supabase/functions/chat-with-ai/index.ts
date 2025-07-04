
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, chapterId } = await req.json();
    
    console.log('🔍 Chat request received:', { 
      message: message?.substring(0, 100) + '...',
      projectId, 
      chapterId 
    });

    if (!message || !projectId) {
      console.error('❌ Missing required parameters:', { message: !!message, projectId: !!projectId });
      return new Response(JSON.stringify({ 
        error: 'Message and projectId are required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google AI API key
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      console.error('❌ Google AI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured',
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

    // Get project context
    let contextInfo = '';
    
    try {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('title, description')
        .eq('id', projectId)
        .single();

      if (project) {
        contextInfo += `Project: ${project.title}\n`;
        if (project.description) {
          contextInfo += `Description: ${project.description}\n`;
        }
      }

      // Get chapter context if provided
      if (chapterId) {
        const { data: chapter } = await supabase
          .from('chapters')
          .select('title, content')
          .eq('id', chapterId)
          .single();

        if (chapter) {
          contextInfo += `Chapter: ${chapter.title}\n`;
          if (chapter.content) {
            contextInfo += `Chapter excerpt: ${chapter.content.substring(0, 500)}...\n`;
          }
        }
      }

      // Get some knowledge base context
      const { data: knowledge } = await supabase
        .from('knowledge_base')
        .select('name, category, description')
        .eq('project_id', projectId)
        .limit(5);

      if (knowledge && knowledge.length > 0) {
        contextInfo += '\nKey story elements:\n';
        knowledge.forEach(item => {
          contextInfo += `- ${item.name} (${item.category}): ${item.description}\n`;
        });
      }

    } catch (contextError) {
      console.warn('⚠️ Could not load context:', contextError);
    }

    // Create system prompt
    const systemPrompt = `You are a helpful AI writing assistant for creative writers. You help with story development, character analysis, plot suggestions, and writing advice.

${contextInfo ? `Context about the current story:\n${contextInfo}\n` : ''}

Guidelines:
- Be helpful and supportive
- Provide specific, actionable advice when possible
- Ask clarifying questions if needed
- Keep responses concise but informative
- Focus on creative writing and storytelling aspects`;

    console.log('🤖 Calling Google AI API for chat response');

    // Call Google AI API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
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
      console.error('❌ Google AI API error:', { status: response.status, error: errorText });
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Google AI response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure from Google AI API:', data);
      throw new Error('Invalid response from AI API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('🤖 AI Response generated:', aiResponse.substring(0, 100) + '...');

    return new Response(JSON.stringify({ 
      success: true,
      response: aiResponse,
      message: 'Chat response generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Chat AI error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Chat AI failed',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
