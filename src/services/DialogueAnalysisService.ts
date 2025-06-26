
export interface DialogueSpeaker {
  name: string;
  confidence: number;
  utterances: number;
  firstAppearance: number;
  lastAppearance: number;
}

export interface DialogueSegment {
  text: string;
  speaker?: string;
  confidence: number;
  start: number;
  end: number;
}

export class DialogueAnalysisService {
  private static readonly DIALOGUE_PATTERNS = {
    // Various quote patterns
    quotes: [
      /"([^"]+)"/g,           // Double quotes
      /'([^']+)'/g,           // Single quotes  
      /«([^»]+)»/g,           // French quotes
      /„([^"]+)"/g            // German quotes
    ],
    
    // Speech tags
    speechTags: [
      /(?:he|she|they|[A-Z][a-z]+)\s+(?:said|asked|replied|whispered|shouted|exclaimed|murmured|declared|announced)/gi,
      /(?:said|asked|replied|whispered|shouted|exclaimed|murmured|declared|announced)\s+(?:he|she|they|[A-Z][a-z]+)/gi
    ],

    // Speaker attribution patterns
    speakerPatterns: [
      /([A-Z][a-z]+)\s+(?:said|asked|replied|whispered|shouted|exclaimed)/gi,
      /(?:said|asked|replied|whispered|shouted|exclaimed)\s+([A-Z][a-z]+)/gi,
      /"[^"]*",?\s*([A-Z][a-z]+)\s+(?:said|asked|replied)/gi
    ]
  };

  /**
   * Detect dialogue in text
   */
  static detectDialogue(text: string): boolean {
    // Check for quoted speech
    for (const pattern of this.DIALOGUE_PATTERNS.quotes) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // Check for speech tags
    for (const pattern of this.DIALOGUE_PATTERNS.speechTags) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract dialogue segments from text
   */
  static extractDialogueSegments(text: string): DialogueSegment[] {
    const segments: DialogueSegment[] = [];

    // Extract quoted dialogue
    this.DIALOGUE_PATTERNS.quotes.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        segments.push({
          text: match[1] || match[0],
          confidence: 0.9,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });

    return segments.sort((a, b) => a.start - b.start);
  }

  /**
   * Identify speakers in dialogue
   */
  static identifySpeakers(text: string): DialogueSpeaker[] {
    const speakerCounts: Map<string, DialogueSpeaker> = new Map();

    // Extract speakers using various patterns
    this.DIALOGUE_PATTERNS.speakerPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const speakerName = match[1];
        if (speakerName && speakerName.length > 1 && /^[A-Z]/.test(speakerName)) {
          const existing = speakerCounts.get(speakerName);
          if (existing) {
            existing.utterances++;
            existing.lastAppearance = match.index;
            existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
          } else {
            speakerCounts.set(speakerName, {
              name: speakerName,
              confidence: 0.7,
              utterances: 1,
              firstAppearance: match.index,
              lastAppearance: match.index
            });
          }
        }
      }
    });

    // Convert to array and sort by confidence
    return Array.from(speakerCounts.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze dialogue density in text
   */
  static analyzeDialogueDensity(text: string): number {
    const dialogueSegments = this.extractDialogueSegments(text);
    const totalDialogueLength = dialogueSegments.reduce(
      (sum, segment) => sum + segment.text.length, 0
    );
    
    return totalDialogueLength / Math.max(text.length, 1);
  }

  /**
   * Detect dialogue transitions (narrative to dialogue or speaker changes)
   */
  static detectDialogueTransitions(
    previousText: string,
    currentText: string
  ): number {
    const prevHasDialogue = this.detectDialogue(previousText);
    const currHasDialogue = this.detectDialogue(currentText);
    const prevSpeakers = this.identifySpeakers(previousText);
    const currSpeakers = this.identifySpeakers(currentText);

    let transitionScore = 0;

    // Narrative to dialogue or vice versa
    if (prevHasDialogue !== currHasDialogue) {
      transitionScore += 3;
    }

    // Speaker changes
    if (prevSpeakers.length > 0 && currSpeakers.length > 0) {
      const prevSpeakerNames = new Set(prevSpeakers.map(s => s.name));
      const currSpeakerNames = new Set(currSpeakers.map(s => s.name));
      
      // Check for new speakers
      const newSpeakers = currSpeakers.filter(s => !prevSpeakerNames.has(s.name));
      transitionScore += newSpeakers.length * 2;
    }

    return Math.min(transitionScore, 10);
  }

  /**
   * Extract character names from dialogue context
   */
  static extractCharacterNames(text: string): string[] {
    const speakers = this.identifySpeakers(text);
    return speakers
      .filter(speaker => speaker.confidence > 0.6)
      .map(speaker => speaker.name);
  }

  /**
   * Analyze conversation flow
   */
  static analyzeConversationFlow(text: string): {
    hasDialogue: boolean;
    speakerCount: number;
    dialogueDensity: number;
    primarySpeakers: string[];
  } {
    const hasDialogue = this.detectDialogue(text);
    const speakers = this.identifySpeakers(text);
    const dialogueDensity = this.analyzeDialogueDensity(text);
    
    return {
      hasDialogue,
      speakerCount: speakers.length,
      dialogueDensity,
      primarySpeakers: speakers.slice(0, 3).map(s => s.name)
    };
  }
}
