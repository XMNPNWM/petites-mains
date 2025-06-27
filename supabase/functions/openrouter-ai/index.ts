
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeExtractionRequest {
  chunks: Array<{
    id: string;
    content: string;
    chunk_index: number;
    chapter_id: string;
  }>;
  projectId: string;
  extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive';
  existingKnowledge?: any;
}

interface KnowledgeExtractionResult {
  characters?: any[];
  relationships?: any[];
  plotThreads?: any[];
  timelineEvents?: any[];
  conflicts?: any[];
  processingStats: {
    chunksProcessed: number;
    extractionsFound: number;
    confidenceAverage: number;
    processingTime: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chunks, projectId, extractionType, existingKnowledge }: KnowledgeExtractionRequest = await req.json();
    
    console.log(`Processing ${chunks.length} chunks for ${extractionType} extraction`);
    
    const startTime = Date.now();
    const result = await extractKnowledgeFromChunks(chunks, extractionType, existingKnowledge);
    const processingTime = Date.now() - startTime;

    result.processingStats = {
      ...result.processingStats,
      processingTime
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openrouter-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractKnowledgeFromChunks(
  chunks: any[],
  extractionType: string,
  existingKnowledge: any
): Promise<KnowledgeExtractionResult> {
  const systemPrompts = {
    characters: `You are an expert literary analyst. Extract character information from text chunks. Return JSON with characters array containing: name, description, traits, role, first_appearance_chunk_id, confidence_score (0-1).`,
    relationships: `You are an expert literary analyst. Extract character relationships from text chunks. Return JSON with relationships array containing: character_a_name, character_b_name, relationship_type, relationship_strength (1-10), description, confidence_score (0-1).`,
    plot_threads: `You are an expert literary analyst. Extract plot threads from text chunks. Return JSON with plotThreads array containing: thread_name, thread_type, description, status, key_events, confidence_score (0-1).`,
    timeline_events: `You are an expert literary analyst. Extract timeline events from text chunks. Return JSON with timelineEvents array containing: event_name, event_type, description, chronological_order, characters_involved, significance_level (1-10), confidence_score (0-1).`,
    comprehensive: `You are an expert literary analyst. Extract all story elements from text chunks. Return JSON with characters, relationships, plotThreads, timelineEvents, and conflicts arrays.`
  };

  const userPrompt = `
Context: ${existingKnowledge ? JSON.stringify(existingKnowledge) : 'No existing knowledge'}

Analyze these text chunks and extract ${extractionType}:

${chunks.map((chunk, index) => `
Chunk ${index + 1} (ID: ${chunk.id}):
${chunk.content}
`).join('\n')}

Requirements:
- Be thorough but precise
- Assign confidence scores based on text clarity
- Reference chunk IDs for evidence
- Maintain consistency with existing knowledge
- Focus on significant story elements only
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://storyloom.ai',
        'X-Title': 'StoryLoom AI Knowledge Extraction'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompts[extractionType] || systemPrompts.comprehensive },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse extracted data as JSON:', extractedText);
      // Fallback: try to extract JSON from the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from AI response');
      }
    }

    // Calculate processing stats
    const allExtractions = [
      ...(extractedData.characters || []),
      ...(extractedData.relationships || []),
      ...(extractedData.plotThreads || []),
      ...(extractedData.timelineEvents || []),
      ...(extractedData.conflicts || [])
    ];

    const confidenceScores = allExtractions.map(item => item.confidence_score || 0.5);
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0;

    return {
      ...extractedData,
      processingStats: {
        chunksProcessed: chunks.length,
        extractionsFound: allExtractions.length,
        confidenceAverage: averageConfidence,
        processingTime: 0 // Will be set by caller
      }
    };

  } catch (error) {
    console.error('Error calling Gemini 2.5 Flash:', error);
    throw error;
  }
}
