import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChapterStatusSelectorProps {
  currentStatus: string;
  onChange: (status: string) => void;
  className?: string;
}

const statusOptions = [
  { value: 'outline', label: 'Outline', color: 'bg-gray-100 text-gray-700' },
  { value: 'first-draft', label: 'First Draft', color: 'bg-blue-100 text-blue-700' },
  { value: 'editing', label: 'Editing', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'review', label: 'Review', color: 'bg-orange-100 text-orange-700' },
  { value: 'final', label: 'Final', color: 'bg-purple-100 text-purple-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  // Keep legacy statuses for backward compatibility
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700' }
];

const ChapterStatusSelector = ({ currentStatus, onChange, className }: ChapterStatusSelectorProps) => {
  const currentStatusOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  return (
    <Select value={currentStatus} onValueChange={onChange}>
      <SelectTrigger className={`h-6 w-auto min-w-[80px] px-2 py-0.5 text-xs ${currentStatusOption.color} border-none ${className}`}>
        <SelectValue>
          <span className="text-xs">{currentStatusOption.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${option.color.replace('text-', 'bg-').split(' ')[0]}`} />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChapterStatusSelector;
