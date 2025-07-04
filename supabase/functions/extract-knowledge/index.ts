
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
    
    console.log('🔍 Knowledge extraction request received:', { 
      projectId, 
      extractionType, 
      contentLength: content?.length || 0 
    });

    if (!content || !projectId) {
      console.error('❌ Missing required parameters:', { content: !!content, projectId: !!projectId });
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
      console.error('❌ Google AI API key not configured');
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

    // Create enhanced extraction prompt with more explicit instructions
    const extractionPrompt = `You are an expert story analyst. Analyze the following text and extract comprehensive knowledge. You MUST return a valid JSON object with this EXACT structure:

{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief character description",
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
  "world_building": [
    {
      "name": "Location/Object/Concept Name",
      "description": "Description of the world building element",
      "category": "world_building",
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
      "description": "How this theme is explored in the story",
      "category": "theme",
      "details": {},
      "confidence_score": 0.75
    }
  ]
}

Important rules:
- Return ONLY valid JSON, no additional text or markdown
- Each item MUST have: name, description, category, details (object), confidence_score (0-1)
- Use exactly these category names: "character", "world_building", "theme"
- Make descriptions detailed and specific
- Confidence scores should reflect how certain you are about each extraction

Text to analyze:
${content}`;

    console.log('🤖 Calling Google AI API for knowledge extraction');

    // Call Google AI API
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
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google AI API error:', { status: response.status, error: errorText });
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Google AI response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure from Google AI API:', data);
      throw new Error('Invalid response from Google AI API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('🔥 Raw AI Response (first 500 chars):', aiResponse.substring(0, 500));
    
    // Parse the JSON response with better error handling
    let extractedData;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
      console.log('✅ Successfully parsed AI response');
      console.log('📊 Parsed data structure:', {
        hasCharacters: !!extractedData.characters,
        charactersCount: extractedData.characters?.length || 0,
        hasWorldBuilding: !!extractedData.world_building,
        worldBuildingCount: extractedData.world_building?.length || 0,
        hasThemes: !!extractedData.themes,
        themesCount: extractedData.themes?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.log('🔍 Raw response that failed to parse:', aiResponse);
      throw new Error('Failed to parse knowledge extraction response');
    }

    // Store extracted knowledge in database with enhanced logging
    let storedCount = 0;
    const errors = [];

    // Store characters
    if (extractedData.characters && Array.isArray(extractedData.characters)) {
      console.log(`💾 Storing ${extractedData.characters.length} characters...`);
      for (const character of extractedData.characters) {
        try {
          console.log(`📝 Processing character: ${character.name}`);
          
          const knowledgeItem = {
            project_id: projectId,
            name: character.name || 'Unnamed Character',
            category: 'character',
            description: character.description || '',
            details: character.details || {},
            confidence_score: character.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          };
          
          console.log('🔍 Inserting character with data:', knowledgeItem);

          const { data: insertedData, error } = await supabase
            .from('knowledge_base')
            .upsert(knowledgeItem, {
              onConflict: 'project_id,name,category'
            })
            .select();
          
          if (error) {
            console.error('❌ Error storing character:', character.name, error);
            errors.push(`Character ${character.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('✅ Successfully stored character:', character.name, insertedData);
          }
        } catch (error) {
          console.error('❌ Exception storing character:', character.name, error);
          errors.push(`Character ${character.name}: ${error.message}`);
        }
      }
    }

    // Store world building elements
    if (extractedData.world_building && Array.isArray(extractedData.world_building)) {
      console.log(`💾 Storing ${extractedData.world_building.length} world building elements...`);
      for (const element of extractedData.world_building) {
        try {
          console.log(`📝 Processing world building: ${element.name}`);
          
          const knowledgeItem = {
            project_id: projectId,
            name: element.name || 'Unnamed Element',
            category: 'world_building',
            description: element.description || '',
            details: element.details || {},
            confidence_score: element.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          };
          
          console.log('🔍 Inserting world building with data:', knowledgeItem);

          const { data: insertedData, error } = await supabase
            .from('knowledge_base')
            .upsert(knowledgeItem, {
              onConflict: 'project_id,name,category'
            })
            .select();
          
          if (error) {
            console.error('❌ Error storing world building element:', element.name, error);
            errors.push(`World building ${element.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('✅ Successfully stored world building element:', element.name, insertedData);
          }
        } catch (error) {
          console.error('❌ Exception storing world building element:', element.name, error);
          errors.push(`World building ${element.name}: ${error.message}`);
        }
      }
    }

    // Store themes
    if (extractedData.themes && Array.isArray(extractedData.themes)) {
      console.log(`💾 Storing ${extractedData.themes.length} themes...`);
      for (const theme of extractedData.themes) {
        try {
          console.log(`📝 Processing theme: ${theme.name}`);
          
          const knowledgeItem = {
            project_id: projectId,
            name: theme.name || 'Unnamed Theme',
            category: 'theme',
            description: theme.description || '',
            details: theme.details || {},
            confidence_score: theme.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          };
          
          console.log('🔍 Inserting theme with data:', knowledgeItem);

          const { data: insertedData, error } = await supabase
            .from('knowledge_base')
            .upsert(knowledgeItem, {
              onConflict: 'project_id,name,category'
            })
            .select();
          
          if (error) {
            console.error('❌ Error storing theme:', theme.name, error);
            errors.push(`Theme ${theme.name}: ${error.message}`);
          } else {
            storedCount++;
            console.log('✅ Successfully stored theme:', theme.name, insertedData);
          }
        } catch (error) {
          console.error('❌ Exception storing theme:', theme.name, error);
          errors.push(`Theme ${theme.name}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Knowledge extraction completed: ${storedCount} items stored, ${errors.length} errors`);
    
    if (errors.length > 0) {
      console.error('❌ Storage errors encountered:', errors);
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
    console.error('❌ Knowledge extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Knowledge extraction failed',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
