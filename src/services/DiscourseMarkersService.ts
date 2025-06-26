
export interface DiscourseMarker {
  text: string;
  type: 'temporal' | 'causal' | 'contrast' | 'addition' | 'narrative' | 'dialogue';
  strength: 'strong' | 'medium' | 'weak';
  position: number;
  score: number;
}

export class DiscourseMarkersService {
  private static readonly DISCOURSE_MARKERS = {
    strong: {
      temporal: [
        'meanwhile', 'later', 'afterwards', 'subsequently', 'eventually', 'finally',
        'three days later', 'the next morning', 'several weeks later', 'months later',
        'years later', 'the following day', 'that evening', 'by nightfall'
      ],
      narrative: [
        'chapter', 'part', 'section', 'book', 'epilogue', 'prologue',
        'meanwhile', 'elsewhere', 'back at', 'at the same time'
      ],
      causal: [
        'therefore', 'consequently', 'as a result', 'thus', 'hence', 'accordingly'
      ]
    },
    medium: {
      temporal: [
        'then', 'next', 'soon', 'shortly', 'immediately', 'suddenly',
        'before', 'after', 'during', 'while', 'when', 'until'
      ],
      contrast: [
        'however', 'nevertheless', 'nonetheless', 'on the other hand',
        'in contrast', 'conversely', 'alternatively', 'instead'
      ],
      addition: [
        'furthermore', 'moreover', 'additionally', 'besides', 'also',
        'in addition', 'what is more', 'not only'
      ],
      dialogue: [
        'he said', 'she said', 'they replied', 'asked', 'whispered',
        'shouted', 'murmured', 'exclaimed', 'declared', 'announced'
      ]
    },
    weak: {
      temporal: ['now', 'today', 'yesterday', 'tomorrow'],
      addition: ['and', 'or', 'but', 'so'],
      contrast: ['yet', 'still', 'though', 'although'],
      causal: ['because', 'since', 'for', 'as']
    }
  };

  /**
   * Detect discourse markers in text
   */
  static detectDiscourseMarkers(text: string): DiscourseMarker[] {
    const markers: DiscourseMarker[] = [];
    const lowerText = text.toLowerCase();

    // Check each strength level
    Object.entries(this.DISCOURSE_MARKERS).forEach(([strength, categories]) => {
      Object.entries(categories).forEach(([type, phrases]) => {
        phrases.forEach(phrase => {
          let index = 0;
          while ((index = lowerText.indexOf(phrase.toLowerCase(), index)) !== -1) {
            // Check if it's a whole word/phrase match
            const beforeChar = index > 0 ? lowerText[index - 1] : ' ';
            const afterChar = index + phrase.length < lowerText.length ? 
              lowerText[index + phrase.length] : ' ';
            
            const isWordBoundary = /\s/.test(beforeChar) && /\s|[.!?]/.test(afterChar);
            
            if (isWordBoundary) {
              markers.push({
                text: phrase,
                type: type as any,
                strength: strength as any,
                position: index,
                score: this.calculateMarkerScore(strength as any, type, phrase)
              });
            }
            
            index += phrase.length;
          }
        });
      });
    });

    // Sort by position
    return markers.sort((a, b) => a.position - b.position);
  }

  /**
   * Calculate marker score based on strength and type
   */
  private static calculateMarkerScore(
    strength: 'strong' | 'medium' | 'weak',
    type: string,
    phrase: string
  ): number {
    let baseScore = 0;
    
    switch (strength) {
      case 'strong': baseScore = 8; break;
      case 'medium': baseScore = 4; break;
      case 'weak': baseScore = 1; break;
    }

    // Boost scores for certain types
    if (type === 'temporal' && phrase.includes('later')) baseScore += 2;
    if (type === 'narrative' && phrase.includes('chapter')) baseScore += 3;
    if (type === 'dialogue') baseScore += 1;

    return Math.min(baseScore, 10);
  }

  /**
   * Analyze discourse flow between segments
   */
  static analyzeDiscourseFlow(
    previousMarkers: DiscourseMarker[],
    currentMarkers: DiscourseMarker[]
  ): number {
    // Calculate flow disruption score
    let flowScore = 0;

    // Strong temporal markers indicate major transitions
    const strongTemporalMarkers = currentMarkers.filter(
      m => m.strength === 'strong' && m.type === 'temporal'
    );
    flowScore += strongTemporalMarkers.length * 5;

    // Narrative markers indicate scene/chapter changes
    const narrativeMarkers = currentMarkers.filter(m => m.type === 'narrative');
    flowScore += narrativeMarkers.length * 6;

    // Contrast markers can indicate topic shifts
    const contrastMarkers = currentMarkers.filter(m => m.type === 'contrast');
    flowScore += contrastMarkers.length * 2;

    return Math.min(flowScore, 10);
  }

  /**
   * Get temporal markers (useful for timeline construction)
   */
  static getTemporalMarkers(markers: DiscourseMarker[]): DiscourseMarker[] {
    return markers.filter(marker => marker.type === 'temporal');
  }

  /**
   * Check if markers indicate a major scene break
   */
  static indicatesSceneBreak(markers: DiscourseMarker[]): boolean {
    const strongMarkers = markers.filter(m => m.strength === 'strong');
    const narrativeMarkers = markers.filter(m => m.type === 'narrative');
    const strongTemporalMarkers = markers.filter(
      m => m.strength === 'strong' && m.type === 'temporal'
    );

    return strongMarkers.length > 0 || 
           narrativeMarkers.length > 0 || 
           strongTemporalMarkers.length > 1;
  }
}
