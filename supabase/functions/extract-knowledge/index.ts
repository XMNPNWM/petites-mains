import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sequential extraction handler for single category with fresh context
function handleSequentialExtractionResult(content: string, projectId: string, targetCategory: string, freshContext: any, ai: any) {
  console.log(`🔄 Sequential extraction for category: ${targetCategory}`);
  console.log('🔄 Fresh context available:', Object.keys(freshContext || {}));

  return new Promise(async (resolve) => {
    try {
      let extractionResult = {};

      switch (targetCategory) {
        case 'characters':
          extractionResult = await extractCharactersSequential(content, ai);
          console.log('🎭 Characters extracted in sequential mode:', extractionResult);
          break;
        case 'character_relationships':
          extractionResult = await extractRelationshipsSequential(content, freshContext, ai);
          break;
        case 'timeline_events':
          extractionResult = await extractTimelineSequential(content, freshContext, ai);
          break;
        case 'plot_threads':
          extractionResult = await extractPlotThreadsSequential(content, freshContext, ai);
          break;
        case 'world_building':
          extractionResult = await extractWorldBuildingSequential(content, freshContext, ai);
          break;
        case 'themes':
          extractionResult = await extractThemesSequential(content, freshContext, ai);
          break;
        default:
          console.log(`⚠️ Unsupported category for sequential extraction: ${targetCategory}`);
          extractionResult = {};
      }

      const itemsCount = Object.keys(extractionResult).reduce((total, key) => {
        return total + (Array.isArray(extractionResult[key]) ? extractionResult[key].length : 0);
      }, 0);

      console.log(`✅ Sequential extraction complete for ${targetCategory}: ${itemsCount} items`);
      
      resolve(extractionResult);
    } catch (error) {
      console.error(`❌ Sequential extraction failed for ${targetCategory}:`, error);
      resolve({});
    }
  });
}

// Extract characters in sequential mode
async function extractCharactersSequential(content: string, ai: any) {
  console.log('🎭 Sequential: Extracting characters...');
  
  const charactersPrompt = `Analyze the following text and extract ONLY characters in JSON format. Focus on clearly identifiable people, beings, or entities that appear in the narrative.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "characters": [{"name": "", "description": "", "traits": [], "role": "", "confidence_score": 0.8}]
}

Extract only clearly evident characters. Assign confidence scores based on how explicit their presence and description is in the text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: charactersPrompt
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(text);
    console.log(`✅ Sequential characters extracted: ${data.characters?.length || 0}`);
    return { characters: data.characters || [] };
  } catch (error) {
    console.error('❌ Failed to parse sequential characters:', error);
    return { characters: [] };
  }
}

// Extract relationships in sequential mode with fresh character context
async function extractRelationshipsSequential(content: string, freshContext: any, ai: any) {
  console.log('🤝 Sequential: Extracting relationships with fresh character context...');
  
  const characters = freshContext?.characters || [];
  if (characters.length === 0) {
    console.log('⚠️ No fresh characters available for relationship extraction');
    return { relationships: [] };
  }

  const characterNames = characters.map(c => c.name).join(', ');
  console.log('👥 Using fresh characters for relationships:', characterNames);

  const relationshipsPrompt = `Analyser le texte suivant et extraire UNIQUEMENT les relations entre personnages au format JSON strict.

Personnages disponibles (FRESH DATA): ${characterNames}

Texte à analyser: "${content}"

Retourner UNIQUEMENT un objet JSON valide (sans texte supplémentaire, sans commentaires):
{
  "relationships": [
    {
      "character_a_name": "nom exact",
      "character_b_name": "nom exact", 
      "relationship_type": "type",
      "relationship_strength": 5,
      "confidence_score": 0.8
    }
  ]
}

Types valides: famille, ami, ennemi, allié, mentor, rival, amoureux, collègue.
Utiliser UNIQUEMENT les noms exacts de la liste des personnages disponibles.
Si aucune relation trouvée, retourner: {"relationships": []}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: relationshipsPrompt
  });

  try {
    let text = response.text;
    console.log('🤝 Sequential relationships raw response:', text);
    
    // Clean up JSON
    text = text
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1')
      .trim();

    const data = JSON.parse(text);
    
    if (data && Array.isArray(data.relationships)) {
      const validRelationships = data.relationships.filter(rel => 
        rel.character_a_name && 
        rel.character_b_name && 
        rel.relationship_type &&
        rel.character_a_name !== rel.character_b_name
      );
      
      console.log(`✅ Sequential relationships extracted: ${validRelationships.length}`);
      validRelationships.forEach((rel, index) => {
        console.log(`   ${index + 1}. ${rel.character_a_name} -> ${rel.character_b_name} (${rel.relationship_type})`);
      });
      
      return { relationships: validRelationships };
    }
    
    return { relationships: [] };
    
  } catch (error) {
    console.error('❌ Failed to parse sequential relationships:', error);
    return { relationships: [] };
  }
}

// Extract timeline events in sequential mode
async function extractTimelineSequential(content: string, freshContext: any, ai: any) {
  console.log('⏰ Sequential: Extracting timeline events...');
  
  const characters = freshContext?.characters || [];
  const characterContext = characters.length > 0 
    ? `Personnages connus: ${characters.map(c => c.name).join(', ')}`
    : '';

  const timelinePrompt = `Analyser le texte suivant et extraire UNIQUEMENT les événements de la chronologie au format JSON.

${characterContext}

Texte à analyser: "${content}"

Retourner un objet JSON avec cette structure exacte:
{
  "timelineEvents": [{"event_name": "", "event_type": "", "event_summary": "", "chronological_order": 0, "characters_involved_names": [], "confidence_score": 0.8}]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: timelinePrompt
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(text);
    console.log(`✅ Sequential timeline events extracted: ${data.timelineEvents?.length || 0}`);
    return { timelineEvents: data.timelineEvents || [] };
  } catch (error) {
    console.error('❌ Failed to parse sequential timeline events:', error);
    return { timelineEvents: [] };
  }
}

// Extract plot threads in sequential mode
async function extractPlotThreadsSequential(content: string, freshContext: any, ai: any) {
  console.log('📖 Sequential: Extracting plot threads...');
  
  const plotPrompt = `Analyze the following text and extract plot threads in JSON format.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "plotThreads": [{"thread_name": "", "thread_type": "", "key_events": [], "status": "active", "confidence_score": 0.8}]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: plotPrompt
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(text);
    console.log(`✅ Sequential plot threads extracted: ${data.plotThreads?.length || 0}`);
    return { plotThreads: data.plotThreads || [] };
  } catch (error) {
    console.error('❌ Failed to parse sequential plot threads:', error);
    return { plotThreads: [] };
  }
}

// Extract world building in sequential mode
async function extractWorldBuildingSequential(content: string, freshContext: any, ai: any) {
  console.log('🌍 Sequential: Extracting world building elements...');
  
  const worldPrompt = `Analyze the following text and extract world building elements in JSON format.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "worldBuilding": [{"name": "", "description": "", "category": "", "confidence_score": 0.8}]
}

Extract locations, objects, cultural elements, technologies, and world-specific concepts.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: worldPrompt
  });

  try {
    let text = response.text;
    console.log('🌍 Sequential world building raw response:', text);
    
    // Apply robust JSON parsing
    text = text
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1')
      .trim();

    const data = JSON.parse(text);
    console.log(`✅ Sequential world building extracted: ${data.worldBuilding?.length || 0}`);
    return { worldBuilding: data.worldBuilding || [] };
  } catch (error) {
    console.error('❌ Failed to parse sequential world building:', error);
    return { worldBuilding: [] };
  }
}

// Extract themes in sequential mode
async function extractThemesSequential(content: string, freshContext: any, ai: any) {
  console.log('💭 Sequential: Extracting themes...');
  
  const themesPrompt = `Analyze the following text and extract themes in JSON format.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "themes": [{"name": "", "description": "", "significance": "", "confidence_score": 0.8}]
}

Extract thematic content, moral messages, underlying concepts, and symbolic meanings.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: themesPrompt
  });

  try {
    let text = response.text;
    console.log('💭 Sequential themes raw response:', text);
    
    // Apply robust JSON parsing
    text = text
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1')
      .trim();

    const data = JSON.parse(text);
    console.log(`✅ Sequential themes extracted: ${data.themes?.length || 0}`);
    return { themes: data.themes || [] };
  } catch (error) {
    console.error('❌ Failed to parse sequential themes:', error);
    return { themes: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract JWT token and get user
    const jwt = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authorization token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey: googleAIKey });

    const { projectId, chapterId, content, mode, targetCategories, categoriesToStore, targetCategory, freshContext, options = {} } = await req.json();

    // Check user credits before processing (2 credits for analysis)
    const { data: creditCheck, error: creditError } = await supabase.rpc('deduct_ai_credits', {
      user_uuid: user.id,
      credits_to_deduct: 2
    });

    if (creditError || !creditCheck?.[0]?.success) {
      const errorMessage = creditCheck?.[0]?.error_message || 'Failed to check credits';
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        code: 'INSUFFICIENT_CREDITS'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!projectId || !chapterId || !content) {
      throw new Error('Missing required parameters: projectId, chapterId, or content');
    }

    // Handle different extraction modes
    const isGapFillMode = mode === 'gap_fill_only';
    const isEnhancedGapFillMode = mode === 'enhanced_gap_fill';
    const isSequentialMode = mode === 'sequential_gap_fill';
    const forceReExtraction = options.forceReExtraction || false;
    const contentTypesToExtract = (isGapFillMode || isEnhancedGapFillMode) ? targetCategories : (options.contentTypesToExtract || []);
    
    console.log(`🚀 Starting knowledge extraction for chapter: ${chapterId}`);
    console.log('📋 Extraction mode:', mode || 'standard');
    console.log('🎯 TARGET CATEGORIES RECEIVED:', JSON.stringify(targetCategories));
    console.log('🎯 TARGET CATEGORY (sequential):', targetCategory);
    console.log('💾 CATEGORIES TO STORE:', JSON.stringify(categoriesToStore));
    console.log('🔄 FRESH CONTEXT:', freshContext ? Object.keys(freshContext) : 'none');
    console.log('📋 Options:', { 
      forceReExtraction, 
      contentTypesToExtract: contentTypesToExtract.length > 0 ? contentTypesToExtract : 'all',
      useEmbeddingsBasedProcessing: options.useEmbeddingsBasedProcessing 
    });

    // For gap-fill modes, always process and skip similarity checks
    const useEmbeddingsBasedProcessing = (isGapFillMode || isEnhancedGapFillMode || isSequentialMode) ? false : (options.useEmbeddingsBasedProcessing !== false);

    let shouldSkipExtraction = false;
    let processingReason = isSequentialMode ? 'Sequential gap-fill processing with fresh context' :
                          isEnhancedGapFillMode ? 'Enhanced gap-fill with dependency context' : 
                          isGapFillMode ? 'Gap-fill extraction for empty categories' : 
                          'Processing new content';

    // Phase 1: Embeddings-based similarity check if enabled (unless force re-extraction or gap-fill mode)
    if (useEmbeddingsBasedProcessing && !forceReExtraction && !isGapFillMode && !isEnhancedGapFillMode && !isSequentialMode) {
      console.log('🔍 Checking content similarity using embeddings...');
      
      // Generate embedding for content using correct model
      const embeddingResponse = await ai.models.embedContent({
        model: "text-embedding-004",
        content: {
          parts: [{ text: content }]
        }
      });

      if (embeddingResponse.embedding?.values) {
        const queryEmbedding = embeddingResponse.embedding.values;
        
        // Convert embedding to string format for PostgreSQL
        const embeddingString = `[${queryEmbedding.join(',')}]`;
        
        // Check similarity with existing content
        const { data: similarChunks, error: similarityError } = await supabase.rpc('match_semantic_chunks', {
          query_embedding: embeddingString,
          match_threshold: 0.8,
          match_count: 5,
          filter_project_id: projectId
        });

        if (!similarityError && similarChunks && similarChunks.length > 0) {
          const highestSimilarity = similarChunks[0].similarity;
          
          if (highestSimilarity >= 0.9) {
            shouldSkipExtraction = true;
            processingReason = `Content too similar to existing content (${Math.round(highestSimilarity * 100)}% similarity)`;
            console.log(`⏭️ Skipping extraction: ${processingReason}`);
          } else if (highestSimilarity >= 0.8) {
            processingReason = `Similar content found (${Math.round(highestSimilarity * 100)}% similarity) - applying enhanced deduplication`;
            console.log(`🔄 ${processingReason}`);
          }
        }
      }
    } else if (forceReExtraction) {
      console.log('🔥 Force re-extraction mode: bypassing similarity checks');
      processingReason = 'Force re-extraction requested';
    }

    let extractionResults = {
      characters: [],
      relationships: [],
      plotThreads: [],
      timelineEvents: [],
      plotPoints: [],
      chapterSummaries: [],
      worldBuilding: [],
      themes: []
    };

    let isSequentialComplete = false;

    // Phase 2: Perform multi-pass extraction if not skipped
    if (!shouldSkipExtraction) {
      console.log('📊 Proceeding with knowledge extraction...');
      
      // Handle different extraction modes
      if (isSequentialMode) {
        console.log(`🔄 Sequential mode: extracting single category ${targetCategory} with fresh context`);
        
        // Execute sequential extraction and populate results directly
        const sequentialResult = await handleSequentialExtractionResult(content, projectId, targetCategory, freshContext, ai);
        console.log('🔄 Sequential extraction result:', sequentialResult);
        
        // Merge sequential results into extractionResults
        extractionResults = { ...extractionResults, ...sequentialResult };
        console.log('✅ Sequential results merged into extractionResults:', {
          characters: extractionResults.characters?.length || 0,
          relationships: extractionResults.relationships?.length || 0
        });
        
        // **CRITICAL FIX: Set flag to skip standard extraction but allow storage flow**
        console.log('🚀 Sequential mode complete - skipping standard extraction passes');
        console.log('🎯 Final sequential extraction results:', {
          characters: extractionResults.characters?.length || 0,
          relationships: extractionResults.relationships?.length || 0,
          timelineEvents: extractionResults.timelineEvents?.length || 0,
          plotThreads: extractionResults.plotThreads?.length || 0,
          worldBuilding: extractionResults.worldBuilding?.length || 0,
          themes: extractionResults.themes?.length || 0
        });
        
        // Set flag to skip standard extraction passes but continue to storage
        isSequentialComplete = true;
        console.log('🔄 Sequential extraction complete, proceeding to storage phase...');
      } else if (isEnhancedGapFillMode) {
        console.log(`🎯 Enhanced gap-fill mode: analyzing ${targetCategories.join(', ')}, storing ${categoriesToStore?.join(', ') || 'all'}`);
      } else if (isGapFillMode) {
        console.log(`🎯 Gap-fill mode: extracting only ${targetCategories.join(', ')}`);
      } else {
        console.log('📊 Standard mode: full multi-pass extraction');
      }
      
      // Pass 1: Extract Characters (skip in sequential complete or gap-fill mode unless needed)
      if (!isSequentialComplete && (!isGapFillMode || targetCategories.includes('characters') || isEnhancedGapFillMode)) {
        console.log('🎭 Pass 1: Extracting characters...');
      const charactersPrompt = `Analyze the following text and extract ONLY characters in JSON format. Focus on clearly identifiable people, beings, or entities that appear in the narrative.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "characters": [{"name": "", "description": "", "traits": [], "role": "", "confidence_score": 0.8}]
}

Extract only clearly evident characters. Assign confidence scores based on how explicit their presence and description is in the text.`;

      console.log('📝 Characters prompt length:', charactersPrompt.length);
      
      const charactersResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: charactersPrompt
      });

      // **ENHANCED: Apply robust JSON parsing with multiple fallback strategies (same as relationships)**
      try {
        let charactersText = charactersResponse.text;
        console.log('🎭 Full raw characters AI response:', charactersText);
        
        // Strategy 1: Clean up common JSON formatting issues
        charactersText = charactersText
          .replace(/```json\n?|\n?```/g, '') // Remove code blocks
          .replace(/```\n?|\n?```/g, '') // Remove any remaining code blocks
          .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1') // Extract JSON from surrounding text
          .trim();
        
        console.log('🧹 Cleaned characters text:', charactersText);
        
        // Strategy 2: Try to parse the cleaned JSON
        let charactersData;
        try {
          charactersData = JSON.parse(charactersText);
        } catch (parseError) {
          console.log('⚠️ First character parse failed, trying fallback strategies...');
          
          // Strategy 3: Try to extract JSON object from text
          const jsonMatch = charactersText.match(/{.*}/s);
          if (jsonMatch) {
            console.log('🔍 Found character JSON match:', jsonMatch[0]);
            charactersData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found in character response');
          }
        }
        
        // **ENHANCED: Validate the structure before storing**
        if (charactersData && Array.isArray(charactersData.characters)) {
          // Validate each character has required fields
          const validCharacters = charactersData.characters.filter(char => 
            char.name && char.name.trim().length > 0 // At minimum, must have a name
          );
          
          extractionResults.characters = validCharacters;
          console.log(`✅ Extracted ${extractionResults.characters.length} valid characters:`, extractionResults.characters.map(c => c.name));
          
          // Log each character for debugging
          extractionResults.characters.forEach((char, index) => {
            console.log(`   ${index + 1}. ${char.name} (${char.role || 'Unknown role'})`);
          });
        } else {
          console.log('⚠️ Invalid characters structure, using empty array');
          extractionResults.characters = [];
        }
        
      } catch (error) {
        console.error('❌ All character parsing strategies failed:', error);
        console.error('Raw response that failed all strategies:', charactersResponse.text);
        extractionResults.characters = [];
      }
    }

      // Pass 2: Extract Relationships - Enhanced for gap-fill mode (skip if sequential complete)
      if (!isSequentialComplete && (!isGapFillMode || targetCategories.includes('character_relationships') || isEnhancedGapFillMode)) {
        console.log('🤝 RELATIONSHIP EXTRACTION BLOCK EXECUTING');
        
        let characterNames = '';
        
        // **CRITICAL FIX: Use existing characters from database for gap-fill modes**
        if (isGapFillMode || isEnhancedGapFillMode) {
          console.log('🔍 Gap-fill mode: Fetching existing characters from database...');
          
          const { data: existingCharacters, error: charactersError } = await supabase
            .from('knowledge_base')
            .select('name')
            .eq('project_id', projectId)
            .eq('category', 'character');
          
          console.log('🔍 CHARACTER DATABASE QUERY RESULT:', {
            error: charactersError,
            characterCount: existingCharacters?.length || 0,
            characters: existingCharacters?.map(c => c.name) || []
          });
          
          if (!charactersError && existingCharacters && existingCharacters.length > 0) {
            characterNames = existingCharacters.map(c => c.name).join(', ');
            console.log('👥 Using existing characters for relationships:', characterNames);
          } else {
            console.log('⚠️ No existing characters found in database for relationship extraction');
            characterNames = '';
          }
        } else {
          // Standard mode: use characters extracted in this session
          if (extractionResults.characters.length > 0) {
            characterNames = extractionResults.characters.map(c => c.name).join(', ');
            console.log('👥 Using session-extracted characters:', characterNames);
          }
        }
        
        if (characterNames) {
          const relationshipsPrompt = `Analyser le texte suivant et extraire UNIQUEMENT les relations entre personnages au format JSON strict.

Personnages disponibles: ${characterNames}

Texte à analyser: "${content}"

Retourner UNIQUEMENT un objet JSON valide (sans texte supplémentaire, sans commentaires):
{
  "relationships": [
    {
      "character_a_name": "nom exact",
      "character_b_name": "nom exact", 
      "relationship_type": "type",
      "relationship_strength": 5,
      "confidence_score": 0.8
    }
  ]
}

Types valides: famille, ami, ennemi, allié, mentor, rival, amoureux, collègue.
Utiliser UNIQUEMENT les noms exacts de la liste des personnages.
Si aucune relation trouvée, retourner: {"relationships": []}`;

          console.log('📝 Relationships prompt length:', relationshipsPrompt.length);

          const relationshipsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: relationshipsPrompt
          });

          // **ENHANCED: Improved JSON parsing with multiple fallback strategies**
          try {
            let relationshipsText = relationshipsResponse.text;
            console.log('🤝 Full raw relationships AI response:', relationshipsText);
            
            // Strategy 1: Clean up common JSON formatting issues
            relationshipsText = relationshipsText
              .replace(/```json\n?|\n?```/g, '') // Remove code blocks
              .replace(/```\n?|\n?```/g, '') // Remove any remaining code blocks
              .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1') // Extract JSON from surrounding text
              .trim();
            
            console.log('🧹 Cleaned relationships text:', relationshipsText);
            
            // Strategy 2: Try to parse the cleaned JSON
            let relationshipsData;
            try {
              relationshipsData = JSON.parse(relationshipsText);
            } catch (parseError) {
              console.log('⚠️ First parse failed, trying fallback strategies...');
              
              // Strategy 3: Try to extract JSON object from text
              const jsonMatch = relationshipsText.match(/{.*}/s);
              if (jsonMatch) {
                console.log('🔍 Found JSON match:', jsonMatch[0]);
                relationshipsData = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No JSON object found in response');
              }
            }
            
            // **ENHANCED: Validate the structure before storing**
            if (relationshipsData && Array.isArray(relationshipsData.relationships)) {
              // Validate each relationship has required fields
              const validRelationships = relationshipsData.relationships.filter(rel => 
                rel.character_a_name && 
                rel.character_b_name && 
                rel.relationship_type &&
                rel.character_a_name !== rel.character_b_name // Avoid self-relationships
              );
              
              extractionResults.relationships = validRelationships;
              console.log(`✅ Extracted ${extractionResults.relationships.length} valid relationships:`, extractionResults.relationships);
              
              // Log each relationship for debugging
              extractionResults.relationships.forEach((rel, index) => {
                console.log(`   ${index + 1}. ${rel.character_a_name} -> ${rel.character_b_name} (${rel.relationship_type})`);
              });
            } else {
              console.log('⚠️ Invalid relationships structure, using empty array');
              extractionResults.relationships = [];
            }
            
          } catch (error) {
            console.error('❌ All relationship parsing strategies failed:', error);
            console.error('Raw response that failed all strategies:', relationshipsResponse.text);
            extractionResults.relationships = [];
          }
        } else {
          console.log('⚠️ Skipping relationship extraction: no characters available');
          extractionResults.relationships = [];
        }
      }

      // Pass 3: Extract Timeline Events - Enhanced for gap-fill mode (skip if sequential complete)
      if (!isSequentialComplete && (!isGapFillMode || targetCategories.includes('timeline_events') || isEnhancedGapFillMode)) {
        console.log('⏰ Pass 3: Extracting timeline events...');
        
        let characterContext = '';
        
        // **ENHANCED: Get character context for gap-fill modes**
        if (isGapFillMode || isEnhancedGapFillMode) {
          console.log('🔍 Gap-fill mode: Using existing characters for timeline context...');
          
          const { data: existingCharacters, error: charactersError } = await supabase
            .from('knowledge_base')
            .select('name')
            .eq('project_id', projectId)
            .eq('category', 'character');
          
          if (!charactersError && existingCharacters && existingCharacters.length > 0) {
            characterContext = `Personnages connus: ${existingCharacters.map(c => c.name).join(', ')}`;
            console.log('👥 Using existing characters for timeline context:', characterContext);
          } else {
            console.log('⚠️ No existing characters found for timeline context');
            characterContext = '';
          }
        } else {
          // Standard mode: use session-extracted characters
          characterContext = extractionResults.characters.length > 0 
            ? `Personnages connus: ${extractionResults.characters.map(c => c.name).join(', ')}`
            : '';
        }
        
        console.log('📋 Character context for timeline:', characterContext || 'Aucun personnage trouvé');
        
        const timelinePrompt = `Analyser le texte suivant et extraire UNIQUEMENT les événements de la chronologie au format JSON. Se concentrer sur les actions spécifiques, les scènes ou les événements qui se déroulent en séquence.

${characterContext}

Texte à analyser: "${content}"

Retourner un objet JSON avec cette structure exacte:
{
  "timelineEvents": [{"event_name": "", "event_type": "", "event_summary": "", "chronological_order": 0, "characters_involved_names": [], "confidence_score": 0.8}]
}

Rechercher:
- Actions spécifiques qui se produisent
- Changements de scène ou transitions
- Marqueurs temporels (puis, plus tard, pendant ce temps, etc.)
- Séquences de cause à effet
- Actions et réactions des personnages

Si des personnages sont impliqués, utiliser les noms exacts de la liste des personnages connus.`;

        console.log('📝 Timeline prompt length:', timelinePrompt.length);

        const timelineResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: timelinePrompt
        });

        try {
          const timelineText = timelineResponse.text.replace(/```json\n?|\n?```/g, '').trim();
          console.log('⏰ Raw timeline AI response:', timelineText.substring(0, 500) + '...');
          const timelineData = JSON.parse(timelineText);
          extractionResults.timelineEvents = timelineData.timelineEvents || [];
          console.log(`✅ Extracted ${extractionResults.timelineEvents.length} timeline events:`, extractionResults.timelineEvents);
        } catch (error) {
          console.error('❌ Failed to parse timeline events:', error);
          console.error('Raw response that failed:', timelineResponse.text);
          
          // Fallback: ensure we have empty array
          extractionResults.timelineEvents = [];
        }
      }

      // Pass 4: Extract Plot Elements (skip if sequential complete or gap-fill mode unless needed)
      if (!isSequentialComplete && (!isGapFillMode || targetCategories.some(cat => ['plot_threads', 'plot_points', 'chapter_summaries'].includes(cat)) || isEnhancedGapFillMode)) {
        console.log('📖 Pass 4: Extracting plot elements...');
      const plotPrompt = `Analyze the following text and extract plot threads, plot points, and chapter summaries in JSON format.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "plotThreads": [{"thread_name": "", "thread_type": "", "key_events": [], "status": "active", "confidence_score": 0.8}],
  "plotPoints": [{"name": "", "description": "", "significance": "", "confidence_score": 0.8}],
  "chapterSummaries": [{"title": "", "summary_short": "", "summary_long": "", "key_events": [], "confidence_score": 0.8}]
}

Extract story elements, narrative threads, and chapter-level information.`;

      const plotResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: plotPrompt
      });

      try {
        const plotText = plotResponse.text.replace(/```json\n?|\n?```/g, '').trim();
        const plotData = JSON.parse(plotText);
        extractionResults.plotThreads = plotData.plotThreads || [];
        extractionResults.plotPoints = plotData.plotPoints || [];
        extractionResults.chapterSummaries = plotData.chapterSummaries || [];
        console.log(`✅ Extracted ${extractionResults.plotThreads.length} plot threads, ${extractionResults.plotPoints.length} plot points, ${extractionResults.chapterSummaries.length} summaries`);
      } catch (error) {
        console.error('Failed to parse plot elements:', error);
      }
    }

      // Pass 5: Extract World Building and Themes (skip if sequential complete or gap-fill mode unless needed)
      if (!isSequentialComplete && (!isGapFillMode || targetCategories.some(cat => ['world_building', 'themes'].includes(cat)) || isEnhancedGapFillMode)) {
        console.log('🌍 Pass 5: Extracting world building and themes...');
      const worldPrompt = `Analyze the following text and extract world building elements and themes in JSON format.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "worldBuilding": [{"name": "", "description": "", "category": "", "confidence_score": 0.8}],
  "themes": [{"name": "", "description": "", "significance": "", "confidence_score": 0.8}]
}

Extract locations, objects, cultural elements, and thematic content.`;

      const worldResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: worldPrompt
      });

      // **ENHANCED: Apply robust JSON parsing with multiple fallback strategies**
      try {
        let worldText = worldResponse.text;
        console.log('🌍 Full raw world building AI response:', worldText);
        
        // Strategy 1: Clean up common JSON formatting issues
        worldText = worldText
          .replace(/```json\n?|\n?```/g, '') // Remove code blocks
          .replace(/```\n?|\n?```/g, '') // Remove any remaining code blocks
          .replace(/^\s*[\w\s]*?({.*})\s*$/s, '$1') // Extract JSON from surrounding text
          .trim();
        
        console.log('🧹 Cleaned world building text:', worldText);
        
        // Strategy 2: Try to parse the cleaned JSON
        let worldData;
        try {
          worldData = JSON.parse(worldText);
        } catch (parseError) {
          console.log('⚠️ First world building parse failed, trying fallback strategies...');
          
          // Strategy 3: Try to extract JSON object from text
          const jsonMatch = worldText.match(/{.*}/s);
          if (jsonMatch) {
            console.log('🔍 Found world building JSON match:', jsonMatch[0]);
            worldData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found in world building response');
          }
        }
        
        // **ENHANCED: Validate the structure before storing**
        if (worldData) {
          // Validate world building elements
          if (Array.isArray(worldData.worldBuilding)) {
            const validWorldBuilding = worldData.worldBuilding.filter(wb => 
              wb.name && wb.name.trim().length > 0 // At minimum, must have a name
            );
            extractionResults.worldBuilding = validWorldBuilding;
            console.log(`✅ Extracted ${extractionResults.worldBuilding.length} valid world building elements`);
          } else {
            console.log('⚠️ Invalid world building structure, using empty array');
            extractionResults.worldBuilding = [];
          }
          
          // Validate themes
          if (Array.isArray(worldData.themes)) {
            const validThemes = worldData.themes.filter(theme => 
              theme.name && theme.name.trim().length > 0 // At minimum, must have a name
            );
            extractionResults.themes = validThemes;
            console.log(`✅ Extracted ${extractionResults.themes.length} valid themes`);
          } else {
            console.log('⚠️ Invalid themes structure, using empty array');
            extractionResults.themes = [];
          }
        } else {
          console.log('⚠️ Invalid world data structure, using empty arrays');
          extractionResults.worldBuilding = [];
          extractionResults.themes = [];
        }
        
      } catch (error) {
        console.error('❌ All world building and themes parsing strategies failed:', error);
        console.error('Raw response that failed all strategies:', worldResponse.text);
        extractionResults.worldBuilding = [];
        extractionResults.themes = [];
      }
    }

      console.log('🎯 Multi-pass extraction completed');
    }

    // Phase 3: Filter extracted data by content types if specified (for force re-extraction)
    if (contentTypesToExtract.length > 0) {
      console.log(`🎯 Filtering extraction for content types: ${contentTypesToExtract.join(', ')}`);
      
      if (!contentTypesToExtract.includes('characters')) {
        extractionResults.characters = [];
      }
      if (!contentTypesToExtract.includes('relationships')) {
        extractionResults.relationships = [];
      }
      if (!contentTypesToExtract.includes('timeline_events')) {
        extractionResults.timelineEvents = [];
      }
      if (!contentTypesToExtract.includes('plot_points')) {
        extractionResults.plotPoints = [];
      }
      if (!contentTypesToExtract.includes('plot_threads')) {
        extractionResults.plotThreads = [];
      }
      if (!contentTypesToExtract.includes('world_building')) {
        extractionResults.worldBuilding = [];
      }
      if (!contentTypesToExtract.includes('chapter_summaries')) {
        extractionResults.chapterSummaries = [];
      }
      if (!contentTypesToExtract.includes('themes')) {
        extractionResults.themes = [];
      }
    }

    // Calculate total extracted items
    const totalExtracted = Object.values(extractionResults).reduce((total, items) => 
      total + (Array.isArray(items) ? items.length : 0), 0
    );

    console.log(`✅ Knowledge extraction completed: ${totalExtracted} items extracted`);
    console.log('📊 Extraction breakdown:', {
      characters: extractionResults.characters.length,
      relationships: extractionResults.relationships.length,
      timelineEvents: extractionResults.timelineEvents.length,
      plotThreads: extractionResults.plotThreads.length,
      plotPoints: extractionResults.plotPoints.length,
      chapterSummaries: extractionResults.chapterSummaries.length,
      worldBuilding: extractionResults.worldBuilding.length,
      themes: extractionResults.themes.length
    });

    // Return extracted data for orchestrator to store
    return new Response(JSON.stringify({
      success: true,
      extractedData: extractionResults,
      storageDetails: {
        language: 'detected_from_content',
        extractionStats: {
          totalExtracted,
          processingReason,
          embeddingsEnabled: useEmbeddingsBasedProcessing,
          extractionSkipped: shouldSkipExtraction,
          processedAt: new Date().toISOString()
        }
      },
      validation: {
        issues: shouldSkipExtraction ? ['Content extraction was skipped due to similarity'] : []
      },
      creditsUsed: 2,
      remainingCredits: creditCheck[0].remaining_credits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in knowledge extraction:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});