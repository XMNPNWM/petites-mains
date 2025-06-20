
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Replace } from 'lucide-react';

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFindReplace: (findText: string, replaceText: string, replaceAll: boolean) => void;
}

const FindReplaceDialog = ({ isOpen, onClose, onFindReplace }: FindReplaceDialogProps) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleFindNext = () => {
    if (findText.trim()) {
      onFindReplace(findText, replaceText, false);
    }
  };

  const handleReplaceAll = () => {
    if (findText.trim()) {
      onFindReplace(findText, replaceText, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFindNext();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Find & Replace
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="find-text">Find text</Label>
            <Input
              id="find-text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter text to find..."
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="replace-text">Replace with</Label>
            <Input
              id="replace-text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter replacement text..."
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleFindNext} disabled={!findText.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Find Next
            </Button>
            <Button onClick={handleReplaceAll} disabled={!findText.trim()}>
              <Replace className="w-4 h-4 mr-2" />
              Replace All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindReplaceDialog;
