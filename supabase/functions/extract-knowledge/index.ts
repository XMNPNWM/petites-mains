
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
    const { content, projectId, extractionType = 'comprehensive' } = await req.json();
    
    console.log('Knowledge extraction request received:', { 
      projectId, 
      extractionType, 
      contentLength: content?.length || 0 
    });

    if (!content || !projectId) {
      return new Response(JSON.stringify({ 
        error: 'Content and projectId are required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google AI API key
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      console.error('Google AI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google AI API key not configured',
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

    // Create comprehensive extraction prompt
    const extractionPrompt = `Analyze the following text and extract comprehensive knowledge. Return a JSON object with the following structure:

{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description",
      "category": "character",
      "details": {
        "role": "protagonist/antagonist/supporting",
        "traits": ["trait1", "trait2"],
        "goals": "character goals",
        "relationships": ["other character names"]
      },
      "confidence_score": 0.85
    }
  ],
  "relationships": [
    {
      "character_a_name": "Character A",
      "character_b_name": "Character B",
      "relationship_type": "friend/enemy/family/romantic",
      "relationship_strength": 7,
      "confidence_score": 0.8
    }
  ],
  "plot_threads": [
    {
      "thread_name": "Main Quest",
      "thread_type": "main/subplot/backstory",
      "key_events": ["event1", "event2"],
      "thread_status": "active",
      "confidence_score": 0.9
    }
  ],
  "timeline_events": [
    {
      "event_name": "Important Event",
      "event_type": "scene/flashback/background_event",
      "event_description": "What happened",
      "chronological_order": 1,
      "characters_involved": ["character names"],
      "confidence_score": 0.85
    }
  ],
  "world_building": [
    {
      "name": "Location/Object/Concept",
      "category": "world_building",
      "description": "Description of the element",
      "details": {
        "type": "location/object/concept/rule",
        "significance": "importance to story"
      },
      "confidence_score": 0.8
    }
  ],
  "themes": [
    {
      "name": "Theme Name",
      "category": "theme",
      "description": "How this theme is explored",
      "confidence_score": 0.75
    }
  ]
}

Text to analyze:
${content}

Return only valid JSON, no additional text.`;

    console.log('Calling Google AI API for knowledge extraction with gemini-2.5-flash');

    // Call Google AI API - Using gemini-2.5-flash for knowledge extraction
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: extractionPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', { status: response.status, error: errorText });
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google AI response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Google AI API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response in case it has markdown formatting
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', aiResponse);
      throw new Error('Failed to parse knowledge extraction response');
    }

    console.log('Knowledge extracted successfully:', {
      characters: extractedData.characters?.length || 0,
      relationships: extractedData.relationships?.length || 0,
      plotThreads: extractedData.plot_threads?.length || 0,
      timelineEvents: extractedData.timeline_events?.length || 0,
      worldBuilding: extractedData.world_building?.length || 0,
      themes: extractedData.themes?.length || 0
    });

    // Store extracted knowledge in database
    let storedCount = 0;
    const errors = [];

    // Store characters
    if (extractedData.characters && extractedData.characters.length > 0) {
      for (const character of extractedData.characters) {
        try {
          const { error } = await supabase
            .from('knowledge_base')
            .upsert({
              project_id: projectId,
              name: character.name,
              category: 'character',
              description: character.description,
              details: character.details || {},
              confidence_score: character.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,name,category'
            });
          
          if (error) {
            console.error('Error storing character:', error);
            errors.push(`Character ${character.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored character:', character.name);
          }
        } catch (error) {
          console.error('Error storing character:', error);
          errors.push(`Character ${character.name}: ${error.message}`);
        }
      }
    }

    // Store relationships
    if (extractedData.relationships && extractedData.relationships.length > 0) {
      for (const rel of extractedData.relationships) {
        try {
          const { error } = await supabase
            .from('character_relationships')
            .upsert({
              project_id: projectId,
              character_a_name: rel.character_a_name,
              character_b_name: rel.character_b_name,
              relationship_type: rel.relationship_type,
              relationship_strength: rel.relationship_strength || 5,
              confidence_score: rel.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,character_a_name,character_b_name'
            });
          
          if (error) {
            console.error('Error storing relationship:', error);
            errors.push(`Relationship ${rel.character_a_name}-${rel.character_b_name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored relationship:', `${rel.character_a_name}-${rel.character_b_name}`);
          }
        } catch (error) {
          console.error('Error storing relationship:', error);
          errors.push(`Relationship ${rel.character_a_name}-${rel.character_b_name}: ${error.message}`);
        }
      }
    }

    // Store plot threads
    if (extractedData.plot_threads && extractedData.plot_threads.length > 0) {
      for (const thread of extractedData.plot_threads) {
        try {
          const { error } = await supabase
            .from('plot_threads')
            .upsert({
              project_id: projectId,
              thread_name: thread.thread_name,
              thread_type: thread.thread_type,
              key_events: thread.key_events || [],
              thread_status: thread.thread_status || 'active',
              confidence_score: thread.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,thread_name'
            });
          
          if (error) {
            console.error('Error storing plot thread:', error);
            errors.push(`Plot thread ${thread.thread_name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored plot thread:', thread.thread_name);
          }
        } catch (error) {
          console.error('Error storing plot thread:', error);
          errors.push(`Plot thread ${thread.thread_name}: ${error.message}`);
        }
      }
    }

    // Store timeline events
    if (extractedData.timeline_events && extractedData.timeline_events.length > 0) {
      for (const event of extractedData.timeline_events) {
        try {
          const { error } = await supabase
            .from('timeline_events')
            .upsert({
              project_id: projectId,
              event_name: event.event_name,
              event_type: event.event_type,
              event_description: event.event_description,
              chronological_order: event.chronological_order || 0,
              characters_involved: event.characters_involved || [],
              confidence_score: event.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,event_name'
            });
          
          if (error) {
            console.error('Error storing timeline event:', error);
            errors.push(`Timeline event ${event.event_name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored timeline event:', event.event_name);
          }
        } catch (error) {
          console.error('Error storing timeline event:', error);
          errors.push(`Timeline event ${event.event_name}: ${error.message}`);
        }
      }
    }

    // Store world building elements
    if (extractedData.world_building && extractedData.world_building.length > 0) {
      for (const element of extractedData.world_building) {
        try {
          const { error } = await supabase
            .from('knowledge_base')
            .upsert({
              project_id: projectId,
              name: element.name,
              category: 'world_building',
              description: element.description,
              details: element.details || {},
              confidence_score: element.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,name,category'
            });
          
          if (error) {
            console.error('Error storing world building element:', error);
            errors.push(`World building ${element.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored world building element:', element.name);
          }
        } catch (error) {
          console.error('Error storing world building element:', error);
          errors.push(`World building ${element.name}: ${error.message}`);
        }
      }
    }

    // Store themes
    if (extractedData.themes && extractedData.themes.length > 0) {
      for (const theme of extractedData.themes) {
        try {
          const { error } = await supabase
            .from('knowledge_base')
            .upsert({
              project_id: projectId,
              name: theme.name,
              category: 'theme',
              description: theme.description,
              details: {},
              confidence_score: theme.confidence_score || 0.5,
              extraction_method: 'llm_direct'
            }, {
              onConflict: 'project_id,name,category'
            });
          
          if (error) {
            console.error('Error storing theme:', error);
            errors.push(`Theme ${theme.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('Stored theme:', theme.name);
          }
        } catch (error) {
          console.error('Error storing theme:', error);
          errors.push(`Theme ${theme.name}: ${error.message}`);
        }
      }
    }

    console.log(`Knowledge extraction completed: ${storedCount} items stored, ${errors.length} errors`);
    
    if (errors.length > 0) {
      console.error('Storage errors encountered:', errors);
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      storedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully extracted and stored ${storedCount} knowledge items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Knowledge extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Knowledge extraction failed',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
