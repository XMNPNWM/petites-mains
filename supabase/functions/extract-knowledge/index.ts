import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced validation function with multiple parsing strategies
const parseAIResponse = (rawResponse: string) => {
  console.log('🔍 Starting AI response parsing process...');
  console.log('📝 Raw response preview:', rawResponse.substring(0, 300) + '...');
  
  const parseResult = {
    success: false,
    data: null as any,
    method: '',
    issues: [] as string[]
  };

  // Strategy 1: Strict JSON parsing
  try {
    console.log('🎯 Attempting Strategy 1: Strict JSON parsing...');
    const cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith('{') && cleanedResponse.endsWith('}')) {
      parseResult.data = JSON.parse(cleanedResponse);
      parseResult.success = true;
      parseResult.method = 'strict_json';
      console.log('✅ Strategy 1 successful: Strict JSON parsing');
      return parseResult;
    }
  } catch (error) {
    console.log('❌ Strategy 1 failed:', error.message);
    parseResult.issues.push(`Strict JSON failed: ${error.message}`);
  }

  // Strategy 2: Markdown-wrapped JSON extraction
  try {
    console.log('🎯 Attempting Strategy 2: Markdown-wrapped JSON extraction...');
    const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      parseResult.data = JSON.parse(jsonMatch[1].trim());
      parseResult.success = true;
      parseResult.method = 'markdown_json';
      console.log('✅ Strategy 2 successful: Markdown-wrapped JSON');
      return parseResult;
    }
  } catch (error) {
    console.log('❌ Strategy 2 failed:', error.message);
    parseResult.issues.push(`Markdown JSON failed: ${error.message}`);
  }

  // Strategy 3: Regex-based conversational extraction
  try {
    console.log('🎯 Attempting Strategy 3: Conversational extraction...');
    const extractedData = {
      characters: [],
      relationships: [],
      plot_threads: [],
      timeline_events: [],
      world_building: [],
      themes: []
    };

    // Extract characters from conversational text
    const characterMatches = rawResponse.match(/(?:character|protagonist|antagonist)[s]?[:\-\s]*([^.\n]+)/gi);
    if (characterMatches) {
      characterMatches.forEach((match, index) => {
        const name = match.replace(/(?:character|protagonist|antagonist)[s]?[:\-\s]*/i, '').trim();
        if (name && name.length > 2) {
          extractedData.characters.push({
            name: name.substring(0, 50),
            category: 'character',
            description: `Character mentioned in analysis`,
            confidence_score: 0.6,
            details: { extraction_method: 'conversational_regex' }
          });
        }
      });
    }

    // Extract themes from conversational text
    const themeMatches = rawResponse.match(/(?:theme|explores|about)[s]?[:\-\s]*([^.\n]+)/gi);
    if (themeMatches) {
      themeMatches.slice(0, 3).forEach((match) => {
        const theme = match.replace(/(?:theme|explores|about)[s]?[:\-\s]*/i, '').trim();
        if (theme && theme.length > 5) {
          extractedData.themes.push({
            name: theme.substring(0, 50),
            category: 'theme',
            description: `Theme identified in analysis`,
            confidence_score: 0.5
          });
        }
      });
    }

    // Only consider successful if we extracted something meaningful
    const totalExtracted = extractedData.characters.length + extractedData.themes.length;
    if (totalExtracted > 0) {
      parseResult.data = extractedData;
      parseResult.success = true;
      parseResult.method = 'conversational_extraction';
      console.log(`✅ Strategy 3 successful: Extracted ${totalExtracted} elements conversationally`);
      return parseResult;
    }
  } catch (error) {
    console.log('❌ Strategy 3 failed:', error.message);
    parseResult.issues.push(`Conversational extraction failed: ${error.message}`);
  }

  // Strategy 4: Fallback - return minimal structure
  console.log('🎯 Attempting Strategy 4: Fallback minimal structure...');
  parseResult.data = {
    characters: [],
    relationships: [],
    plot_threads: [],
    timeline_events: [],
    world_building: [],
    themes: []
  };
  parseResult.success = true;
  parseResult.method = 'fallback_empty';
  parseResult.issues.push('All parsing strategies failed, returning empty structure');
  console.log('⚠️ Strategy 4: Fallback to empty structure');
  
  return parseResult;
};

// Enhanced validation function for AI response structure
const validateAIResponse = (data: any, parseMethod: string) => {
  const validation = {
    isValid: true,
    issues: [] as string[],
    parsedData: null as any,
    confidence: 0,
    method: parseMethod
  };

  try {
    console.log('🔍 Validating AI response structure using method:', parseMethod);
    
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
      extractionSummary,
      method: parseMethod
    });
    
    // Accept partial success - any valid extraction is better than none
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

    // Enhanced extraction prompt with conversational approach
    const extractionPrompt = `I need you to analyze this creative writing text and help me understand the story elements. Please read through it carefully and tell me what you discover about the characters, relationships, plot, world, and themes.

After you've analyzed the text, please provide your findings in this exact JSON format:

{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description of the character and their role",
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

For confidence scores: Use 0.9+ for very clear elements, 0.7-0.8 for reasonably clear, 0.5-0.6 for somewhat unclear, and below 0.5 for very uncertain.

Text to analyze:
${content}`;

    console.log('🤖 Calling Google AI API for knowledge extraction...');
    console.log('📝 Prompt length:', extractionPrompt.length);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 seconds to leave buffer

    try {
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
            maxOutputTokens: 4096, // Increased for larger responses
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Google AI API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google AI API error:', { status: response.status, error: errorText });
        throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
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
      
      // Parse the AI response with enhanced multiple strategies
      console.log('🔧 Starting enhanced AI response parsing...');
      const parseResult = parseAIResponse(aiResponse);
      
      if (!parseResult.success) {
        console.error('❌ All parsing strategies failed:', parseResult.issues);
        return new Response(JSON.stringify({ 
          error: 'Failed to parse AI response with all available strategies',
          issues: parseResult.issues,
          success: false 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`✅ AI response parsed successfully using: ${parseResult.method}`);
      const extractedData = parseResult.data;

      // Validate the parsed response
      console.log('🔍 Validating extracted data structure...');
      const validation = validateAIResponse(extractedData, parseResult.method);
      
      console.log('✅ AI response validation completed');
      console.log('📊 Extraction summary:', {
        characters: extractedData.characters?.length || 0,
        relationships: extractedData.relationships?.length || 0,
        plotThreads: extractedData.plot_threads?.length || 0,
        timelineEvents: extractedData.timeline_events?.length || 0,
        worldBuilding: extractedData.world_building?.length || 0,
        themes: extractedData.themes?.length || 0,
        method: parseResult.method
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
          issues: validation.issues,
          method: parseResult.method
        },
        processingTime,
        message: `Successfully extracted and stored ${storageResult.storedCount} knowledge items using ${parseResult.method}${storageResult.errors.length > 0 ? ` with ${storageResult.errors.length} errors` : ''}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Google AI API request timed out after 55 seconds');
        throw new Error('Request timed out - content may be too large or API response too slow');
      }
      throw fetchError;
    }

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
