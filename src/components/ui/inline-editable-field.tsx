
import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Button } from './button';
import { Check, X, Edit3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InlineEditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  fieldName?: string;
}

const InlineEditableField = ({ 
  value, 
  onSave, 
  placeholder = "Click to edit...", 
  multiline = false,
  maxLength = 500,
  className = "text-slate-600",
  fieldName = "field"
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
      toast({
        title: "Saved",
        description: `${fieldName} updated successfully. Confidence set to 100%.`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving:', error);
      setEditValue(value); // Rollback
      toast({
        title: "Error",
        description: `Failed to update ${fieldName}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    
    return (
      <div className="flex items-start space-x-2">
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="flex-1"
          disabled={isSaving}
          placeholder={placeholder}
          rows={multiline ? 3 : undefined}
        />
        <div className="flex space-x-1 mt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} cursor-pointer hover:bg-slate-50 px-2 py-1 rounded group flex items-center justify-between min-h-[32px]`}
      onClick={() => setIsEditing(true)}
    >
      <span className={multiline ? "whitespace-pre-wrap" : ""}>{value || placeholder}</span>
      <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity ml-2 flex-shrink-0" />
    </div>
  );
};

export default InlineEditableField;
