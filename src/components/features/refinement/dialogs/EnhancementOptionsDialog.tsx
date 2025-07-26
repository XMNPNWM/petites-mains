import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Info, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancementOptions } from '@/types/enhancement';
import { CreditWarning } from '@/components/features/ai/CreditWarning';
import { useUserCreditStatus } from '@/hooks/useUserCreditStatus';
import { CREDIT_COSTS } from '@/utils/creditUtils';
import { EnhancementDataValidator, ValidationResult } from '@/services/EnhancementDataValidator';

interface EnhancementOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: EnhancementOptions) => void;
  isProcessing?: boolean;
  projectId?: string;
  chapterId?: string;
}

const EnhancementOptionsDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
  projectId,
  chapterId
}: EnhancementOptionsDialogProps) => {
  const [enhancementLevel, setEnhancementLevel] = useState<'light' | 'moderate' | 'comprehensive'>('moderate');
  const [preserveAuthorVoice, setPreserveAuthorVoice] = useState(true);
  const [applyGrammarFixes, setApplyGrammarFixes] = useState(true);
  const [applyPunctuationFixes, setApplyPunctuationFixes] = useState(true);
  const [applyFormattingFixes, setApplyFormattingFixes] = useState(true);
  const [improveReadability, setImproveReadability] = useState(true);
  const [improveStyle, setImproveStyle] = useState(false);
  
  const { creditStatus, loading: creditsLoading } = useUserCreditStatus();
  
  // Style sub-options
  const [improveShowVsTell, setImproveShowVsTell] = useState(true);
  const [refinePacing, setRefinePacing] = useState(true);
  const [enhanceCharacterVoice, setEnhanceCharacterVoice] = useState(true);
  const [addSensoryDetails, setAddSensoryDetails] = useState(true);

  // Enhancement validation
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validate requirements when dialog opens
  useEffect(() => {
    if (isOpen && projectId && chapterId) {
      setIsValidating(true);
      const validator = new EnhancementDataValidator(projectId, chapterId);
      validator.validateEnhancementRequirements()
        .then(setValidationResult)
        .catch(error => {
          console.error('Validation error:', error);
          setValidationResult(null);
        })
        .finally(() => setIsValidating(false));
    }
  }, [isOpen, projectId, chapterId]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'worldbuilding':
        window.open(`/project/${projectId}#worldbuilding`, '_blank');
        break;
      case 'writing':
        window.open(`/project/${projectId}/write/${chapterId}`, '_blank');
        break;
      case 'analyze':
        window.open(`/project/${projectId}`, '_blank');
        break;
    }
  };

  const canSubmit = () => {
    // Check credit requirements
    const hasCredits = !creditStatus || creditStatus.credits_remaining >= CREDIT_COSTS.ENHANCEMENT;
    
    // Check validation requirements
    const meetsValidation = !validationResult || validationResult.isValid;
    
    return hasCredits && meetsValidation && !isProcessing;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const options: EnhancementOptions = {
      enhancementLevel,
      preserveAuthorVoice,
      applyGrammarFixes,
      applyPunctuationFixes,
      applyFormattingFixes,
      improveReadability,
      improveStyle,
      ...(improveStyle && {
        improveShowVsTell,
        refinePacing,
        enhanceCharacterVoice,
        addSensoryDetails
      })
    };
    
    onSubmit(options);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Enhance Chapter Options
            </DialogTitle>
          </DialogHeader>

          {/* Enhancement Requirements Validation */}
          {isValidating && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Checking enhancement requirements...
              </div>
            </div>
          )}

          {validationResult && !isValidating && (
            <div className="mt-4">
              <div className={`p-4 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {validationResult.isValid ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <h4 className="font-medium text-sm">
                    {validationResult.isValid ? 'Ready for Enhancement' : 'Requirements Not Met'}
                  </h4>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {validationResult.totalScore}/{validationResult.maxScore}
                  </div>
                </div>

                {!validationResult.isValid && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Enhancement works best with sufficient project data. Complete the requirements below for optimal results.
                  </p>
                )}

                <div className="space-y-3">
                  {validationResult.requirements.map((req, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {req.met ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          <span className="text-sm font-medium">{req.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {req.current}/{req.required}
                        </span>
                      </div>
                      
                      <Progress 
                        value={(req.current / req.required) * 100} 
                        className="h-2"
                      />
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{req.message}</p>
                        {req.actionButton && !req.met && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleActionClick(req.actionButton!.action)}
                          >
                            {req.actionButton.text}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Credit Warning */}
          {!creditsLoading && creditStatus && (
            <div className="mt-4">
              <CreditWarning 
                operation="ENHANCEMENT" 
                remainingCredits={creditStatus.credits_remaining}
                onUpgrade={() => window.open('/subscription', '_blank')}
              />
            </div>
          )}

          <div className="space-y-6 py-4">
            {/* Overall Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Overall Level</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the intensity of enhancement. Light focuses on basic fixes, Moderate balances corrections with style, Comprehensive applies extensive refinements.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <RadioGroup value={enhancementLevel} onValueChange={(value: any) => setEnhancementLevel(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="text-sm">Light (minimal fixes)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="text-sm font-medium">Moderate (recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comprehensive" id="comprehensive" />
                  <Label htmlFor="comprehensive" className="text-sm">Comprehensive (more stylistic changes)</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Specific Improvements */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Specific Improvements</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">These options override and fine-tune the Overall Level selection above.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="grammar" 
                    checked={applyGrammarFixes} 
                    onCheckedChange={(checked) => setApplyGrammarFixes(!!checked)}
                  />
                  <Label htmlFor="grammar" className="text-sm">Fix Grammar (e.g., subject-verb agreement, common errors)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="punctuation" 
                    checked={applyPunctuationFixes} 
                    onCheckedChange={(checked) => setApplyPunctuationFixes(!!checked)}
                  />
                  <Label htmlFor="punctuation" className="text-sm">Fix Punctuation (e.g., Oxford commas, correct quote marks)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="formatting" 
                    checked={applyFormattingFixes} 
                    onCheckedChange={(checked) => setApplyFormattingFixes(!!checked)}
                  />
                  <Label htmlFor="formatting" className="text-sm">Apply Formatting (e.g., paragraph indents, line spacing)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="readability" 
                    checked={improveReadability} 
                    onCheckedChange={(checked) => setImproveReadability(!!checked)}
                  />
                  <Label htmlFor="readability" className="text-sm">Improve Readability (e.g., simplify complex sentences, reduce jargon)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="style" 
                    checked={improveStyle} 
                    onCheckedChange={(checked) => setImproveStyle(!!checked)}
                  />
                  <Label htmlFor="style" className="text-sm">Enhance Style/Rephrasing (e.g., show vs. tell, pacing, character voice, sensory details)</Label>
                </div>
              </div>

              {/* Style Sub-options */}
              {improveStyle && (
                <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showTell" 
                      checked={improveShowVsTell} 
                      onCheckedChange={(checked) => setImproveShowVsTell(!!checked)}
                    />
                    <Label htmlFor="showTell" className="text-sm">Improve "Show, Don't Tell"</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pacing" 
                      checked={refinePacing} 
                      onCheckedChange={(checked) => setRefinePacing(!!checked)}
                    />
                    <Label htmlFor="pacing" className="text-sm">Refine Pacing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="characterVoice" 
                      checked={enhanceCharacterVoice} 
                      onCheckedChange={(checked) => setEnhanceCharacterVoice(!!checked)}
                    />
                    <Label htmlFor="characterVoice" className="text-sm">Enhance Character Voice Consistency</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sensoryDetails" 
                      checked={addSensoryDetails} 
                      onCheckedChange={(checked) => setAddSensoryDetails(!!checked)}
                    />
                    <Label htmlFor="sensoryDetails" className="text-sm">Add Sensory Details</Label>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Preserve Author Voice */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserveVoice" 
                  checked={preserveAuthorVoice} 
                  onCheckedChange={(checked) => setPreserveAuthorVoice(!!checked)}
                />
                <Label htmlFor="preserveVoice" className="text-sm font-medium">Preserve My Author Voice (Recommended)</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Maintains your unique writing style while applying technical improvements.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmit()}
            >
              {isProcessing ? 'Enhancing...' : 'Enhance Chapter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default EnhancementOptionsDialog;