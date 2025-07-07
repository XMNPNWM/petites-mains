import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, AlertTriangle, Users, BookOpen, GitBranch, Calendar, Heart } from 'lucide-react';
import { AIBrainData } from '@/types/ai-brain';
import { FlagToggleButton } from '@/components/ui/flag-toggle-button';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { AIBrainUpdateService } from '@/services/AIBrainUpdateService';

interface QualityReviewPanelProps {
  data: AIBrainData;
  onDataRefresh: () => Promise<void>;
}

export const QualityReviewPanel = ({ data, onDataRefresh }: QualityReviewPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get all flagged items
  const flaggedKnowledge = data.knowledge.filter(item => item.is_flagged);
  const flaggedThemes = data.themes.filter(item => item.is_flagged);
  const flaggedPlotThreads = data.plotThreads.filter(item => item.is_flagged);
  const flaggedTimelineEvents = data.timelineEvents.filter(item => item.is_flagged);
  const flaggedCharacterRelationships = data.characterRelationships.filter(item => item.is_flagged);
  
  const totalFlaggedItems = flaggedKnowledge.length + flaggedThemes.length + 
                           flaggedPlotThreads.length + flaggedTimelineEvents.length + 
                           flaggedCharacterRelationships.length;

  // Don't render if no flagged items
  if (totalFlaggedItems === 0) {
    return null;
  }

  const handleUnflagKnowledge = async (id: string) => {
    await AIBrainUpdateService.toggleKnowledgeFlag(id, false);
    await onDataRefresh();
  };

  const handleUnflagPlotThread = async (id: string) => {
    await AIBrainUpdateService.togglePlotThreadFlag(id, false);
    await onDataRefresh();
  };

  const handleUnflagTimelineEvent = async (id: string) => {
    await AIBrainUpdateService.toggleTimelineEventFlag(id, false);
    await onDataRefresh();
  };

  const handleUnflagCharacterRelationship = async (id: string) => {
    await AIBrainUpdateService.toggleCharacterRelationshipFlag(id, false);
    await onDataRefresh();
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 hover:bg-yellow-100/50"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="text-left">
                <h3 className="font-medium text-yellow-900">Quality Review</h3>
                <p className="text-sm text-yellow-700">
                  {totalFlaggedItems} item{totalFlaggedItems !== 1 ? 's' : ''} flagged for review
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-yellow-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-yellow-600" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Flagged Characters */}
            {flaggedKnowledge.filter(item => item.category === 'character').length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <h4 className="font-medium text-slate-900">Characters</h4>
                  <Badge variant="outline" className="text-xs">
                    {flaggedKnowledge.filter(item => item.category === 'character').length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {flaggedKnowledge.filter(item => item.category === 'character').map((character) => (
                    <div key={character.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="font-medium text-sm">{character.name}</span>
                        <ConfidenceBadge 
                          confidence={character.confidence_score} 
                          isUserModified={character.is_verified} 
                        />
                      </div>
                      <FlagToggleButton
                        isFlagged={true}
                        onToggle={() => handleUnflagKnowledge(character.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagged Plot Threads */}
            {flaggedPlotThreads.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <GitBranch className="w-4 h-4 text-slate-600" />
                  <h4 className="font-medium text-slate-900">Plot Threads</h4>
                  <Badge variant="outline" className="text-xs">
                    {flaggedPlotThreads.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {flaggedPlotThreads.map((thread) => (
                    <div key={thread.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="font-medium text-sm">{thread.thread_name}</span>
                        <ConfidenceBadge 
                          confidence={thread.ai_confidence_new || 0} 
                        />
                      </div>
                      <FlagToggleButton
                        isFlagged={true}
                        onToggle={() => handleUnflagPlotThread(thread.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagged Timeline Events */}
            {flaggedTimelineEvents.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <h4 className="font-medium text-slate-900">Timeline Events</h4>
                  <Badge variant="outline" className="text-xs">
                    {flaggedTimelineEvents.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {flaggedTimelineEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="font-medium text-sm">{event.event_name}</span>
                        <ConfidenceBadge 
                          confidence={event.ai_confidence_new || 0} 
                        />
                      </div>
                      <FlagToggleButton
                        isFlagged={true}
                        onToggle={() => handleUnflagTimelineEvent(event.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagged Character Relationships */}
            {flaggedCharacterRelationships.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="w-4 h-4 text-slate-600" />
                  <h4 className="font-medium text-slate-900">Character Relationships</h4>
                  <Badge variant="outline" className="text-xs">
                    {flaggedCharacterRelationships.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {flaggedCharacterRelationships.map((relationship) => (
                    <div key={relationship.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="font-medium text-sm">
                          {relationship.character_a_name} ↔ {relationship.character_b_name}
                        </span>
                        <ConfidenceBadge 
                          confidence={relationship.ai_confidence_new || 0} 
                        />
                      </div>
                      <FlagToggleButton
                        isFlagged={true}
                        onToggle={() => handleUnflagCharacterRelationship(relationship.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other flagged knowledge items */}
            {flaggedKnowledge.filter(item => item.category !== 'character').length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <h4 className="font-medium text-slate-900">Other Knowledge</h4>
                  <Badge variant="outline" className="text-xs">
                    {flaggedKnowledge.filter(item => item.category !== 'character').length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {flaggedKnowledge.filter(item => item.category !== 'character').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.category.replace('_', ' ')}
                        </Badge>
                        <ConfidenceBadge 
                          confidence={item.confidence_score} 
                          isUserModified={item.is_verified} 
                        />
                      </div>
                      <FlagToggleButton
                        isFlagged={true}
                        onToggle={() => handleUnflagKnowledge(item.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
