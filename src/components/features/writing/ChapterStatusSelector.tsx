
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ChapterStatusSelectorProps {
  status: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'outline', label: 'Outline', color: 'bg-gray-100 text-gray-700' },
  { value: 'first-draft', label: 'First Draft', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'editing', label: 'Editing', color: 'bg-orange-100 text-orange-700' },
  { value: 'final', label: 'Final', color: 'bg-blue-100 text-blue-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' } // Legacy support
];

const ChapterStatusSelector = ({ status, onStatusChange, disabled }: ChapterStatusSelectorProps) => {
  const currentStatus = statusOptions.find(s => s.value === status) || statusOptions[0];

  return (
    <Select value={status} onValueChange={onStatusChange} disabled={disabled}>
      <SelectTrigger className="w-[120px] h-6 text-xs">
        <SelectValue>
          <Badge className={`text-xs px-2 py-0.5 ${currentStatus.color}`}>
            {currentStatus.label}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <Badge className={`text-xs px-2 py-0.5 ${option.color}`}>
              {option.label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChapterStatusSelector;
