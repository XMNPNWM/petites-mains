
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

    // Phase 2: Perform extraction if not skipped
    if (!shouldSkipExtraction) {
      console.log('📊 Proceeding with knowledge extraction...');
      
      // Enhanced extraction with context awareness
      const extractionPrompt = `Analyze the following text and extract comprehensive knowledge in JSON format. Focus on narrative elements that are clearly established and avoid speculation.

Text to analyze: "${content}"

Please return a JSON object with the following structure:
{
  "characters": [{"name": "", "description": "", "traits": [], "role": "", "confidence_score": 0.8}],
  "relationships": [{"character_a_name": "", "character_b_name": "", "relationship_type": "", "relationship_strength": 5, "confidence_score": 0.8}],
  "plotThreads": [{"thread_name": "", "thread_type": "", "key_events": [], "status": "active", "confidence_score": 0.8}],
  "timelineEvents": [{"event_name": "", "event_type": "", "description": "", "chronological_order": 0, "characters_involved": [], "confidence_score": 0.8}],
  "plotPoints": [{"name": "", "description": "", "significance": "", "confidence_score": 0.8}],
  "chapterSummaries": [{"title": "", "summary_short": "", "summary_long": "", "key_events": [], "confidence_score": 0.8}],
  "worldBuilding": [{"name": "", "description": "", "category": "", "confidence_score": 0.8}],
  "themes": [{"name": "", "description": "", "significance": "", "confidence_score": 0.8}]
}

Important: Extract only clearly evident information. Assign appropriate confidence scores based on how explicit the information is in the text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: extractionPrompt
      });

      const extractedText = response.text;
      
      // Parse the JSON response
      try {
        const cleanedText = extractedText.replace(/```json\n?|\n?```/g, '').trim();
        extractionResults = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse extraction results:', parseError);
        // Fallback to empty results but continue processing
      }
    }

    // Phase 3: Store results in database with current timestamp
    const currentTimestamp = new Date().toISOString();
    
    // Store semantic chunks with embeddings if not skipped
    if (!shouldSkipExtraction && useEmbeddingsBasedProcessing) {
      // Create semantic chunks for future similarity checking
      const chunks = content.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for this chunk
        const chunkEmbeddingResponse = await ai.models.embedContent({
          model: "text-embedding-004",
          content: {
            parts: [{ text: chunk }]
          }
        });

        if (chunkEmbeddingResponse.embedding?.values) {
          const chunkEmbedding = chunkEmbeddingResponse.embedding.values;
          
          await supabase.from('semantic_chunks').insert({
            project_id: projectId,
            chapter_id: chapterId,
            content: chunk,
            chunk_index: i,
            start_position: 0,
            end_position: chunk.length,
            breakpoint_score: 0.7,
            embeddings: JSON.stringify(chunkEmbedding),
            embeddings_model: 'text-embedding-004',
            processed_at: currentTimestamp
          });
        }
      }
    }

    // Filter extracted data by content types if specified (for force re-extraction)
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

    // Store extracted knowledge with proper timestamps
    let totalInserted = 0;

    // Store all extracted data types
    for (const [dataType, items] of Object.entries(extractionResults)) {
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const baseData = {
            project_id: projectId,
            source_chapter_id: chapterId,
            confidence_score: item.confidence_score || 0.7,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
            is_newly_extracted: true
          };

          try {
            switch (dataType) {
              case 'characters':
                await supabase.from('knowledge_base').insert({
                  ...baseData,
                  category: 'character',
                  name: item.name,
                  description: item.description,
                  details: { traits: item.traits, role: item.role }
                });
                break;

              case 'relationships':
                await supabase.from('character_relationships').insert({
                  ...baseData,
                  character_a_name: item.character_a_name,
                  character_b_name: item.character_b_name,
                  relationship_type: item.relationship_type,
                  relationship_strength: item.relationship_strength || 5
                });
                break;

              case 'plotThreads':
                await supabase.from('plot_threads').insert({
                  ...baseData,
                  thread_name: item.thread_name,
                  thread_type: item.thread_type,
                  key_events: item.key_events || [],
                  thread_status: item.status || 'active'
                });
                break;

              case 'timelineEvents':
                await supabase.from('timeline_events').insert({
                  ...baseData,
                  event_name: item.event_name,
                  event_type: item.event_type,
                  event_summary: item.description,
                  chronological_order: item.chronological_order || 0,
                  characters_involved_names: item.characters_involved || []
                });
                break;

              case 'plotPoints':
                await supabase.from('plot_points').insert({
                  ...baseData,
                  name: item.name,
                  description: item.description,
                  significance: item.significance
                });
                break;

              case 'chapterSummaries':
                await supabase.from('chapter_summaries').insert({
                  ...baseData,
                  chapter_id: chapterId,
                  title: item.title,
                  summary_short: item.summary_short,
                  summary_long: item.summary_long,
                  key_events_in_chapter: item.key_events || []
                });
                break;

              case 'worldBuilding':
                await supabase.from('knowledge_base').insert({
                  ...baseData,
                  category: 'world_building',
                  name: item.name,
                  description: item.description,
                  subcategory: item.category
                });
                break;

              case 'themes':
                await supabase.from('knowledge_base').insert({
                  ...baseData,
                  category: 'theme',
                  name: item.name,
                  description: item.description,
                  details: { significance: item.significance }
                });
                break;
            }
            totalInserted++;
          } catch (insertError) {
            console.error(`Error inserting ${dataType}:`, insertError);
          }
        }
      }
    }

    // Update processing job status with current timestamp
    await supabase
      .from('knowledge_processing_jobs')
      .update({
        state: 'done',
        completed_at: currentTimestamp,
        progress_percentage: 100,
        results_summary: {
          total_extracted: totalInserted,
          processing_reason: processingReason,
          embeddings_enabled: useEmbeddingsBasedProcessing,
          extraction_skipped: shouldSkipExtraction
        }
      })
      .eq('project_id', projectId)
      .eq('chapter_id', chapterId);

    console.log(`✅ Knowledge extraction completed: ${totalInserted} items processed`);

    return new Response(JSON.stringify({
      success: true,
      totalExtracted: totalInserted,
      processingReason,
      embeddingsEnabled: useEmbeddingsBasedProcessing,
      extractionSkipped: shouldSkipExtraction,
      processedAt: currentTimestamp
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
