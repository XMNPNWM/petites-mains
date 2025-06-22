
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ImportButtonProps {
  onImportToCreation: () => void;
}

const ImportButton = ({ onImportToCreation }: ImportButtonProps) => {
  return (
    <div className="flex items-center justify-center w-8 bg-slate-100 border-x border-slate-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={onImportToCreation}
        className="p-1 h-auto"
        title="Import to Creation Editor"
      >
        <ArrowLeft className="w-4 h-4 text-purple-600" />
      </Button>
    </div>
  );
};

export default ImportButton;
