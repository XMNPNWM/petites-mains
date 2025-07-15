
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client for data fetching
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Aggregates all AI Brain data for story context
 */
async function aggregateStoryContext(projectId: string): Promise<string> {
  try {
    console.log('🧠 Aggregating story context for project:', projectId);

    // Fetch all data types in parallel
    const [
      knowledgeResponse,
      chapterSummariesResponse,
      plotPointsResponse,
      plotThreadsResponse,
      timelineEventsResponse,
      characterRelationshipsResponse
    ] = await Promise.all([
      supabase.from('knowledge_base').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('chapter_summaries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('plot_points').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('plot_threads').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('timeline_events').select('*').eq('project_id', projectId).order('chronological_order', { ascending: true }),
      supabase.from('character_relationships').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    ]);

    // Check for errors
    const errors = [
      knowledgeResponse.error,
      chapterSummariesResponse.error,
      plotPointsResponse.error,
      plotThreadsResponse.error,
      timelineEventsResponse.error,
      characterRelationshipsResponse.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('❌ Errors fetching story context:', errors);
      return "Story context is currently being analyzed. No detailed information is available yet.";
    }

    // Process the data
    const allKnowledge = knowledgeResponse.data || [];
    const chapterSummaries = chapterSummariesResponse.data || [];
    const plotPoints = plotPointsResponse.data || [];
    const plotThreads = plotThreadsResponse.data || [];
    const timelineEvents = timelineEventsResponse.data || [];
    const characterRelationships = characterRelationshipsResponse.data || [];

    // Separate knowledge by category
    const characters = allKnowledge.filter(item => item.category === 'character');
    const worldBuilding = allKnowledge.filter(item => item.category === 'world_building');
    const themes = allKnowledge.filter(item => item.category === 'theme');

    // Build narrative context
    const sections: string[] = [];

    // Characters
    if (characters.length > 0) {
      sections.push("## CHARACTER PROFILES");
      characters.forEach(char => {
        sections.push(`**${char.name}**${char.subcategory ? ` (${char.subcategory})` : ''}`);
        if (char.description) sections.push(`- ${char.description}`);
        if (char.details && typeof char.details === 'object') {
          Object.entries(char.details).forEach(([key, value]) => {
            if (value) sections.push(`- ${key}: ${value}`);
          });
        }
        sections.push('');
      });
    }

    // Relationships
    if (characterRelationships.length > 0) {
      sections.push("## CHARACTER RELATIONSHIPS");
      characterRelationships.forEach(rel => {
        sections.push(`**${rel.character_a_name} ↔ ${rel.character_b_name}** (${rel.relationship_type})`);
        if (rel.evidence) sections.push(`- ${rel.evidence}`);
        sections.push('');
      });
    }

    // Timeline
    if (timelineEvents.length > 0) {
      sections.push("## STORY TIMELINE");
      timelineEvents.slice(0, 10).forEach(event => { // Limit to recent events
        sections.push(`**${event.event_name}** (${event.event_type})`);
        if (event.event_description) sections.push(`- ${event.event_description}`);
        sections.push('');
      });
    }

    // Plot threads
    if (plotThreads.length > 0) {
      sections.push("## PLOT THREADS");
      plotThreads.slice(0, 8).forEach(thread => { // Limit for context size
        sections.push(`**${thread.thread_name}** (${thread.thread_type})`);
        if (thread.evidence) sections.push(`- ${thread.evidence}`);
        sections.push('');
      });
    }

    // World building
    if (worldBuilding.length > 0) {
      sections.push("## WORLD BUILDING");
      worldBuilding.slice(0, 10).forEach(element => {
        sections.push(`**${element.name}**${element.subcategory ? ` (${element.subcategory})` : ''}`);
        if (element.description) sections.push(`- ${element.description}`);
        sections.push('');
      });
    }

    const contextText = sections.join('\n');
    
    if (contextText.trim().length === 0) {
      return "The story context is currently being analyzed. No detailed information is available yet.";
    }

    return `# STORY CONTEXT

You are an AI assistant helping with a creative writing project. Below is the complete context about this story:

${contextText}

Use this context to provide informed and relevant assistance. Reference specific characters, plot elements, and world-building details when appropriate to maintain story consistency.`;

  } catch (error) {
    console.error('❌ Error aggregating story context:', error);
    return "I'm having trouble accessing the story context right now, but I'm still here to help with your writing!";
  }
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

    // Generate story context for enhanced assistance
    const storyContext = await aggregateStoryContext(projectId);
    
    console.log('📝 Story context generated, length:', storyContext.length);

    // Combine story context with user message for @google/genai format
    const combinedPrompt = `${storyContext}\n\nUser: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: combinedPrompt
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
