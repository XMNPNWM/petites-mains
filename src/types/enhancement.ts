// Novel Enhancement System Types
export interface EnhancementOptions {
  enhancementLevel: 'light' | 'moderate' | 'comprehensive';
  preserveAuthorVoice: boolean;
  applyGrammarFixes: boolean;
  applyPunctuationFixes: boolean;
  applyFormattingFixes: boolean;
  improveReadability: boolean;
  improveStyle: boolean;
  // Style sub-options
  improveShowVsTell?: boolean;
  refinePacing?: boolean;
  enhanceCharacterVoice?: boolean;
  addSensoryDetails?: boolean;
}

export interface NovelStandards {
  punctuation: PunctuationRules;
  dialogue: DialogueRules;
  formatting: FormattingRules;
  readability: ReadabilityMetrics;
  style: StyleGuidelines;
}

export interface PunctuationRules {
  dialogue: {
    quotationMarks: 'double' | 'single';
    punctuationInside: boolean;
    emDashForInterruption: boolean;
    ellipsesForTrailing: boolean;
  };
  general: {
    oxfordComma: boolean;
    emDashSpacing: boolean;
    ellipsesSpacing: boolean;
  };
}

export interface DialogueRules {
  formatting: {
    newParagraphPerSpeaker: boolean;
    indentDialogue: boolean;
    spacingBetweenParagraphs: number;
  };
  punctuation: {
    commaBeforeDialogueTag: boolean;
    periodWhenNoTag: boolean;
    actionBeatsSeparate: boolean;
  };
  style: {
    maxDialogueLength: number;
    showDontTell: boolean;
    characterVoiceConsistency: boolean;
  };
}

export interface FormattingRules {
  typography: {
    font: string;
    fontSize: number;
    lineSpacing: number;
    justification: 'left' | 'justified';
  };
  paragraphs: {
    indentation: number;
    spacing: number;
    orphanWidowControl: boolean;
  };
  chapters: {
    startOnNewPage: boolean;
    titleFormatting: string;
    numbering: 'numeric' | 'roman' | 'word';
  };
}

export interface ReadabilityMetrics {
  fleschKincaid: {
    targetGradeLevel: number;
    maxGradeLevel: number;
    minReadingEase: number;
  };
  sentenceStructure: {
    averageLength: number;
    maxLength: number;
    complexSentenceRatio: number;
  };
  vocabulary: {
    averageWordLength: number;
    passiveVoiceRatio: number;
    uncommonWordRatio: number;
  };
}

export interface StyleGuidelines {
  showVsTell: {
    actionToDescriptionRatio: number;
    sensoryDetails: boolean;
    emotionalShow: boolean;
  };
  pacing: {
    dialogueRatio: number;
    actionRatio: number;
    descriptionRatio: number;
  };
  characterization: {
    consistentVoice: boolean;
    distinctiveDialogue: boolean;
    believableActions: boolean;
  };
}

export interface QualityMetrics {
  fleschKincaid: number;
  readingEase: number;
  avgSentenceLength: number;
  avgWordLength: number;
  passiveVoice: number;
  dialogueRatio: number;
  complexSentenceRatio: number;
  uncommonWordRatio: number;
  showVsTellRatio: number;
  characterConsistency: number;
}

export interface TrackedChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  category: ChangeCategory;
  originalText: string;
  enhancedText: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
  reasoning: string;
  approved?: boolean;
}

export type ChangeCategory = 
  | 'punctuation'
  | 'dialogue'
  | 'grammar'
  | 'style'
  | 'readability'
  | 'structure'
  | 'character_voice'
  | 'show_vs_tell'
  | 'pacing'
  | 'other';

export interface EnhancementResult {
  success: boolean;
  enhancedContent?: string;
  changes?: TrackedChange[];
  metricsImprovement?: MetricsImprovement;
  error?: string;
}

export interface MetricsImprovement {
  readabilityImprovement: number;
  dialogueImprovement: number;
  styleImprovement: number;
  grammarImprovement: number;
  overallScore: number;
}