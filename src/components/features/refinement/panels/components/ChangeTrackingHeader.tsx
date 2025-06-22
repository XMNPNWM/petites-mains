
import React from 'react';
import { Eye } from 'lucide-react';

interface ChangeTrackingHeaderProps {
  changesCount: number;
}

const ChangeTrackingHeader = ({ changesCount }: ChangeTrackingHeaderProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2">
        <Eye className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-700">Change Tracking</h3>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {changesCount} AI suggestions
      </p>
    </div>
  );
};

export default ChangeTrackingHeader;
