import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import InlineEditableField from '@/components/ui/inline-editable-field';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { 
  Sparkles, 
  Clock, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SynthesizedEntityCardProps {
  item: any;
  onUpdateName: (id: string, value: string) => Promise<void>;
  onUpdateDescription: (id: string, value: string) => Promise<void>;
  onToggleFlag: (id: string, isFlagged: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onResynthesize?: (category: string, entityName: string) => Promise<void>;
  onViewSources?: (sourceIds: string[]) => void;
  nameFieldName?: string;
  descriptionFieldName?: string;
  namePlaceholder?: string;
  descriptionPlaceholder?: string;
}

export const SynthesizedEntityCard: React.FC<SynthesizedEntityCardProps> = ({
  item,
  onUpdateName,
  onUpdateDescription,
  onToggleFlag,
  onDelete,
  onResynthesize,
  onViewSources,
  nameFieldName = "Entity name",
  descriptionFieldName = "Description",
  namePlaceholder = "Entity name...",
  descriptionPlaceholder = "Add description..."
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResynthesizing, setIsResynthesizing] = useState(false);

  const synthesisMeta = item._synthesis_meta || {};
  const sourceRecordCount = synthesisMeta.source_record_count || 0;
  const synthesisTimestamp = synthesisMeta.synthesis_timestamp;
  const aggregatedIsFlagged = synthesisMeta.aggregated_is_flagged || false;
  const individualFlags = synthesisMeta.individual_flags || [];

  const handleResynthesize = async () => {
    if (!onResynthesize) return;
    
    setIsResynthesizing(true);
    try {
      await onResynthesize(item.category, item.name);
    } finally {
      setIsResynthesizing(false);
    }
  };

  const handleViewSources = () => {
    if (onViewSources && synthesisMeta.source_record_ids) {
      onViewSources(synthesisMeta.source_record_ids);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                Synthesized
              </Badge>
              {aggregatedIsFlagged && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Flagged Source
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <InlineEditableField
                value={item.name || ''}
                onSave={(value) => onUpdateName(item.id, value)}
                placeholder={namePlaceholder}
                className="text-lg font-semibold"
              />
              <ConfidenceBadge 
                confidence={item.confidence_score || 0.8} 
                isUserModified={item.is_verified}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FlagToggleButton
              isFlagged={item.is_flagged || false}
              onToggle={(isFlagged) => onToggleFlag(item.id, isFlagged)}
            />
            {onDelete && (
              <DeleteButton 
                onDelete={() => onDelete(item.id)}
                itemName={item.name || 'Unknown'}
                itemType="synthesized entity"
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <InlineEditableField
          value={item.description || ''}
          onSave={(value) => onUpdateDescription(item.id, value)}
          placeholder={descriptionPlaceholder}
          multiline
          className="text-sm text-slate-700"
        />

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{sourceRecordCount} source records</span>
            </div>
            {synthesisTimestamp && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Synthesized {formatTimestamp(synthesisTimestamp)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onViewSources && synthesisMeta.source_record_ids?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewSources}
                className="h-6 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View Sources
              </Button>
            )}
            
            {onResynthesize && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResynthesize}
                disabled={isResynthesizing}
                className="h-6 px-2 text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isResynthesizing ? 'Synthesizing...' : 'Re-synthesize'}
              </Button>
            )}
          </div>
        </div>

        {/* Source Details Collapsible */}
        {individualFlags.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-6 text-xs">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>Source Details ({individualFlags.length} records)</span>
                </span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="bg-slate-50 rounded p-3 space-y-2">
                {individualFlags.map((flag, index) => (
                  <div key={flag.record_id || index} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-600">Record {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      {flag.is_flagged && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                          Flagged
                        </Badge>
                      )}
                      {flag.is_verified && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};