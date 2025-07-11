import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const ai = new GoogleGenAI({ apiKey: googleAIKey });

    const { projectId, chapterId, content, options = {} } = await req.json();

    if (!projectId || !chapterId || !content) {
      throw new Error('Missing required parameters: projectId, chapterId, or content');
    }

    // Extract force re-extraction options
    const forceReExtraction = options.forceReExtraction || false;
    const contentTypesToExtract = options.contentTypesToExtract || [];
    
    console.log(`🚀 Starting knowledge extraction for chapter: ${chapterId}`);
    console.log('📋 Extraction options:', { 
      forceReExtraction, 
      contentTypesToExtract: contentTypesToExtract.length > 0 ? contentTypesToExtract : 'all',
      useEmbeddingsBasedProcessing: options.useEmbeddingsBasedProcessing 
    });

    // Check if embeddings-based processing is enabled
    const useEmbeddingsBasedProcessing = options.useEmbeddingsBasedProcessing !== false;

    let shouldSkipExtraction = false;
    let processingReason = 'Processing new content';

    // Phase 1: Embeddings-based similarity check if enabled (unless force re-extraction)
    if (useEmbeddingsBasedProcessing && !forceReExtraction) {
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

    // Phase 2: Perform multi-pass extraction if not skipped
    if (!shouldSkipExtraction) {
      console.log('📊 Proceeding with multi-pass knowledge extraction...');
      
      // Pass 1: Extract Characters
      console.log('🎭 Pass 1: Extracting characters...');
      const charactersPrompt = `Analyze the following text and extract ONLY characters in JSON format. Focus on clearly identifiable people, beings, or entities that appear in the narrative.

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "characters": [{"name": "", "description": "", "traits": [], "role": "", "confidence_score": 0.8}]
}

Extract only clearly evident characters. Assign confidence scores based on how explicit their presence and description is in the text.`;

      const charactersResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: charactersPrompt
      });

      try {
        const charactersText = charactersResponse.text.replace(/```json\n?|\n?```/g, '').trim();
        const charactersData = JSON.parse(charactersText);
        extractionResults.characters = charactersData.characters || [];
        console.log(`✅ Extracted ${extractionResults.characters.length} characters`);
      } catch (error) {
        console.error('Failed to parse characters:', error);
      }

      // Pass 2: Extract Relationships (based on identified characters)
      if (extractionResults.characters.length > 0) {
        console.log('🤝 Pass 2: Extracting relationships...');
        const characterNames = extractionResults.characters.map(c => c.name).join(', ');
        
        const relationshipsPrompt = `Analyze the following text and extract ONLY relationships between the identified characters in JSON format.

Known characters: ${characterNames}

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "relationships": [{"character_a_name": "", "character_b_name": "", "relationship_type": "", "relationship_strength": 5, "confidence_score": 0.8}]
}

Look for:
- Direct interactions between characters
- Mentions of one character by another
- Implied relationships through dialogue or narration
- Family, romantic, professional, or adversarial connections

Only include relationships between the identified characters. Use exact character names from the list above.`;

        const relationshipsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: relationshipsPrompt
        });

        try {
          const relationshipsText = relationshipsResponse.text.replace(/```json\n?|\n?```/g, '').trim();
          const relationshipsData = JSON.parse(relationshipsText);
          extractionResults.relationships = relationshipsData.relationships || [];
          console.log(`✅ Extracted ${extractionResults.relationships.length} relationships`);
        } catch (error) {
          console.error('Failed to parse relationships:', error);
        }
      }

      // Pass 3: Extract Timeline Events (with character context)
      console.log('⏰ Pass 3: Extracting timeline events...');
      const characterContext = extractionResults.characters.length > 0 
        ? `Known characters: ${extractionResults.characters.map(c => c.name).join(', ')}`
        : '';
      
      const timelinePrompt = `Analyze the following text and extract ONLY timeline events in JSON format. Focus on specific actions, scenes, or occurrences that happen in sequence.

${characterContext}

Text to analyze: "${content}"

Return a JSON object with this exact structure:
{
  "timelineEvents": [{"event_name": "", "event_type": "", "description": "", "chronological_order": 0, "characters_involved": [], "confidence_score": 0.8}]
}

Look for:
- Specific actions that occur
- Scene changes or transitions
- Temporal markers (then, later, meanwhile, etc.)
- Cause and effect sequences
- Character actions and reactions

If characters are involved, use exact names from the known characters list.`;

      const timelineResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: timelinePrompt
      });

      try {
        const timelineText = timelineResponse.text.replace(/```json\n?|\n?```/g, '').trim();
        const timelineData = JSON.parse(timelineText);
        extractionResults.timelineEvents = timelineData.timelineEvents || [];
        console.log(`✅ Extracted ${extractionResults.timelineEvents.length} timeline events`);
      } catch (error) {
        console.error('Failed to parse timeline events:', error);
      }

      // Pass 4: Extract Plot Elements
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

      // Pass 5: Extract World Building and Themes
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

      try {
        const worldText = worldResponse.text.replace(/```json\n?|\n?```/g, '').trim();
        const worldData = JSON.parse(worldText);
        extractionResults.worldBuilding = worldData.worldBuilding || [];
        extractionResults.themes = worldData.themes || [];
        console.log(`✅ Extracted ${extractionResults.worldBuilding.length} world building elements, ${extractionResults.themes.length} themes`);
      } catch (error) {
        console.error('Failed to parse world building and themes:', error);
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
      }
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