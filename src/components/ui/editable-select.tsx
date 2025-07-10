
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Check, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface EditableSelectProps {
  value: string;
  options: string[];
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  options,
  onSave,
  placeholder = "Select or enter custom...",
  maxLength = 200,
  className = "",
  variant = "secondary"
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showCustomInput]);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setShowCustomInput(false);
      return;
    }

    // Validate custom value length
    if (editValue.trim().length > maxLength) {
      return; // Could add error toast here
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setShowCustomInput(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setShowCustomInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSaveWithValue = async (newValue: string) => {
    if (newValue === value) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show custom input mode
  if (showCustomInput) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="flex-1 text-xs"
          placeholder="Enter custom type..."
          disabled={isSaving}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving || editValue.trim().length === 0}
          className="h-6 w-6 p-0"
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    );
  }

  // Show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant={variant} 
          className={`text-xs cursor-pointer hover:opacity-80 ${className}`}
        >
          {value}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 z-50 bg-white dark:bg-gray-800 border shadow-md">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => handleSaveWithValue(option)}
            className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {option}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => {
            setEditValue('');
            setShowCustomInput(true);
          }}
          className="text-xs font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Custom...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
