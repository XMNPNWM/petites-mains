
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced validation function for AI response structure
const validateAIResponse = (data: any) => {
  const validation = {
    isValid: true,
    issues: [] as string[],
    parsedData: null as any,
    confidence: 0
  };

  try {
    console.log('🔍 Validating AI response structure...');
    
    if (!data || typeof data !== 'object') {
      validation.isValid = false;
      validation.issues.push('Response is not a valid object');
      return validation;
    }

    // Check for expected top-level properties
    const expectedProps = ['characters', 'relationships', 'plot_threads', 'timeline_events', 'world_building', 'themes'];
    const foundProps = Object.keys(data);
    
    console.log('📋 Expected properties:', expectedProps);
    console.log('🔍 Found properties:', foundProps);
    
    let validProps = 0;
    const extractionSummary = {};
    
    for (const prop of expectedProps) {
      if (data[prop] && Array.isArray(data[prop])) {
        validProps++;
        extractionSummary[prop] = data[prop].length;
        console.log(`✅ ${prop}: ${data[prop].length} items found`);
      } else {
        extractionSummary[prop] = 0;
        console.log(`❌ ${prop}: missing or invalid`);
        validation.issues.push(`Missing or invalid property: ${prop}`);
      }
    }
    
    validation.confidence = validProps / expectedProps.length;
    validation.parsedData = data;
    
    console.log('📊 Validation summary:', {
      validProps: `${validProps}/${expectedProps.length}`,
      confidence: validation.confidence,
      extractionSummary
    });
    
    if (validProps === 0) {
      validation.isValid = false;
      validation.issues.push('No valid extraction properties found');
    }
    
  } catch (error) {
    validation.isValid = false;
    validation.issues.push(`Validation error: ${error.message}`);
    console.error('❌ Validation failed:', error);
  }
  
  return validation;
};

// Enhanced storage function with detailed logging
const storeExtractedKnowledge = async (supabase: any, projectId: string, extractedData: any) => {
  console.log('💾 Starting knowledge storage process...');
  
  let storedCount = 0;
  const errors = [];
  const storageDetails = {
    characters: { attempted: 0, stored: 0, errors: [] },
    world_building: { attempted: 0, stored: 0, errors: [] },
    themes: { attempted: 0, stored: 0, errors: [] }
  };

  // Store characters with enhanced logging
  if (extractedData.characters && extractedData.characters.length > 0) {
    console.log(`💾 Processing ${extractedData.characters.length} characters...`);
    storageDetails.characters.attempted = extractedData.characters.length;
    
    for (const character of extractedData.characters) {
      try {
        console.log(`📝 Storing character: "${character.name}"`);
        console.log(`   - Description: ${character.description?.substring(0, 100)}...`);
        console.log(`   - Confidence: ${character.confidence_score || 'N/A'}`);
        
        const { data: insertedData, error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: character.name,
            category: 'character',
            description: character.description || '',
            details: character.details || {},
            confidence_score: character.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          })
          .select();
        
        if (error) {
          console.error(`❌ Error storing character "${character.name}":`, error);
          storageDetails.characters.errors.push(`${character.name}: ${error.message}`);
          errors.push(`Character ${character.name}: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.characters.stored++;
          console.log(`✅ Successfully stored character: "${character.name}"`);
        }
      } catch (error) {
        console.error(`❌ Exception storing character "${character.name}":`, error);
        storageDetails.characters.errors.push(`${character.name}: ${error.message}`);
        errors.push(`Character ${character.name}: ${error.message}`);
      }
    }
  }

  // Store world building elements with enhanced logging
  if (extractedData.world_building && extractedData.world_building.length > 0) {
    console.log(`💾 Processing ${extractedData.world_building.length} world building elements...`);
    storageDetails.world_building.attempted = extractedData.world_building.length;
    
    for (const element of extractedData.world_building) {
      try {
        console.log(`🌍 Storing world building: "${element.name}"`);
        console.log(`   - Description: ${element.description?.substring(0, 100)}...`);
        console.log(`   - Confidence: ${element.confidence_score || 'N/A'}`);
        
        const { data: insertedData, error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: element.name,
            category: 'world_building',
            description: element.description || '',
            details: element.details || {},
            confidence_score: element.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          })
          .select();
        
        if (error) {
          console.error(`❌ Error storing world building "${element.name}":`, error);
          storageDetails.world_building.errors.push(`${element.name}: ${error.message}`);
          errors.push(`World building ${element.name}: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.world_building.stored++;
          console.log(`✅ Successfully stored world building: "${element.name}"`);
        }
      } catch (error) {
        console.error(`❌ Exception storing world building "${element.name}":`, error);
        storageDetails.world_building.errors.push(`${element.name}: ${error.message}`);
        errors.push(`World building ${element.name}: ${error.message}`);
      }
    }
  }

  // Store themes with enhanced logging
  if (extractedData.themes && extractedData.themes.length > 0) {
    console.log(`💾 Processing ${extractedData.themes.length} themes...`);
    storageDetails.themes.attempted = extractedData.themes.length;
    
    for (const theme of extractedData.themes) {
      try {
        console.log(`🎭 Storing theme: "${theme.name}"`);
        console.log(`   - Description: ${theme.description?.substring(0, 100)}...`);
        console.log(`   - Confidence: ${theme.confidence_score || 'N/A'}`);
        
        const { data: insertedData, error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: theme.name,
            category: 'theme',
            description: theme.description || '',
            details: {},
            confidence_score: theme.confidence_score || 0.5,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          })
          .select();
        
        if (error) {
          console.error(`❌ Error storing theme "${theme.name}":`, error);
          storageDetails.themes.errors.push(`${theme.name}: ${error.message}`);
          errors.push(`Theme ${theme.name}: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.themes.stored++;
          console.log(`✅ Successfully stored theme: "${theme.name}"`);
        }
      } catch (error) {
        console.error(`❌ Exception storing theme "${theme.name}":`, error);
        storageDetails.themes.errors.push(`${theme.name}: ${error.message}`);
        errors.push(`Theme ${theme.name}: ${error.message}`);
      }
    }
  }

  console.log('📊 Final storage summary:', storageDetails);
  return { storedCount, errors, storageDetails };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Knowledge extraction request started');
  const startTime = Date.now();

  try {
    const { content, projectId, extractionType = 'comprehensive' } = await req.json();
    
    console.log('📥 Request details:', { 
      projectId, 
      extractionType, 
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 200) + '...'
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

    console.log('🔑 Checking API key availability...');
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
    console.log('✅ API key found');

    console.log('🔗 Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('✅ Supabase client initialized');

    // Enhanced extraction prompt with better structure
    const extractionPrompt = `Analyze the following text and extract comprehensive knowledge. Return a JSON object with the following exact structure:

{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description of the character",
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

IMPORTANT: Return ONLY valid JSON, no additional text, no markdown formatting, no code blocks.

Text to analyze:
${content}`;

    console.log('🤖 Calling Google AI API for knowledge extraction...');
    console.log('📝 Prompt length:', extractionPrompt.length);

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

    console.log('📡 Google AI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google AI API error:', { status: response.status, error: errorText });
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Google AI response received');
    console.log('📊 Response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      partsLength: data.candidates?.[0]?.content?.parts?.length || 0
    });

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure from Google AI API:', data);
      throw new Error('Invalid response from Google AI API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('📝 Raw AI response length:', aiResponse.length);
    console.log('📝 Raw AI response preview:', aiResponse.substring(0, 500) + '...');
    
    // Parse the JSON response with enhanced error handling
    let extractedData;
    try {
      console.log('🔧 Attempting to parse AI response as JSON...');
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      console.log('🧹 Cleaned response preview:', cleanedResponse.substring(0, 300) + '...');
      
      extractedData = JSON.parse(cleanedResponse);
      console.log('✅ Successfully parsed AI response as JSON');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.log('📝 Problematic response section:', aiResponse.substring(0, 1000));
      throw new Error(`Failed to parse knowledge extraction response: ${parseError.message}`);
    }

    // Validate the AI response structure
    console.log('🔍 Validating extracted data structure...');
    const validation = validateAIResponse(extractedData);
    
    if (!validation.isValid) {
      console.error('❌ AI response validation failed:', validation.issues);
      return new Response(JSON.stringify({ 
        error: 'Invalid AI response structure',
        issues: validation.issues,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ AI response validation passed');
    console.log('📊 Extraction summary:', {
      characters: extractedData.characters?.length || 0,
      relationships: extractedData.relationships?.length || 0,
      plotThreads: extractedData.plot_threads?.length || 0,
      timelineEvents: extractedData.timeline_events?.length || 0,
      worldBuilding: extractedData.world_building?.length || 0,
      themes: extractedData.themes?.length || 0
    });

    // Store extracted knowledge with detailed logging
    console.log('💾 Beginning knowledge storage process...');
    const storageResult = await storeExtractedKnowledge(supabase, projectId, extractedData);

    const processingTime = Date.now() - startTime;
    console.log('⏱️ Total processing time:', processingTime, 'ms');
    console.log('✅ Knowledge extraction completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      storedCount: storageResult.storedCount,
      storageDetails: storageResult.storageDetails,
      errors: storageResult.errors.length > 0 ? storageResult.errors : undefined,
      validation: {
        confidence: validation.confidence,
        issues: validation.issues
      },
      processingTime,
      message: `Successfully extracted and stored ${storageResult.storedCount} knowledge items${storageResult.errors.length > 0 ? ` with ${storageResult.errors.length} errors` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Knowledge extraction error:', error);
    console.error('❌ Error stack:', error.stack);
    console.log('⏱️ Failed after:', processingTime, 'ms');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Knowledge extraction failed',
      processingTime,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
