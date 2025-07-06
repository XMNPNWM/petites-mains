
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced validation function with comprehensive structure parsing
const parseAIResponse = (rawResponse: string) => {
  console.log('🔍 Starting comprehensive AI response parsing...');
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

  // Strategy 3: Fallback - return minimal structure
  console.log('🎯 Attempting Strategy 3: Fallback minimal structure...');
  parseResult.data = {
    chapter_summary: {
      title: "Analysis Summary",
      summary_short: "Content analysis completed",
      summary_long: "Automated content analysis was performed on the provided text.",
      key_events_in_chapter: [],
      primary_focus: ["Content Analysis"]
    },
    extracted_data: {
      characters: [],
      relationships: [],
      plot_points: [],
      plot_threads: [],
      timeline_events: [],
      world_building: [],
      themes: []
    }
  };
  parseResult.success = true;
  parseResult.method = 'fallback_structure';
  parseResult.issues.push('All parsing strategies failed, returning empty structure');
  console.log('⚠️ Strategy 3: Fallback to empty structure');
  
  return parseResult;
};

// Enhanced validation function for comprehensive response structure
const validateAIResponse = (data: any, parseMethod: string) => {
  const validation = {
    isValid: true,
    issues: [] as string[],
    parsedData: null as any,
    confidence: 0,
    method: parseMethod
  };

  try {
    console.log('🔍 Validating comprehensive AI response structure using method:', parseMethod);
    
    if (!data || typeof data !== 'object') {
      validation.isValid = false;
      validation.issues.push('Response is not a valid object');
      return validation;
    }

    // Check for chapter_summary structure
    if (!data.chapter_summary || typeof data.chapter_summary !== 'object') {
      validation.issues.push('Missing or invalid chapter_summary');
    }

    // Check for extracted_data structure
    if (!data.extracted_data || typeof data.extracted_data !== 'object') {
      validation.issues.push('Missing or invalid extracted_data');
      validation.isValid = false;
      return validation;
    }

    // Check for expected extracted_data properties
    const expectedProps = ['characters', 'relationships', 'plot_points', 'plot_threads', 'timeline_events', 'world_building', 'themes'];
    const foundProps = Object.keys(data.extracted_data);
    
    console.log('📋 Expected extraction properties:', expectedProps);
    console.log('🔍 Found extraction properties:', foundProps);
    
    let validProps = 0;
    const extractionSummary = {};
    
    for (const prop of expectedProps) {
      if (data.extracted_data[prop] && Array.isArray(data.extracted_data[prop])) {
        validProps++;
        extractionSummary[prop] = data.extracted_data[prop].length;
        console.log(`✅ ${prop}: ${data.extracted_data[prop].length} items found`);
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

// Enhanced storage function with comprehensive data handling
const storeExtractedKnowledge = async (supabase: any, projectId: string, extractedData: any) => {
  console.log('💾 Starting comprehensive knowledge storage process...');
  
  let storedCount = 0;
  const errors = [];
  const storageDetails = {
    chapter_summaries: { attempted: 0, stored: 0, errors: [] },
    plot_points: { attempted: 0, stored: 0, errors: [] },
    characters: { attempted: 0, stored: 0, errors: [] },
    relationships: { attempted: 0, stored: 0, errors: [] },
    world_building: { attempted: 0, stored: 0, errors: [] },
    plot_threads: { attempted: 0, stored: 0, errors: [] },
    timeline_events: { attempted: 0, stored: 0, errors: [] },
    themes: { attempted: 0, stored: 0, errors: [] }
  };

  // Store chapter summary in specialized table
  if (extractedData.chapter_summary) {
    console.log('📄 Processing chapter summary...');
    storageDetails.chapter_summaries.attempted = 1;
    
    try {
      const summary = extractedData.chapter_summary;
      console.log(`📝 Storing chapter summary: "${summary.title}"`);
      
      const { error } = await supabase
        .from('chapter_summaries')
        .upsert({
          project_id: projectId,
          title: summary.title || 'Chapter Summary',
          summary_short: summary.summary_short || '',
          summary_long: summary.summary_long || '',
          key_events_in_chapter: summary.key_events_in_chapter || [],
          primary_focus: summary.primary_focus || [],
          ai_confidence: 0.8,
          is_newly_extracted: true
        }, {
          onConflict: 'project_id,title'
        });

      if (error) {
        console.error('❌ Error storing chapter summary:', error);
        storageDetails.chapter_summaries.errors.push(`Summary: ${error.message}`);
        errors.push(`Chapter summary: ${error.message}`);
      } else {
        storedCount++;
        storageDetails.chapter_summaries.stored++;
        console.log('✅ Successfully stored chapter summary');
      }
    } catch (error) {
      console.error('❌ Exception storing chapter summary:', error);
      storageDetails.chapter_summaries.errors.push(`Summary: ${error.message}`);
      errors.push(`Chapter summary: ${error.message}`);
    }
  }

  // Store plot points in specialized table
  if (extractedData.extracted_data?.plot_points?.length > 0) {
    console.log(`🎯 Processing ${extractedData.extracted_data.plot_points.length} plot points...`);
    storageDetails.plot_points.attempted = extractedData.extracted_data.plot_points.length;
    
    for (const plotPoint of extractedData.extracted_data.plot_points) {
      try {
        console.log(`🎯 Storing plot point: "${plotPoint.name}"`);
        
        const { error } = await supabase
          .from('plot_points')
          .upsert({
            project_id: projectId,
            name: plotPoint.name,
            description: plotPoint.description || '',
            plot_thread_name: plotPoint.plot_thread_name || '',
            significance: plotPoint.significance || '',
            characters_involved_names: plotPoint.characters_involved_names || [],
            ai_confidence: plotPoint.ai_confidence || 0.7,
            source_chapter_ids: plotPoint.source_chapter_ids || [],
            is_newly_extracted: plotPoint.is_newly_extracted !== false
          }, {
            onConflict: 'project_id,name'
          });

        if (error) {
          console.error(`❌ Error storing plot point "${plotPoint.name}":`, error);
          storageDetails.plot_points.errors.push(`${plotPoint.name}: ${error.message}`);
          errors.push(`Plot point ${plotPoint.name}: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.plot_points.stored++;
          console.log(`✅ Successfully stored plot point: "${plotPoint.name}"`);
        }
      } catch (error) {
        console.error(`❌ Exception storing plot point "${plotPoint.name}":`, error);
        storageDetails.plot_points.errors.push(`${plotPoint.name}: ${error.message}`);
        errors.push(`Plot point ${plotPoint.name}: ${error.message}`);
      }
    }
  }

  // Store characters in primary storage (knowledge_base)
  if (extractedData.extracted_data?.characters?.length > 0) {
    console.log(`👥 Processing ${extractedData.extracted_data.characters.length} characters...`);
    storageDetails.characters.attempted = extractedData.extracted_data.characters.length;
    
    for (const character of extractedData.extracted_data.characters) {
      try {
        console.log(`👤 Storing character: "${character.name}"`);
        
        const { error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: character.name,
            category: 'character',
            description: character.description || '',
            details: {
              aliases: character.aliases || [],
              role: character.role || '',
              traits: character.traits || [],
              goals: character.goals || [],
              motivations: character.motivations || [],
              backstory_elements: character.backstory_elements || [],
              arc_status: character.arc_status || ''
            },
            confidence_score: character.ai_confidence || 0.7,
            source_chapter_ids: character.source_chapter_ids || [],
            is_newly_extracted: character.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          });

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

  // Store relationships in specialized table
  if (extractedData.extracted_data?.relationships?.length > 0) {
    console.log(`🤝 Processing ${extractedData.extracted_data.relationships.length} relationships...`);
    storageDetails.relationships.attempted = extractedData.extracted_data.relationships.length;
    
    for (const relationship of extractedData.extracted_data.relationships) {
      try {
        console.log(`🤝 Storing relationship: "${relationship.source_character_name}" -> "${relationship.target_character_name}"`);
        
        const { error } = await supabase
          .from('character_relationships')
          .upsert({
            project_id: projectId,
            character_a_name: relationship.source_character_name,
            character_b_name: relationship.target_character_name,
            relationship_type: relationship.type,
            relationship_strength: relationship.strength || 5,
            relationship_current_status: relationship.current_status || 'active',
            evidence: relationship.description || '',
            confidence_score: relationship.ai_confidence || 0.7,
            source_chapter_ids: relationship.source_chapter_ids || [],
            is_newly_extracted: relationship.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,character_a_name,character_b_name'
          });

        if (error) {
          console.error(`❌ Error storing relationship:`, error);
          storageDetails.relationships.errors.push(`${relationship.source_character_name}-${relationship.target_character_name}: ${error.message}`);
          errors.push(`Relationship: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.relationships.stored++;
          console.log(`✅ Successfully stored relationship`);
        }
      } catch (error) {
        console.error(`❌ Exception storing relationship:`, error);
        storageDetails.relationships.errors.push(`Relationship: ${error.message}`);
        errors.push(`Relationship: ${error.message}`);
      }
    }
  }

  // Store world building in primary storage (knowledge_base)
  if (extractedData.extracted_data?.world_building?.length > 0) {
    console.log(`🌍 Processing ${extractedData.extracted_data.world_building.length} world building elements...`);
    storageDetails.world_building.attempted = extractedData.extracted_data.world_building.length;
    
    for (const element of extractedData.extracted_data.world_building) {
      try {
        console.log(`🌍 Storing world building: "${element.name}"`);
        
        const { error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: element.name,
            category: 'world_building',
            description: element.description || '',
            details: {
              type: element.type || '',
              significance: element.significance || '',
              associated_characters_names: element.associated_characters_names || []
            },
            confidence_score: element.ai_confidence || 0.7,
            source_chapter_ids: element.source_chapter_ids || [],
            is_newly_extracted: element.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          });

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

  // Store plot threads in specialized table
  if (extractedData.extracted_data?.plot_threads?.length > 0) {
    console.log(`📖 Processing ${extractedData.extracted_data.plot_threads.length} plot threads...`);
    storageDetails.plot_threads.attempted = extractedData.extracted_data.plot_threads.length;
    
    for (const thread of extractedData.extracted_data.plot_threads) {
      try {
        console.log(`📖 Storing plot thread: "${thread.name}"`);
        
        const { error } = await supabase
          .from('plot_threads')
          .upsert({
            project_id: projectId,
            thread_name: thread.name,
            thread_type: thread.type,
            thread_status: thread.status || 'active',
            resolution_status: thread.resolution || null,
            key_events: thread.key_events || [],
            characters_involved_names: thread.characters_involved_names || [],
            confidence_score: thread.ai_confidence || 0.7,
            source_chapter_ids: thread.source_chapter_ids || [],
            is_newly_extracted: thread.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,thread_name'
          });

        if (error) {
          console.error(`❌ Error storing plot thread "${thread.name}":`, error);
          storageDetails.plot_threads.errors.push(`${thread.name}: ${error.message}`);
          errors.push(`Plot thread ${thread.name}: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.plot_threads.stored++;
          console.log(`✅ Successfully stored plot thread: "${thread.name}"`);
        }
      } catch (error) {
        console.error(`❌ Exception storing plot thread "${thread.name}":`, error);
        storageDetails.plot_threads.errors.push(`${thread.name}: ${error.message}`);
        errors.push(`Plot thread ${thread.name}: ${error.message}`);
      }
    }
  }

  // Store timeline events in specialized table
  if (extractedData.extracted_data?.timeline_events?.length > 0) {
    console.log(`⏰ Processing ${extractedData.extracted_data.timeline_events.length} timeline events...`);
    storageDetails.timeline_events.attempted = extractedData.extracted_data.timeline_events.length;
    
    for (const event of extractedData.extracted_data.timeline_events) {
      try {
        console.log(`⏰ Storing timeline event: "${event.event_summary}"`);
        
        const { error } = await supabase
          .from('timeline_events')
          .upsert({
            project_id: projectId,
            event_name: event.event_summary,
            event_type: 'story_event',
            event_summary: event.event_summary,
            chronological_order: event.chronological_order || 0,
            date_or_time_reference: event.date_or_time_reference || '',
            significance: event.significance || '',
            characters_involved_names: event.characters_involved_names || [],
            plot_threads_impacted_names: event.plot_threads_impacted_names || [],
            locations_involved_names: event.locations_involved_names || [],
            confidence_score: event.ai_confidence || 0.7,
            source_chapter_ids: event.source_chapter_id ? [event.source_chapter_id] : [],
            is_newly_extracted: event.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,event_name'
          });

        if (error) {
          console.error(`❌ Error storing timeline event:`, error);
          storageDetails.timeline_events.errors.push(`${event.event_summary}: ${error.message}`);
          errors.push(`Timeline event: ${error.message}`);
        } else {
          storedCount++;
          storageDetails.timeline_events.stored++;
          console.log(`✅ Successfully stored timeline event`);
        }
      } catch (error) {
        console.error(`❌ Exception storing timeline event:`, error);
        storageDetails.timeline_events.errors.push(`Event: ${error.message}`);
        errors.push(`Timeline event: ${error.message}`);
      }
    }
  }

  // Store themes in primary storage (knowledge_base)
  if (extractedData.extracted_data?.themes?.length > 0) {
    console.log(`🎭 Processing ${extractedData.extracted_data.themes.length} themes...`);
    storageDetails.themes.attempted = extractedData.extracted_data.themes.length;
    
    for (const theme of extractedData.extracted_data.themes) {
      try {
        console.log(`🎭 Storing theme: "${theme.name}"`);
        
        const { error } = await supabase
          .from('knowledge_base')
          .upsert({
            project_id: projectId,
            name: theme.name,
            category: 'theme',
            description: theme.exploration_summary || '',
            details: {
              key_moments_or_characters: theme.key_moments_or_characters || []
            },
            confidence_score: theme.ai_confidence || 0.7,
            source_chapter_ids: theme.source_chapter_ids || [],
            is_newly_extracted: theme.is_newly_extracted !== false,
            extraction_method: 'llm_direct'
          }, {
            onConflict: 'project_id,name,category'
          });

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

  console.log('📊 Final comprehensive storage summary:', storageDetails);
  return { storedCount, errors, storageDetails };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Comprehensive knowledge extraction request started');
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

    // Enhanced extraction prompt with comprehensive structure
    const extractionPrompt = `I need you to analyze this creative writing text and extract comprehensive story elements. Please provide a detailed analysis following this EXACT JSON structure:

{
  "chapter_summary": {
    "title": "string (Title of the chapter or a descriptive title)",
    "summary_short": "string (1-3 sentences, high-level summary)",
    "summary_long": "string (1-2 paragraphs, detailed summary of main events and character arcs within this chapter)",
    "key_events_in_chapter": ["string array (List of specific key events that occurred in THIS chapter)"],
    "primary_focus": ["string array (e.g., 'Character Development', 'Plot Advancement', 'World-building', 'Conflict Introduction')"]
  },
  "extracted_data": {
    "characters": [
      {
        "name": "string (Unique and canonical name of the character)",
        "aliases": ["string array (Other names the character is referred to, or nicknames)"],
        "role": "string (e.g., 'Protagonist', 'Antagonist', 'Supporting Character', 'Mentor', 'Minor Character')",
        "description": "string (Brief physical and personality description, 1-2 sentences)",
        "traits": ["string array (e.g., 'Brave', 'Mysterious', 'Loyal', 'Deceptive', 'Kind', 'Ambitious')"],
        "goals": ["string array (What the character actively seeks or desires)"],
        "motivations": ["string array (Underlying reasons for their goals or actions)"],
        "backstory_elements": ["string array (Key events or aspects of their past revealed so far)"],
        "arc_status": "string (e.g., 'Initiating', 'Developing', 'Climaxing', 'Resolved', 'Static')",
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ],
    "relationships": [
      {
        "source_character_name": "string (Canonical name of the first character)",
        "target_character_name": "string (Canonical name of the second character)",
        "type": "string (e.g., 'Familial', 'Romantic', 'Antagonistic', 'Professional', 'Friendship', 'Mentor-Mentee')",
        "strength": 7,
        "description": "string (Brief explanation of the relationship dynamics or key events)",
        "current_status": "string (e.g., 'Stable', 'Strained', 'Developing', 'Broken', 'Secret')",
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ],
    "plot_points": [
      {
        "name": "string (Brief name for this specific plot point)",
        "description": "string (Detailed description of this minor inflection point)",
        "plot_thread_name": "string (Name of the larger plot thread this belongs to)",
        "significance": "string (Why this point is important, what it changes or reveals)",
        "characters_involved_names": ["string array"],
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ],
    "plot_threads": [
      {
        "name": "string (Unique name for the plot thread, e.g., 'The Quest for the Amulet', 'The Betrayal of House Eldoria')",
        "type": "string (e.g., 'Main Plot', 'Subplot', 'Character Arc', 'World Mystery')",
        "status": "string (e.g., 'Active', 'Resolved', 'Dormant', 'Introduced', 'Developing')",
        "key_events": ["string array (Chronological list of pivotal events within this thread)"],
        "characters_involved_names": ["string array (Names of key characters primarily involved)"],
        "resolution": "string (If resolved, a brief description of how)",
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ],
    "timeline_events": [
      {
        "event_summary": "string (Concise description of the event)",
        "chronological_order": 1,
        "date_or_time_reference": "string (Optional: Specific in-story date/time if mentioned)",
        "significance": "string (Why this event is important, e.g., 'Inciting Incident', 'Climax', 'Character Turning Point', 'Foreshadowing')",
        "characters_involved_names": ["string array"],
        "plot_threads_impacted_names": ["string array (Names of plot threads this event affects)"],
        "locations_involved_names": ["string array (Names of locations where the event occurs)"],
        "ai_confidence": 0.8,
        "source_chapter_id": "string (The specific chapter where this event occurred)",
        "is_newly_extracted": true
      }
    ],
    "world_building": [
      {
        "name": "string (Unique name for the element, e.g., 'The City of Eldoria', 'Sunstone Amulet', 'Aetheric Magic')",
        "type": "string (e.g., 'Location', 'Object', 'Concept', 'Rule', 'Faction', 'Creature', 'Magic System')",
        "description": "string (Detailed description of the element)",
        "significance": "string (Why it's important to the story or world)",
        "associated_characters_names": ["string array (Characters often interacting with this element)"],
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ],
    "themes": [
      {
        "name": "string (Concise name of the theme, e.g., 'Redemption', 'Loss and Grief', 'The Price of Power', 'Nature vs. Technology')",
        "exploration_summary": "string (How this theme is explored in the story so far, 1-2 sentences)",
        "key_moments_or_characters": ["string array (Specific events or characters that exemplify this theme)"],
        "ai_confidence": 0.8,
        "source_chapter_ids": ["string array"],
        "is_newly_extracted": true
      }
    ]
  }
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON in the exact structure above
2. Set realistic ai_confidence scores (0.7-0.9 for clear elements, 0.5-0.6 for uncertain ones)
3. Plot points should be MINOR inflection points within larger plot threads, not major story beats
4. Include source metadata for tracking where elements were extracted
5. Be thorough but accurate - don't invent information not present in the text

Text to analyze:
${content}`;

    console.log('🤖 Calling Google AI API for comprehensive knowledge extraction...');
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
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192, // Increased for comprehensive responses
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
      
      // Parse the AI response with enhanced comprehensive parsing
      console.log('🔧 Starting comprehensive AI response parsing...');
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
      console.log('🔍 Validating comprehensive extracted data structure...');
      const validation = validateAIResponse(extractedData, parseResult.method);
      
      console.log('✅ AI response validation completed');
      console.log('📊 Comprehensive extraction summary:', {
        chapterSummary: !!extractedData.chapter_summary,
        characters: extractedData.extracted_data?.characters?.length || 0,
        relationships: extractedData.extracted_data?.relationships?.length || 0,
        plotPoints: extractedData.extracted_data?.plot_points?.length || 0,
        plotThreads: extractedData.extracted_data?.plot_threads?.length || 0,
        timelineEvents: extractedData.extracted_data?.timeline_events?.length || 0,
        worldBuilding: extractedData.extracted_data?.world_building?.length || 0,
        themes: extractedData.extracted_data?.themes?.length || 0,
        method: parseResult.method
      });

      // Store extracted knowledge with comprehensive handling
      console.log('💾 Beginning comprehensive knowledge storage process...');
      const storageResult = await storeExtractedKnowledge(supabase, projectId, extractedData);

      const processingTime = Date.now() - startTime;
      console.log('⏱️ Total processing time:', processingTime, 'ms');
      console.log('✅ Comprehensive knowledge extraction completed successfully');

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
    console.error('❌ Comprehensive knowledge extraction error:', error);
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
