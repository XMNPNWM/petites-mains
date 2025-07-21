
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Info, AlertTriangle, Brain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancementOptions } from '@/types/enhancement';
import { CreditWarning } from '@/components/features/ai/CreditWarning';
import { useUserCreditStatus } from '@/hooks/useUserCreditStatus';
import { CREDIT_COSTS } from '@/utils/creditUtils';
import { AIBrainValidationResult } from '@/utils/aiBrainValidation';

interface EnhancementOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: EnhancementOptions) => void;
  isProcessing?: boolean;
  aiBrainValidation?: AIBrainValidationResult;
  projectId?: string;
}

const EnhancementOptionsDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
  aiBrainValidation,
  projectId
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

  const canEnhance = aiBrainValidation?.isValid && 
                    creditStatus && 
                    creditStatus.credits_remaining >= CREDIT_COSTS.ENHANCEMENT;

  const handleSubmit = () => {
    if (!canEnhance) return;
    
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

          {/* AI Brain Data Validation Warning */}
          {aiBrainValidation && !aiBrainValidation.isValid && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="space-y-2">
                  <p className="font-medium">Enhancement requires analysis data</p>
                  <p className="text-sm">
                    To provide high-quality enhancements, AI needs to understand your story context. 
                    Please analyze your content in the Creation Space first.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Missing requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {aiBrainValidation.missingRequirements.map((requirement, index) => (
                        <li key={index} className="text-amber-700">{requirement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* AI Brain Data Status (when valid) */}
          {aiBrainValidation && aiBrainValidation.isValid && (
            <Alert className="border-green-200 bg-green-50">
              <Brain className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Brain Data Ready</p>
                    <p className="text-sm">
                      {aiBrainValidation.totalDataPoints} analysis data points available for enhancement
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
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
              disabled={isProcessing || !canEnhance}
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
