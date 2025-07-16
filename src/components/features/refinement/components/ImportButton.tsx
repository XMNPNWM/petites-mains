
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ImportButtonProps {
  onImportToCreation: () => Promise<void>;
  isDisabled?: boolean;
}

const ImportButton = ({ onImportToCreation, isDisabled = false }: ImportButtonProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImportToCreation();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-8 bg-slate-100 border-x border-slate-200">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            title="Import to Creation Editor"
            disabled={isDisabled || isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4 text-purple-600" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Enhanced Content</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current chapter content with the enhanced version. 
              A backup of your current content will be automatically created and can be 
              restored from the history if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import to Creation Space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportButton;
