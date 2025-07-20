
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from 'lucide-react';

interface TermsAgreementDialogProps {
  open: boolean;
  onAccept: () => void;
}

const TermsAgreementDialog = ({ open, onAccept }: TermsAgreementDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>Welcome to Petites Mains!</span>
          </DialogTitle>
          <DialogDescription>
            Before you begin your writing journey, please review and accept our general conditions.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-80 pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">General Conditions</h4>
              <p className="text-muted-foreground">
                By using Petites Mains, you agree to the following basic terms:
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Your Content</h5>
              <p className="text-muted-foreground">
                You retain full ownership of all content you create using Petites Mains. We do not claim any rights to your creative work.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Data Privacy</h5>
              <p className="text-muted-foreground">
                Your writing data is stored securely and privately. We will never sell or share your personal information or creative content with third parties.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Service Usage</h5>
              <p className="text-muted-foreground">
                Use Petites Mains responsibly and in accordance with its intended purpose as a creative writing tool. Abuse or misuse of the service may result in account suspension.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">AI Assistance</h5>
              <p className="text-muted-foreground">
                Our AI features are designed to assist and enhance your writing. You maintain creative control and responsibility for all content produced.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Service Availability</h5>
              <p className="text-muted-foreground">
                While we strive for maximum uptime, we cannot guarantee uninterrupted service availability. We recommend regularly backing up your important work.
              </p>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={onAccept} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            I Accept - Let's Start Writing!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAgreementDialog;
