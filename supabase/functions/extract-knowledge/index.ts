
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.7.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

// Enhanced diagnostic logging
function logExtraction(stage: string, data: any) {
  console.log(`🔍 [EXTRACTION-${stage}]:`, JSON.stringify(data, null, 2));
}

// Enhanced language detection helper with strict validation
function detectLanguage(content: string): string {
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'un', 'une', 'dans', 'avec', 'pour', 'sur', 'par', 'que', 'qui', 'ce', 'cette', 'son', 'sa', 'ses', 'mais', 'ou', 'donc', 'car', 'ne', 'pas', 'tout', 'tous', 'être', 'avoir', 'faire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir', 'venir', 'dire', 'prendre'];
  const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'];
  
  // Check first 150 words for better accuracy
  const words = content.toLowerCase().split(/\s+/).slice(0, 150);
  const frenchCount = words.filter(word => frenchWords.includes(word)).length;
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  
  logExtraction('LANGUAGE_DETECTION', { 
    frenchCount, 
    englishCount, 
    totalWords: words.length,
    decision: frenchCount > englishCount ? 'french' : 'english'
  });
  
  return frenchCount > englishCount ? 'french' : 'english';
}

// Strict language validation function
function validateExtractedLanguage(extractedData: any, expectedLanguage: string): boolean {
  if (!extractedData || typeof extractedData !== 'object') return false;
  
  // Sample text from extracted data for validation
  const textSamples = [];
  
  // Collect text samples from various fields
  Object.values(extractedData).forEach((category: any) => {
    if (Array.isArray(category)) {
      category.slice(0, 3).forEach((item: any) => {
        if (item.description) textSamples.push(item.description);
        if (item.role) textSamples.push(item.role);
        if (item.relationship_type) textSamples.push(item.relationship_type);
        if (item.thread_name) textSamples.push(item.thread_name);
        if (item.event_summary) textSamples.push(item.event_summary);
        if (item.significance) textSamples.push(item.significance);
        if (item.summary_short) textSamples.push(item.summary_short);
      });
    }
  });
  
  if (textSamples.length === 0) return true; // No text to validate
  
  // Check language consistency
  const combinedText = textSamples.join(' ').substring(0, 500);
  const detectedLanguage = detectLanguage(combinedText);
  
  const isValid = detectedLanguage === expectedLanguage;
  logExtraction('LANGUAGE_VALIDATION', {
    expected: expectedLanguage,
    detected: detectedLanguage,
    isValid,
    samplesChecked: textSamples.length,
    combinedTextLength: combinedText.length
  });
  
  return isValid;
}

// Enhanced prompts with explicit language preservation instructions
const prompts = {
  characters: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract character information with chronological context. Focus on identifying:
- Character names (including nicknames, aliases) - KEEP ORIGINAL NAMES EXACTLY
- Their roles in the story and when they first appear
- Physical or personality descriptions
- Goals, motivations, or traits
- Time references for when they are introduced or change
- Chronological markers indicating narrative sequence

CHRONOLOGICAL ANALYSIS: Pay attention to:
- When characters first appear in the narrative
- Character development progression
- Time indicators (dates, seasons, "later", "before", etc.)
- Narrative sequence clues

Return a JSON object with a "characters" array. Each character should have:
{
  "name": "Character Name (EXACT as in text)",
  "role": "their role in English",
  "description": "description of the character in English",
  "traits": ["trait1", "trait2"],
  "temporal_markers": ["first appearance", "character development points"],
  "chronological_order": 1,
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les informations sur les personnages. Concentrez-vous sur:
- Les noms des personnages (y compris surnoms, alias) - GARDEZ LES NOMS ORIGINAUX EXACTS
- Leurs rôles dans l'histoire
- Descriptions physiques ou de personnalité
- Objectifs, motivations, ou traits

Retournez un objet JSON avec un tableau "characters". Chaque personnage doit avoir:
{
  "name": "Nom du Personnage (EXACT comme dans le texte)",
  "role": "leur rôle en français",
  "description": "description du personnage en français",
  "traits": ["trait1", "trait2"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  relationships: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract character relationships with chronological context. Look for:
- How characters interact with each other
- Their relationship types (friend, enemy, family, romantic, etc.)
- Relationship strength and dynamics
- When relationships are established or change
- Temporal markers indicating relationship development

CHRONOLOGICAL ANALYSIS: Pay attention to:
- When relationships first form or are revealed
- How relationships evolve over time
- Time indicators for relationship changes
- Narrative sequence of relationship development

Return a JSON object with a "relationships" array:
{
  "character_a_name": "First Character (EXACT as in text)",
  "character_b_name": "Second Character (EXACT as in text)", 
  "relationship_type": "friend/enemy/family/romantic/etc in English",
  "relationship_strength": 5,
  "temporal_markers": ["when relationship forms", "development points"],
  "chronological_order": 1,
  "dependency_elements": ["related events", "connected plot points"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les relations entre personnages. Recherchez:
- Comment les personnages interagissent
- Types de relations (ami, ennemi, famille, romantique, etc.)
- Force et dynamiques des relations

Retournez un objet JSON avec un tableau "relationships":
{
  "character_a_name": "Premier Personnage (EXACT comme dans le texte)",
  "character_b_name": "Deuxième Personnage (EXACT comme dans le texte)",
  "relationship_type": "ami/ennemi/famille/romantique/etc en français",
  "relationship_strength": 5,
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  plotThreads: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract plot threads/story arcs. Look for:
- Main story arcs and subplots
- Narrative threads that span across scenes
- Story progression and development

Return a JSON object with a "plotThreads" array:
{
  "thread_name": "Name of the plot thread in English",
  "thread_type": "main/subplot/character_arc/mystery/etc",
  "thread_status": "active/resolved/paused",
  "key_events": ["event1", "event2"],
  "characters_involved_names": ["character1 (EXACT as in text)", "character2 (EXACT as in text)"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les fils narratifs/arcs d'histoire. Recherchez:
- Arcs d'histoire principaux et sous-intrigues
- Fils narratifs qui s'étendent sur plusieurs scènes
- Progression et développement de l'histoire

Retournez un objet JSON avec un tableau "plotThreads":
{
  "thread_name": "Nom du fil narratif en français",
  "thread_type": "principal/sous-intrigue/arc_personnage/mystère/etc",
  "thread_status": "actif/résolu/en_pause",
  "key_events": ["événement1", "événement2"],
  "characters_involved_names": ["personnage1 (EXACT comme dans le texte)", "personnage2 (EXACT comme dans le texte)"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  timelineEvents: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract timeline events. Look for:
- Key events that happen in chronological order
- Time references and sequencing
- Important story moments with temporal significance

Return a JSON object with a "timelineEvents" array:
{
  "event_summary": "Brief description of the event in English",
  "chronological_order": 1,
  "date_or_time_reference": "time reference from text (keep original)",
  "significance": "why this event is important in English",
  "characters_involved_names": ["character1 (EXACT as in text)", "character2 (EXACT as in text)"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les événements chronologiques. Recherchez:
- Événements clés qui se passent dans l'ordre chronologique
- Références temporelles et séquences
- Moments importants de l'histoire avec signification temporelle

Retournez un objet JSON avec un tableau "timelineEvents":
{
  "event_summary": "Description brève de l'événement en français",
  "chronological_order": 1,
  "date_or_time_reference": "référence temporelle du texte (garder original)",
  "significance": "pourquoi cet événement est important en français",
  "characters_involved_names": ["personnage1 (EXACT comme dans le texte)", "personnage2 (EXACT comme dans le texte)"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  plotPoints: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract plot points. Look for:
- Specific story beats and turning points
- Key revelations and discoveries
- Important narrative moments that drive the story

Return a JSON object with a "plotPoints" array:
{
  "name": "Plot point name in English",
  "description": "What happens in this plot point in English",
  "plot_thread_name": "Related plot thread in English",
  "significance": "Impact on the story in English",
  "characters_involved_names": ["character1 (EXACT as in text)", "character2 (EXACT as in text)"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les points d'intrigue. Recherchez:
- Moments narratifs spécifiques et tournants
- Révélations et découvertes clés
- Moments narratifs importants qui font avancer l'histoire

Retournez un objet JSON avec un tableau "plotPoints":
{
  "name": "Nom du point d'intrigue en français",
  "description": "Ce qui se passe dans ce point d'intrigue en français",
  "plot_thread_name": "Fil narratif associé en français",
  "significance": "Impact sur l'histoire en français",
  "characters_involved_names": ["personnage1 (EXACT comme dans le texte)", "personnage2 (EXACT comme dans le texte)"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  chapterSummaries: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and create a comprehensive chapter summary. Focus on:
- Overall chapter theme and focus
- Key events that happen
- Character development and interactions
- Story progression

Return a JSON object with a "chapterSummaries" array:
{
  "title": "Chapter title or suggested title in English",
  "summary_short": "Brief 1-2 sentence summary in English",
  "summary_long": "Detailed paragraph summary in English",
  "key_events_in_chapter": ["event1 in English", "event2 in English"],
  "primary_focus": ["main_theme1 in English", "main_theme2 in English"],
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et créez un résumé de chapitre complet. Concentrez-vous sur:
- Thème et focus général du chapitre
- Événements clés qui se passent
- Développement des personnages et interactions
- Progression de l'histoire

Retournez un objet JSON avec un tableau "chapterSummaries":
{
  "title": "Titre du chapitre ou titre suggéré en français",
  "summary_short": "Résumé bref en 1-2 phrases en français",
  "summary_long": "Résumé détaillé en paragraphe en français",
  "key_events_in_chapter": ["événement1 en français", "événement2 en français"],
  "primary_focus": ["thème_principal1 en français", "thème_principal2 en français"],
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  worldBuilding: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original place names and terms exactly as they appear in the text.

Analyze this creative fiction text and extract world building elements. Look for:
- Settings, locations, and environments
- Magic systems, technologies, or special abilities
- Cultural elements, societies, and organizations
- Rules that govern the fictional world

Return a JSON object with a "worldBuilding" array:
{
  "name": "Element name (EXACT as in text for places/names)",
  "type": "location/magic_system/culture/technology/rule/etc",
  "description": "Detailed description of the element in English",
  "significance": "How this affects the story world in English",
  "details": {"key": "value"},
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de lieux et termes originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les éléments de construction du monde. Recherchez:
- Décors, lieux et environnements
- Systèmes de magie, technologies ou capacités spéciales
- Éléments culturels, sociétés et organisations
- Règles qui gouvernent le monde fictif

Retournez un objet JSON avec un tableau "worldBuilding":
{
  "name": "Nom de l'élément (EXACT comme dans le texte pour lieux/noms)",
  "type": "lieu/système_magique/culture/technologie/règle/etc",
  "description": "Description détaillée de l'élément en français",
  "significance": "Comment cela affecte le monde de l'histoire en français",
  "details": {"clé": "valeur"},
  "ai_confidence": 0.8
}

Texte à analyser:`
  },
  themes: {
    english: `CRITICAL INSTRUCTION: You MUST respond in English and preserve all original character names exactly as they appear in the text.

Analyze this creative fiction text and extract themes. Look for:
- Central themes and messages
- Recurring motifs and symbols
- Moral or philosophical questions explored
- Character arcs that illustrate themes

Return a JSON object with a "themes" array:
{
  "name": "Theme name in English",
  "type": "central/secondary/motif/moral/etc",
  "exploration_summary": "How this theme is explored in English",
  "key_moments_or_characters": ["moment1 in English", "character1 (EXACT as in text)"],
  "significance": "Why this theme matters to the story in English",
  "ai_confidence": 0.8
}

Text to analyze:`,
    french: `INSTRUCTION CRITIQUE: Vous DEVEZ répondre en français et préserver tous les noms de personnages originaux exactement comme ils apparaissent dans le texte.

Analysez ce texte de fiction créative et extrayez les thèmes. Recherchez:
- Thèmes centraux et messages
- Motifs et symboles récurrents
- Questions morales ou philosophiques explorées
- Arcs de personnages qui illustrent les thèmes

Retournez un objet JSON avec un tableau "themes":
{
  "name": "Nom du thème en français",
  "type": "central/secondaire/motif/moral/etc",
  "exploration_summary": "Comment ce thème est exploré en français",
  "key_moments_or_characters": ["moment1 en français", "personnage1 (EXACT comme dans le texte)"],
  "significance": "Pourquoi ce thème est important pour l'histoire en français",
  "ai_confidence": 0.8
}

Texte à analyser:`
  }
};

// Enhanced parsing with strict language validation
function parseAIResponse(response: string, expectedType: string, expectedLanguage: string): any {
  logExtraction('RAW_RESPONSE', { type: expectedType, response: response.substring(0, 500) + '...' });
  
  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(response);
    if (parsed[expectedType] && Array.isArray(parsed[expectedType])) {
      // Strict language validation - reject if wrong language
      const languageValid = validateResponseLanguage(parsed[expectedType], expectedLanguage);
      if (!languageValid) {
        logExtraction('LANGUAGE_VALIDATION_FAILED_REJECTING', { 
          expectedLanguage, 
          type: expectedType,
          message: 'Response rejected due to language mixing'
        });
        // Return empty array instead of mixed language content
        return { [expectedType]: [] };
      }
      logExtraction('PARSE_SUCCESS_DIRECT', { type: expectedType, count: parsed[expectedType].length, languageValid });
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
        const languageValid = validateResponseLanguage(parsed[expectedType], expectedLanguage);
        logExtraction('PARSE_SUCCESS_MARKDOWN', { type: expectedType, count: parsed[expectedType].length, languageValid });
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
        const languageValid = validateResponseLanguage(parsed[expectedType], expectedLanguage);
        logExtraction('PARSE_SUCCESS_SUBSTRING', { type: expectedType, count: parsed[expectedType].length, languageValid });
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

// Language validation function
function validateResponseLanguage(dataArray: any[], expectedLanguage: string): boolean {
  if (!dataArray || dataArray.length === 0) return true;
  
  // Sample check on first few items
  const sampleSize = Math.min(3, dataArray.length);
  const samples = dataArray.slice(0, sampleSize);
  
  for (const item of samples) {
    // Check descriptive text fields for language consistency
    const textFields = ['description', 'role', 'thread_name', 'event_summary', 'significance', 'summary_short', 'summary_long'];
    
    for (const field of textFields) {
      if (item[field]) {
        const detectedLang = detectLanguage(item[field]);
        if (detectedLang !== expectedLanguage) {
          logExtraction('LANGUAGE_MISMATCH', { 
            field, 
            expected: expectedLanguage, 
            detected: detectedLang, 
            text: item[field].substring(0, 100) 
          });
          return false;
        }
      }
    }
  }
  
  return true;
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
    chronological_order: relationship.chronological_order || 0,
    temporal_markers: Array.isArray(relationship.temporal_markers) ? relationship.temporal_markers : [],
    dependency_elements: Array.isArray(relationship.dependency_elements) ? relationship.dependency_elements : [],
    chronological_confidence: relationship.chronological_confidence || 0.5,
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
    chronological_order: plotThread.chronological_order || 0,
    temporal_markers: Array.isArray(plotThread.temporal_markers) ? plotThread.temporal_markers : [],
    dependency_elements: Array.isArray(plotThread.dependency_elements) ? plotThread.dependency_elements : [],
    chronological_confidence: plotThread.chronological_confidence || 0.5,
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
    temporal_markers: Array.isArray(event.temporal_markers) ? event.temporal_markers : [],
    dependency_elements: Array.isArray(event.dependency_elements) ? event.dependency_elements : [],
    chronological_confidence: event.chronological_confidence || 0.5,
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
    chronological_order: plotPoint.chronological_order || 0,
    temporal_markers: Array.isArray(plotPoint.temporal_markers) ? plotPoint.temporal_markers : [],
    dependency_elements: Array.isArray(plotPoint.dependency_elements) ? plotPoint.dependency_elements : [],
    chronological_confidence: plotPoint.chronological_confidence || 0.5,
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
    chronological_order: summary.chronological_order || 0,
    temporal_markers: Array.isArray(summary.temporal_markers) ? summary.temporal_markers : [],
    dependency_elements: Array.isArray(summary.dependency_elements) ? summary.dependency_elements : [],
    chronological_confidence: summary.chronological_confidence || 0.5,
    ai_confidence: summary.ai_confidence || summary.confidence_score || 0.5
  };
}

function mapWorldBuildingFields(worldElement: any): any {
  return {
    name: worldElement.name || 'Unnamed World Element',
    type: worldElement.type || 'general',
    description: worldElement.description || null,
    significance: worldElement.significance || null,
    details: worldElement.details || {},
    ai_confidence: worldElement.ai_confidence || worldElement.confidence_score || 0.8
  };
}

function mapThemeFields(theme: any): any {
  return {
    name: theme.name || 'Unnamed Theme',
    type: theme.type || 'general',
    exploration_summary: theme.exploration_summary || theme.description || null,
    key_moments_or_characters: Array.isArray(theme.key_moments_or_characters) ? theme.key_moments_or_characters : [],
    significance: theme.significance || null,
    ai_confidence: theme.ai_confidence || theme.confidence_score || 0.7
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

    return parseAIResponse(aiResponse, extractionType, language);
  } catch (error) {
    logExtraction('EXTRACTION_ERROR', { error: error.message });
    throw error;
  }
}

// Chronological coordination function for post-processing
async function coordinateChronology(extractedData: any, projectId: string) {
  try {
    logExtraction('CHRONOLOGICAL_COORDINATION_START', { projectId });

    // Analyze temporal markers in all extracted data
    const allElements = [
      ...extractedData.characters.map((item: any) => ({ ...item, type: 'character' })),
      ...extractedData.relationships.map((item: any) => ({ ...item, type: 'relationship' })),
      ...extractedData.plotThreads.map((item: any) => ({ ...item, type: 'plot_thread' })),
      ...extractedData.timelineEvents.map((item: any) => ({ ...item, type: 'timeline_event' })),
      ...extractedData.plotPoints.map((item: any) => ({ ...item, type: 'plot_point' })),
      ...extractedData.chapterSummaries.map((item: any) => ({ ...item, type: 'chapter_summary' })),
      ...extractedData.worldBuilding.map((item: any) => ({ ...item, type: 'world_building' })),
      ...extractedData.themes.map((item: any) => ({ ...item, type: 'theme' }))
    ];

    // Sort elements by chronological order and assign coordination
    allElements.sort((a, b) => {
      const aOrder = a.chronological_order || 0;
      const bOrder = b.chronological_order || 0;
      return aOrder - bOrder;
    });

    // Reassign chronological order based on sorted sequence
    allElements.forEach((element, index) => {
      element.chronological_order = index + 1;
      element.chronological_confidence = element.chronological_confidence || 0.5;
    });

    logExtraction('CHRONOLOGICAL_COORDINATION_SUCCESS', { 
      elementsCoordinated: allElements.length 
    });

    return allElements;
  } catch (error) {
    logExtraction('CHRONOLOGICAL_COORDINATION_ERROR', { error: error.message });
    return [];
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
    worldBuilding: [],
    themes: [],
    extractionStats: {
      charactersExtracted: 0,
      relationshipsExtracted: 0,
      plotThreadsExtracted: 0,
      timelineEventsExtracted: 0,
      plotPointsExtracted: 0,
      chapterSummariesExtracted: 0,
      worldBuildingExtracted: 0,
      themesExtracted: 0,
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

  // Step 6: Extract Chapter Summaries (narrative overview)
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

  // Step 7: Extract World Building Elements
  try {
    results.extractionStats.totalAttempts++;
    const worldBuildingResult = await extractWithAI(content, 'worldBuilding', language);
    
    if (worldBuildingResult.worldBuilding && worldBuildingResult.worldBuilding.length > 0) {
      results.worldBuilding = worldBuildingResult.worldBuilding.map(mapWorldBuildingFields);
      results.extractionStats.worldBuildingExtracted = results.worldBuilding.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('WORLDBUILDING_SUCCESS', { count: results.worldBuilding.length });
    }
  } catch (error) {
    logExtraction('WORLDBUILDING_ERROR', { error: error.message });
  }

  // Step 8: Extract Themes
  try {
    results.extractionStats.totalAttempts++;
    const themesResult = await extractWithAI(content, 'themes', language);
    
    if (themesResult.themes && themesResult.themes.length > 0) {
      results.themes = themesResult.themes.map(mapThemeFields);
      results.extractionStats.themesExtracted = results.themes.length;
      results.extractionStats.successfulExtractions++;
      logExtraction('THEMES_SUCCESS', { count: results.themes.length });
    }
  } catch (error) {
    logExtraction('THEMES_ERROR', { error: error.message });
  }

  return results;
}

// Post-processing function to apply chronological coordination
async function applyChronologicalCoordination(extractionResults: any, projectId: string) {
  try {
    logExtraction('POST_PROCESSING_START', { projectId });

    // Coordinate chronological order across all elements
    const coordinatedElements = await coordinateChronology(extractionResults, projectId);
    
    // Group coordinated elements back by type
    const updatedResults = { ...extractionResults };
    
    coordinatedElements.forEach((element: any) => {
      switch (element.type) {
        case 'character':
          const charIndex = updatedResults.characters.findIndex((c: any) => c.name === element.name);
          if (charIndex >= 0) {
            updatedResults.characters[charIndex] = { ...element };
            delete updatedResults.characters[charIndex].type;
          }
          break;
        case 'relationship':
          const relIndex = updatedResults.relationships.findIndex((r: any) => 
            r.character_a_name === element.character_a_name && r.character_b_name === element.character_b_name
          );
          if (relIndex >= 0) {
            updatedResults.relationships[relIndex] = { ...element };
            delete updatedResults.relationships[relIndex].type;
          }
          break;
        case 'plot_thread':
          const threadIndex = updatedResults.plotThreads.findIndex((t: any) => t.thread_name === element.thread_name);
          if (threadIndex >= 0) {
            updatedResults.plotThreads[threadIndex] = { ...element };
            delete updatedResults.plotThreads[threadIndex].type;
          }
          break;
        case 'timeline_event':
          const eventIndex = updatedResults.timelineEvents.findIndex((e: any) => e.event_summary === element.event_summary);
          if (eventIndex >= 0) {
            updatedResults.timelineEvents[eventIndex] = { ...element };
            delete updatedResults.timelineEvents[eventIndex].type;
          }
          break;
        case 'plot_point':
          const pointIndex = updatedResults.plotPoints.findIndex((p: any) => p.name === element.name);
          if (pointIndex >= 0) {
            updatedResults.plotPoints[pointIndex] = { ...element };
            delete updatedResults.plotPoints[pointIndex].type;
          }
          break;
        case 'chapter_summary':
          const summaryIndex = updatedResults.chapterSummaries.findIndex((s: any) => s.title === element.title);
          if (summaryIndex >= 0) {
            updatedResults.chapterSummaries[summaryIndex] = { ...element };
            delete updatedResults.chapterSummaries[summaryIndex].type;
          }
          break;
      }
    });

    logExtraction('POST_PROCESSING_SUCCESS', { 
      coordinatedElements: coordinatedElements.length 
    });

    return updatedResults;
  } catch (error) {
    logExtraction('POST_PROCESSING_ERROR', { error: error.message });
    return extractionResults; // Return original results if coordination fails
  }
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

    // Check content similarity using embeddings before extraction
    if (projectId && chapterId) {
      console.log('🔍 Checking content similarity using embeddings...');
      
      try {
        // Generate embedding for content
        const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY');
        const embeddingResponse = await fetch(`${GOOGLE_AI_URL}?key=${googleAIKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: content }] }
          })
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          if (embeddingData.embedding?.values) {
            const embeddingString = `[${embeddingData.embedding.values.join(',')}]`;
            
            // Check for similar content
            const { data: similarChunks, error: similarError } = await supabase.rpc('match_semantic_chunks', {
              query_embedding: embeddingString,
              match_threshold: 0.85,
              match_count: 5,
              filter_project_id: projectId
            });

            if (!similarError && similarChunks && similarChunks.length > 0) {
              const topSimilarity = similarChunks[0].similarity;
              console.log(`📊 Found ${similarChunks.length} similar chunks, top similarity: ${topSimilarity}`);
              
              if (topSimilarity > 0.9) {
                console.log('⏭️ Content is too similar to existing chunks - skipping extraction');
                return new Response(JSON.stringify({
                  success: true,
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
                    confidence: 1,
                    issues: [],
                    method: 'embeddings_similarity_skip'
                  },
                  processingTime: 0,
                  message: `Content skipped due to high similarity (${topSimilarity}) with existing analyzed content`
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              } else if (topSimilarity > 0.8) {
                console.log('🔄 Similar content found - will apply enhanced deduplication after extraction');
              }
            }
          }
        }
      } catch (embeddingError) {
        console.warn('⚠️ Embeddings similarity check failed, proceeding with extraction:', embeddingError);
      }
    }

    // Perform comprehensive extraction
    const extractionResults = await performComprehensiveExtraction(content, language);
    
    // Final language validation - reject entire result if language mixing detected
    const languageValid = validateExtractedLanguage(extractionResults, language);
    if (!languageValid) {
      logExtraction('FINAL_LANGUAGE_VALIDATION_FAILED', {
        language,
        message: 'Entire extraction rejected due to language mixing'
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: `Language mixing detected. Expected ${language} content only, but found mixed languages.`,
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
          issues: [`Language mixing detected - expected ${language} only`],
          method: 'language_validation_rejection'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Apply chronological coordination post-processing
    const coordinatedResults = await applyChronologicalCoordination(extractionResults, projectId);
    
    logExtraction('EXTRACTION_COMPLETE', {
      stats: coordinatedResults.extractionStats,
      charactersFound: coordinatedResults.characters.length,
      relationshipsFound: coordinatedResults.relationships.length,
      plotThreadsFound: coordinatedResults.plotThreads.length,
      timelineEventsFound: coordinatedResults.timelineEvents.length,
      plotPointsFound: coordinatedResults.plotPoints.length,
      chapterSummariesFound: coordinatedResults.chapterSummaries.length
    });

    // Return results in the expected format
    const response = {
      success: true,
      extractedData: {
        characters: coordinatedResults.characters,
        relationships: coordinatedResults.relationships,
        plotThreads: coordinatedResults.plotThreads,
        timelineEvents: coordinatedResults.timelineEvents,
        plotPoints: coordinatedResults.plotPoints,
        worldBuilding: coordinatedResults.worldBuilding,
        themes: coordinatedResults.themes,
        chapterSummaries: coordinatedResults.chapterSummaries
      },
      storedCount: coordinatedResults.characters.length + 
                   coordinatedResults.relationships.length + 
                   coordinatedResults.plotThreads.length + 
                   coordinatedResults.timelineEvents.length + 
                   coordinatedResults.plotPoints.length + 
                   coordinatedResults.chapterSummaries.length +
                   coordinatedResults.worldBuilding.length +
                   coordinatedResults.themes.length,
      storageDetails: {
        characters: coordinatedResults.characters.length,
        relationships: coordinatedResults.relationships.length,
        plotThreads: coordinatedResults.plotThreads.length,
        timelineEvents: coordinatedResults.timelineEvents.length,
        plotPoints: coordinatedResults.plotPoints.length,
        chapterSummaries: coordinatedResults.chapterSummaries.length,
        worldBuilding: coordinatedResults.worldBuilding.length,
        themes: coordinatedResults.themes.length,
        language: language,
        extractionStats: coordinatedResults.extractionStats,
        chronologicalCoordination: true
      },
      validation: {
        confidence: coordinatedResults.extractionStats.successfulExtractions / Math.max(1, coordinatedResults.extractionStats.totalAttempts),
        issues: [],
        method: 'comprehensive_extraction_with_chronological_coordination'
      },
      processingTime: 0,
      message: `Extracted and chronologically coordinated ${coordinatedResults.characters.length} characters, ${coordinatedResults.relationships.length} relationships, ${coordinatedResults.plotThreads.length} plot threads, ${coordinatedResults.timelineEvents.length} timeline events, ${coordinatedResults.plotPoints.length} plot points, and ${coordinatedResults.chapterSummaries.length} chapter summaries`
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
