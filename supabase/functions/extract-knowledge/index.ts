
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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

// Optimized prompts for different languages and extraction types
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
  }
};

// Flexible JSON parsing with multiple strategies
function parseAIResponse(response: string, expectedType: string): any {
  logExtraction('RAW_RESPONSE', { response: response.substring(0, 500) + '...' });
  
  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(response);
    if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
      logExtraction('PARSE_SUCCESS_DIRECT', { count: parsed[expectedType].length });
      return parsed;
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_DIRECT', { error: e.message });
  }

  // Strategy 2: Extract JSON from markdown code blocks
  try {
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
        logExtraction('PARSE_SUCCESS_MARKDOWN', { count: parsed[expectedType].length });
        return parsed;
      }
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_MARKDOWN', { error: e.message });
  }

  // Strategy 3: Try to find JSON anywhere in the response
  try {
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
        logExtraction('PARSE_SUCCESS_SUBSTRING', { count: parsed[expectedType].length });
        return parsed;
      }
    }
  } catch (e) {
    logExtraction('PARSE_FAIL_SUBSTRING', { error: e.message });
  }

  // Strategy 4: Return empty structure to avoid null errors
  logExtraction('PARSE_FALLBACK', { expectedType });
  return { [expectedType]: [] };
}

// Database field mapping and validation
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

// AI extraction with retry logic
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
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logExtraction('API_ERROR', { status: response.status, error: errorText });
      throw new Error(`AI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      logExtraction('EMPTY_RESPONSE', { data });
      throw new Error('Empty response from AI');
    }

    return parseAIResponse(aiResponse, extractionType);
  } catch (error) {
    logExtraction('EXTRACTION_ERROR', { error: error.message });
    throw error;
  }
}

// Main extraction function with incremental approach
async function performIncrementalExtraction(content: string, language: string) {
  const results = {
    characters: [],
    relationships: [],
    extractionStats: {
      charactersExtracted: 0,
      relationshipsExtracted: 0,
      language: language,
      totalAttempts: 0,
      successfulExtractions: 0
    }
  };

  // Step 1: Extract Characters (most reliable)
  try {
    results.extractionStats.totalAttempts++;
    const characterResult = await extractWithAI(content, 'characters', language);
    
    if (characterResult.characters && characterResult.characters.length > 0) {
      results.characters = characterResult.characters.map(mapCharacterFields);
      results.extractionStats.charactersExtracted = results.characters.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('CHARACTERS_SUCCESS', { count: results.characters.length });
    } else {
      logExtraction('CHARACTERS_EMPTY', { result: characterResult });
    }
  } catch (error) {
    logExtraction('CHARACTERS_ERROR', { error: error.message });
  }

  // Step 2: Extract Relationships (if we have characters)
  if (results.characters.length > 0) {
    try {
      results.extractionStats.totalAttempts++;
      const relationshipResult = await extractWithAI(content, 'relationships', language);
      
      if (relationshipResult.relationships && relationshipResult.relationships.length > 0) {
        results.relationships = relationshipResult.relationships.map(mapRelationshipFields);
        results.extractionStats.relationshipsExtracted = results.relationships.length;
        results.extractionStats.successfulExtractions++;
        logExtraction('RELATIONSHIPS_SUCCESS', { count: results.relationships.length });
      } else {
        logExtraction('RELATIONSHIPS_EMPTY', { result: relationshipResult });
      }
    } catch (error) {
      logExtraction('RELATIONSHIPS_ERROR', { error: error.message });
    }
  } else {
    logExtraction('RELATIONSHIPS_SKIPPED', { reason: 'No characters found' });
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

    // Perform incremental extraction
    const extractionResults = await performIncrementalExtraction(content, language);
    
    logExtraction('EXTRACTION_COMPLETE', {
      stats: extractionResults.extractionStats,
      charactersFound: extractionResults.characters.length,
      relationshipsFound: extractionResults.relationships.length
    });

    // Return results in the expected format
    const response = {
      success: true,
      extractedData: {
        characters: extractionResults.characters,
        relationships: extractionResults.relationships,
        plotThreads: [], // Will be implemented in next phase
        timelineEvents: [], // Will be implemented in next phase
        plotPoints: [],
        worldBuilding: [],
        themes: []
      },
      storedCount: extractionResults.characters.length + extractionResults.relationships.length,
      storageDetails: {
        characters: extractionResults.characters.length,
        relationships: extractionResults.relationships.length,
        language: language,
        extractionStats: extractionResults.extractionStats
      },
      validation: {
        confidence: extractionResults.extractionStats.successfulExtractions / Math.max(1, extractionResults.extractionStats.totalAttempts),
        issues: [],
        method: 'incremental_extraction'
      },
      processingTime: 0,
      message: `Extracted ${extractionResults.characters.length} characters and ${extractionResults.relationships.length} relationships`
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
        themes: []
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
