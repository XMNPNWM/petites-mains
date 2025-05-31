
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChapterStatusSelectorProps {
  status: string;
  onStatusChange: (status: string) => void;
  size?: 'sm' | 'md';
}

const statusOptions = [
  { value: 'outline', label: 'Outline', color: 'bg-slate-100 text-slate-700' },
  { value: 'first-draft', label: 'First Draft', color: 'bg-blue-100 text-blue-700' },
  { value: 'editing', label: 'Editing', color: 'bg-orange-100 text-orange-700' },
  { value: 'final', label: 'Final', color: 'bg-purple-100 text-purple-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
];

const ChapterStatusSelector = ({ status, onStatusChange, size = 'sm' }: ChapterStatusSelectorProps) => {
  const currentStatus = statusOptions.find(option => option.value === status) || statusOptions[0];

  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className={`${size === 'sm' ? 'h-6 text-xs px-2' : 'h-8 text-sm px-3'} bg-white border-0 ${currentStatus.color}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
        {statusOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
          >
            <span className={`px-2 py-1 rounded text-xs ${option.color}`}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChapterStatusSelector;
