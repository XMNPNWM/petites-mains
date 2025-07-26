
import React from 'react';
import { Eye } from 'lucide-react';
import ChangeItem from './ChangeItem';

import { AIChange } from '@/types/shared';

interface ChangeListProps {
  changes: AIChange[];
  loading: boolean;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onChangeClick: (change: AIChange) => void;
  selectedChangeId?: string | null;
}

const ChangeList = ({ changes, loading, onChangeDecision, onChangeClick, selectedChangeId }: ChangeListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No changes to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <ChangeItem
          key={change.id}
          change={change}
          onDecision={onChangeDecision}
          onClick={onChangeClick}
          isSelected={change.id === selectedChangeId}
        />
      ))}
    </div>
  );
};

export default ChangeList;
