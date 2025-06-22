
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit, MessageSquare, Type, Palette } from 'lucide-react';

interface AIChange {
  id: string;
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  confidence_score: number;
}

interface ChangeItemProps {
  change: AIChange;
  onDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onClick: (change: AIChange) => void;
}

const ChangeItem = ({ change, onDecision, onClick }: ChangeItemProps) => {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'structure':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'dialogue':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'style':
        return <Palette className="w-4 h-4 text-orange-500" />;
      default:
        return <Type className="w-4 h-4 text-slate-500" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'bg-blue-100 text-blue-700';
      case 'structure':
        return 'bg-green-100 text-green-700';
      case 'dialogue':
        return 'bg-purple-100 text-purple-700';
      case 'style':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleDecision = async (decision: 'accepted' | 'rejected', e: React.MouseEvent) => {
    e.stopPropagation();
    onDecision(change.id, decision);
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        change.user_decision === 'accepted'
          ? 'bg-green-50 border-green-200'
          : change.user_decision === 'rejected'
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
      onClick={() => onClick(change)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getChangeIcon(change.change_type)}
          <Badge 
            variant="secondary" 
            className={`text-xs px-2 py-1 ${getChangeColor(change.change_type)}`}
          >
            {change.change_type}
          </Badge>
        </div>
        <div className="text-xs text-slate-500">
          {Math.round(change.confidence_score * 100)}% confident
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium text-red-600">Original: </span>
          <span className="text-slate-700">{change.original_text}</span>
        </div>
        <div>
          <span className="font-medium text-green-600">Enhanced: </span>
          <span className="text-slate-700">{change.enhanced_text}</span>
        </div>
      </div>
      
      {change.user_decision === 'pending' && (
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleDecision('accepted', e)}
            className="flex items-center space-x-1 text-green-600 hover:bg-green-50"
          >
            <Check className="w-3 h-3" />
            <span>Accept</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleDecision('rejected', e)}
            className="flex items-center space-x-1 text-red-600 hover:bg-red-50"
          >
            <X className="w-3 h-3" />
            <span>Reject</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChangeItem;
