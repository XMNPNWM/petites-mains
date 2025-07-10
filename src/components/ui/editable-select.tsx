import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Check, X, Edit3, ChevronDown } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && showCustomInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, showCustomInput]);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
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
      setIsEditing(false);
      setShowCustomInput(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setShowCustomInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleOptionSelect = (option: string) => {
    if (option === 'Custom') {
      setEditValue('');
      setShowCustomInput(true);
    } else {
      setEditValue(option);
      handleSaveWithValue(option);
    }
  };

  const handleSaveWithValue = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
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
        <DropdownMenuContent align="start" className="w-48">
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleOptionSelect(option)}
              className="text-xs"
            >
              {option}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() => handleOptionSelect('Custom')}
            className="text-xs font-medium"
          >
            Custom...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant={variant} 
          className={`text-xs cursor-pointer hover:opacity-80 group ${className}`}
        >
          {value}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 z-50">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => handleSaveWithValue(option)}
            className="text-xs"
          >
            {option}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => {
            setEditValue('');
            setShowCustomInput(true);
            setIsEditing(true);
          }}
          className="text-xs font-medium"
        >
          Custom...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};