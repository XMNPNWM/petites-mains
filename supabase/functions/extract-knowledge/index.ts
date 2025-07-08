
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced diagnostic logging
function logExtraction(stage: string, data: any) {
  console.log(`🔍 [EXTRACTION-${stage}]:`, JSON.stringify(data, null, 2));
}

// Language detection helper
function detectLanguage(content: string): string {
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'un', 'une', 'dans', 'avec', 'pour', 'sur', 'par', 'que', 'qui', 'ce', 'cette', 'son', 'sa', 'ses'];
  const words = content.toLowerCase().split(/\s+/).slice(0, 100); // Check first 100 words
  const frenchCount = words.filter(word => frenchWords.includes(word)).length;
  return frenchCount > 5 ? 'french' : 'english';
}

// Comprehensive prompts for all data types in both languages
const prompts = {
  characters: {
    english: `Analyze this creative fiction text and extract character information. Focus on identifying:
- Character names (including nicknames, aliases)
- Their roles in the story
- Physical or personality descriptions
- Goals, motivations, or traits

Return a JSON object with a "characters" array. Each character should have:
{
  "name": "Character Name",
  "role": "their role",
  "description": "description of the character",
  "traits": ["trait1", "trait2"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et extrayez les informations sur les personnages. Concentrez-vous sur:
- Les noms des personnages (y compris surnoms, alias)
- Leurs rôles dans l'histoire
- Descriptions physiques ou de personnalité
- Objectifs, motivations, ou traits

Retournez un objet JSON avec un tableau "characters". Chaque personnage doit avoir:
{
  "name": "Nom du Personnage",
  "role": "leur rôle",
  "description": "description du personnage",
  "traits": ["trait1", "trait2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  relationships: {
    english: `Analyze this creative fiction text and extract character relationships. Look for:
- How characters interact with each other
- Their relationship types (friend, enemy, family, romantic, etc.)
- Relationship strength and dynamics

Return a JSON object with a "relationships" array:
{
  "character_a_name": "First Character",
  "character_b_name": "Second Character", 
  "relationship_type": "friend/enemy/family/romantic/etc",
  "relationship_strength": 5,
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et extrayez les relations entre personnages. Recherchez:
- Comment les personnages interagissent
- Types de relations (ami, ennemi, famille, romantique, etc.)
- Force et dynamiques des relations

Retournez un objet JSON avec un tableau "relationships":
{
  "character_a_name": "Premier Personnage",
  "character_b_name": "Deuxième Personnage",
  "relationship_type": "ami/ennemi/famille/romantique/etc",
  "relationship_strength": 5,
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  plotThreads: {
    english: `Analyze this creative fiction text and extract plot threads/story arcs. Look for:
- Main story arcs and subplots
- Narrative threads that span across scenes
- Story progression and development

Return a JSON object with a "plotThreads" array:
{
  "thread_name": "Name of the plot thread",
  "thread_type": "main/subplot/character_arc/mystery/etc",
  "thread_status": "active/resolved/paused",
  "key_events": ["event1", "event2"],
  "characters_involved_names": ["character1", "character2"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et extrayez les fils narratifs/arcs d'histoire. Recherchez:
- Arcs d'histoire principaux et sous-intrigues
- Fils narratifs qui s'étendent sur plusieurs scènes
- Progression et développement de l'histoire

Retournez un objet JSON avec un tableau "plotThreads":
{
  "thread_name": "Nom du fil narratif",
  "thread_type": "principal/sous-intrigue/arc_personnage/mystère/etc",
  "thread_status": "actif/résolu/en_pause",
  "key_events": ["événement1", "événement2"],
  "characters_involved_names": ["personnage1", "personnage2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  timelineEvents: {
    english: `Analyze this creative fiction text and extract timeline events. Look for:
- Key events that happen in chronological order
- Time references and sequencing
- Important story moments with temporal significance

Return a JSON object with a "timelineEvents" array:
{
  "event_summary": "Brief description of the event",
  "chronological_order": 1,
  "date_or_time_reference": "time reference from text",
  "significance": "why this event is important",
  "characters_involved_names": ["character1", "character2"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et extrayez les événements chronologiques. Recherchez:
- Événements clés qui se passent dans l'ordre chronologique
- Références temporelles et séquences
- Moments importants de l'histoire avec signification temporelle

Retournez un objet JSON avec un tableau "timelineEvents":
{
  "event_summary": "Description brève de l'événement",
  "chronological_order": 1,
  "date_or_time_reference": "référence temporelle du texte",
  "significance": "pourquoi cet événement est important",
  "characters_involved_names": ["personnage1", "personnage2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  plotPoints: {
    english: `Analyze this creative fiction text and extract plot points. Look for:
- Specific story beats and turning points
- Key revelations and discoveries
- Important narrative moments that drive the story

Return a JSON object with a "plotPoints" array:
{
  "name": "Plot point name",
  "description": "What happens in this plot point",
  "plot_thread_name": "Related plot thread",
  "significance": "Impact on the story",
  "characters_involved_names": ["character1", "character2"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et extrayez les points d'intrigue. Recherchez:
- Moments narratifs spécifiques et tournants
- Révélations et découvertes clés
- Moments narratifs importants qui font avancer l'histoire

Retournez un objet JSON avec un tableau "plotPoints":
{
  "name": "Nom du point d'intrigue",
  "description": "Ce qui se passe dans ce point d'intrigue",
  "plot_thread_name": "Fil narratif associé",
  "significance": "Impact sur l'histoire",
  "characters_involved_names": ["personnage1", "personnage2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  chapterSummaries: {
    english: `Analyze this creative fiction text and create a comprehensive chapter summary. Focus on:
- Overall chapter theme and focus
- Key events that happen
- Character development and interactions
- Story progression

Return a JSON object with a "chapterSummaries" array:
{
  "title": "Chapter title or suggested title",
  "summary_short": "Brief 1-2 sentence summary",
  "summary_long": "Detailed paragraph summary",
  "key_events_in_chapter": ["event1", "event2"],
  "primary_focus": ["main_theme1", "main_theme2"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `Analysez ce texte de fiction créative et créez un résumé de chapitre complet. Concentrez-vous sur:
- Thème et focus général du chapitre
- Événements clés qui se passent
- Développement des personnages et interactions
- Progression de l'histoire

Retournez un objet JSON avec un tableau "chapterSummaries":
{
  "title": "Titre du chapitre ou titre suggéré",
  "summary_short": "Résumé bref en 1-2 phrases",
  "summary_long": "Résumé détaillé en paragraphe",
  "key_events_in_chapter": ["événement1", "événement2"],
  "primary_focus": ["thème_principal1", "thème_principal2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  }
};

// Flexible JSON parsing with multiple strategies
function parseAIResponse(response: string, expectedType: string): any {
  logExtraction('RAW_RESPONSE', { type: expectedType, response: response.substring(0, 500) + '...' });
  
  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(response);
    if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
      logExtraction('PARSE_SUCCESS_DIRECT', { type: expectedType, count: parsed[expectedType].length });
      return parsed;
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_DIRECT', { type: expectedType, error: e.message });
  }

  // Strategy 2: Extract JSON from markdown code blocks
  try {
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
        logExtraction('PARSE_SUCCESS_MARKDOWN', { type: expectedType, count: parsed[expectedType].length });
        return parsed;
      }
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_MARKDOWN', { type: expectedType, error: e.message });
  }

  // Strategy 3: Try to find JSON anywhere in the response
  try {
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
        logExtraction('PARSE_SUCCESS_SUBSTRING', { type: expectedType, count: parsed[expectedType].length });
        return parsed;
      }
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_SUBSTRING', { type: expectedType, error: e.message });
  }

  // Strategy 4: Return empty structure to avoid null errors
  logExtraction('PARSE_FALLBACK', { expectedType });
  return { [expectedType]: [] };
}

// Database field mapping and validation functions
function mapCharacterFields(character: any): any {
  return {
    name: character.name || character.character_name || 'Unknown Character',
    role: character.role || character.character_role || null,
    description: character.description || character.character_description || null,
    traits: Array.isArray(character.traits) ? character.traits : [],
    ai_confidence: character.ai_confidence || character.confidence_score || 0.5
  };
}

function mapRelationshipFields(relationship: any): any {
  return {
    character_a_name: relationship.character_a_name || relationship.source_character_name || 'Unknown',
    character_b_name: relationship.character_b_name || relationship.target_character_name || 'Unknown',
    relationship_type: relationship.relationship_type || relationship.type || 'unknown',
    relationship_strength: relationship.relationship_strength || relationship.strength || 5,
    ai_confidence: relationship.ai_confidence || relationship.confidence_score || 0.5
  };
}

function mapPlotThreadFields(plotThread: any): any {
  return {
    thread_name: plotThread.thread_name || plotThread.name || 'Unknown Plot Thread',
    thread_type: plotThread.thread_type || plotThread.type || 'main',
    thread_status: plotThread.thread_status || plotThread.status || 'active',
    key_events: Array.isArray(plotThread.key_events) ? plotThread.key_events : [],
    characters_involved_names: Array.isArray(plotThread.characters_involved_names) ? plotThread.characters_involved_names : [],
    ai_confidence: plotThread.ai_confidence || plotThread.confidence_score || 0.5
  };
}

function mapTimelineEventFields(event: any): any {
  return {
    event_summary: event.event_summary || event.name || event.description || 'Unknown Event',
    chronological_order: event.chronological_order || 0,
    date_or_time_reference: event.date_or_time_reference || event.time_reference || null,
    significance: event.significance || event.importance || null,
    characters_involved_names: Array.isArray(event.characters_involved_names) ? event.characters_involved_names : [],
    plot_threads_impacted_names: Array.isArray(event.plot_threads_impacted_names) ? event.plot_threads_impacted_names : [],
    locations_involved_names: Array.isArray(event.locations_involved_names) ? event.locations_involved_names : [],
    ai_confidence: event.ai_confidence || event.confidence_score || 0.5
  };
}

function mapPlotPointFields(plotPoint: any): any {
  return {
    name: plotPoint.name || plotPoint.plot_point_name || 'Unknown Plot Point',
    description: plotPoint.description || null,
    plot_thread_name: plotPoint.plot_thread_name || plotPoint.thread_name || null,
    significance: plotPoint.significance || plotPoint.importance || null,
    characters_involved_names: Array.isArray(plotPoint.characters_involved_names) ? plotPoint.characters_involved_names : [],
    ai_confidence: plotPoint.ai_confidence || plotPoint.confidence_score || 0.5
  };
}

function mapChapterSummaryFields(summary: any): any {
  return {
    title: summary.title || summary.chapter_title || null,
    summary_short: summary.summary_short || summary.brief_summary || null,
    summary_long: summary.summary_long || summary.detailed_summary || null,
    key_events_in_chapter: Array.isArray(summary.key_events_in_chapter) ? summary.key_events_in_chapter : [],
    primary_focus: Array.isArray(summary.primary_focus) ? summary.primary_focus : [],
    ai_confidence: summary.ai_confidence || summary.confidence_score || 0.5
  };
}

// AI extraction with proper Google AI SDK
async function extractWithAI(content: string, extractionType: string, language: string): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const prompt = prompts[extractionType]?.[language] || prompts[extractionType]?.english;
  if (!prompt) {
    throw new Error(`No prompt available for ${extractionType} in ${language}`);
  }

  const fullPrompt = `${prompt}\n\n${content}`;
  
  logExtraction('REQUEST', { 
    extractionType, 
    language, 
    contentLength: content.length,
    promptLength: fullPrompt.length 
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt
    });

    const aiResponse = response.text;
    
    if (!aiResponse) {
      logExtraction('EMPTY_RESPONSE', { response });
      throw new Error('Empty response from AI');
    }

    return parseAIResponse(aiResponse, extractionType);
  } catch (error) {
    logExtraction('EXTRACTION_ERROR', { error: error.message });
    throw error;
  }
}

// Main extraction function with comprehensive incremental approach
async function performComprehensiveExtraction(content: string, language: string) {
  const results = {
    characters: [],
    relationships: [],
    plotThreads: [],
    timelineEvents: [],
    plotPoints: [],
    chapterSummaries: [],
    extractionStats: {
      charactersExtracted: 0,
      relationshipsExtracted: 0,
      plotThreadsExtracted: 0,
      timelineEventsExtracted: 0,
      plotPointsExtracted: 0,
      chapterSummariesExtracted: 0,
      language: language,
      totalAttempts: 0,
      successfulExtractions: 0
    }
  };

  // Step 1: Extract Characters (foundation)
  try {
    results.extractionStats.totalAttempts++;
    const characterResult = await extractWithAI(content, 'characters', language);
    
    if (characterResult.characters && characterResult.characters.length > 0) {
      results.characters = characterResult.characters.map(mapCharacterFields);
      results.extractionStats.charactersExtracted = results.characters.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('CHARACTERS_SUCCESS', { count: results.characters.length });
    }
  } catch (error) {
    logExtraction('CHARACTERS_ERROR', { error: error.message });
  }

  // Step 2: Extract Relationships (depends on characters)
  if (results.characters.length > 0) {
    try {
      results.extractionStats.totalAttempts++;
      const relationshipResult = await extractWithAI(content, 'relationships', language);
      
      if (relationshipResult.relationships && relationshipResult.relationships.length > 0) {
        results.relationships = relationshipResult.relationships.map(mapRelationshipFields);
        results.extractionStats.relationshipsExtracted = results.relationships.length;
        results.extractionStats.successfulExtractions++;
        logExtraction('RELATIONSHIPS_SUCCESS', { count: results.relationships.length });
      }
    } catch (error) {
      logExtraction('RELATIONSHIPS_ERROR', { error: error.message });
    }
  }

  // Step 3: Extract Plot Threads (story structure)
  try {
    results.extractionStats.totalAttempts++;
    const plotThreadResult = await extractWithAI(content, 'plotThreads', language);
    
    if (plotThreadResult.plotThreads && plotThreadResult.plotThreads.length > 0) {
      results.plotThreads = plotThreadResult.plotThreads.map(mapPlotThreadFields);
      results.extractionStats.plotThreadsExtracted = results.plotThreads.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('PLOTTHREADS_SUCCESS', { count: results.plotThreads.length });
    }
  } catch (error) {
    logExtraction('PLOTTHREADS_ERROR', { error: error.message });
  }

  // Step 4: Extract Timeline Events (chronological structure)
  try {
    results.extractionStats.totalAttempts++;
    const timelineResult = await extractWithAI(content, 'timelineEvents', language);
    
    if (timelineResult.timelineEvents && timelineResult.timelineEvents.length > 0) {
      results.timelineEvents = timelineResult.timelineEvents.map(mapTimelineEventFields);
      results.extractionStats.timelineEventsExtracted = results.timelineEvents.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('TIMELINE_SUCCESS', { count: results.timelineEvents.length });
    }
  } catch (error) {
    logExtraction('TIMELINE_ERROR', { error: error.message });
  }

  // Step 5: Extract Plot Points (specific story beats)
  try {
    results.extractionStats.totalAttempts++;
    const plotPointResult = await extractWithAI(content, 'plotPoints', language);
    
    if (plotPointResult.plotPoints && plotPointResult.plotPoints.length > 0) {
      results.plotPoints = plotPointResult.plotPoints.map(mapPlotPointFields);
      results.extractionStats.plotPointsExtracted = results.plotPoints.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('PLOTPOINTS_SUCCESS', { count: results.plotPoints.length });
    }
  } catch (error) {
    logExtraction('PLOTPOINTS_ERROR', { error: error.message });
  }

  // Step 6: Generate Chapter Summaries (comprehensive overview)
  try {
    results.extractionStats.totalAttempts++;
    const summaryResult = await extractWithAI(content, 'chapterSummaries', language);
    
    if (summaryResult.chapterSummaries && summaryResult.chapterSummaries.length > 0) {
      results.chapterSummaries = summaryResult.chapterSummaries.map(mapChapterSummaryFields);
      results.extractionStats.chapterSummariesExtracted = results.chapterSummaries.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('SUMMARIES_SUCCESS', { count: results.chapterSummaries.length });
    }
  } catch (error) {
    logExtraction('SUMMARIES_ERROR', { error: error.message });
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, projectId, extractionType, chapterId } = await req.json();

    logExtraction('REQUEST_START', {
      projectId,
      chapterId,
      extractionType,
      contentLength: content?.length || 0
    });

    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No content provided for extraction'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Detect language
    const language = detectLanguage(content);
    logExtraction('LANGUAGE_DETECTED', { language });

    // Perform comprehensive extraction
    const extractionResults = await performComprehensiveExtraction(content, language);
    
    logExtraction('EXTRACTION_COMPLETE', {
      stats: extractionResults.extractionStats,
      charactersFound: extractionResults.characters.length,
      relationshipsFound: extractionResults.relationships.length,
      plotThreadsFound: extractionResults.plotThreads.length,
      timelineEventsFound: extractionResults.timelineEvents.length,
      plotPointsFound: extractionResults.plotPoints.length,
      chapterSummariesFound: extractionResults.chapterSummaries.length
    });

    // Return results in the expected format
    const response = {
      success: true,
      extractedData: {
        characters: extractionResults.characters,
        relationships: extractionResults.relationships,
        plotThreads: extractionResults.plotThreads,
        timelineEvents: extractionResults.timelineEvents,
        plotPoints: extractionResults.plotPoints,
        worldBuilding: [], // Will be implemented in future phase
        themes: [], // Will be implemented in future phase
        chapterSummaries: extractionResults.chapterSummaries
      },
      storedCount: extractionResults.characters.length + 
                   extractionResults.relationships.length + 
                   extractionResults.plotThreads.length + 
                   extractionResults.timelineEvents.length + 
                   extractionResults.plotPoints.length + 
                   extractionResults.chapterSummaries.length,
      storageDetails: {
        characters: extractionResults.characters.length,
        relationships: extractionResults.relationships.length,
        plotThreads: extractionResults.plotThreads.length,
        timelineEvents: extractionResults.timelineEvents.length,
        plotPoints: extractionResults.plotPoints.length,
        chapterSummaries: extractionResults.chapterSummaries.length,
        language: language,
        extractionStats: extractionResults.extractionStats
      },
      validation: {
        confidence: extractionResults.extractionStats.successfulExtractions / Math.max(1, extractionResults.extractionStats.totalAttempts),
        issues: [],
        method: 'comprehensive_extraction'
      },
      processingTime: 0,
      message: `Extracted ${extractionResults.characters.length} characters, ${extractionResults.relationships.length} relationships, ${extractionResults.plotThreads.length} plot threads, ${extractionResults.timelineEvents.length} timeline events, ${extractionResults.plotPoints.length} plot points, and ${extractionResults.chapterSummaries.length} chapter summaries`
    };

    logExtraction('RESPONSE_SENT', {
      success: true,
      totalExtracted: response.storedCount,
      breakdown: response.storageDetails
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logExtraction('FATAL_ERROR', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      extractedData: {
        characters: [],
        relationships: [],
        plotThreads: [],
        timelineEvents: [],
        plotPoints: [],
        worldBuilding: [],
        themes: [],
        chapterSummaries: []
      },
      storedCount: 0,
      validation: {
        confidence: 0,
        issues: [error.message],
        method: 'error_fallback'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
