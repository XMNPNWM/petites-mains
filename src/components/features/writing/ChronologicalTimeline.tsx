
import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'chat' | 'comment';
  content: string;
  position?: { x: number; y: number };
  lineNumber?: number;
  selectedText?: string;
}

interface ChronologicalTimelineProps {
  projectId: string;
  chapterId?: string;
  onEventClick?: (event: TimelineEvent) => void;
}

const ChronologicalTimeline = ({ 
  projectId, 
  chapterId,
  onEventClick 
}: ChronologicalTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimelineEvents();
  }, [projectId, chapterId]);

  const fetchTimelineEvents = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const timelineEvents: TimelineEvent[] = (data || []).map(session => ({
        id: session.id,
        timestamp: session.created_at,
        type: session.chat_type as 'chat' | 'comment',
        content: session.messages?.[0]?.content || 'No content',
        position: session.position as { x: number; y: number },
        lineNumber: session.line_number,
        selectedText: session.selected_text
      }));

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Timeline</h3>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card 
              key={event.id}
              className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                event.type === 'chat' ? 'border-l-orange-500' : 'border-l-blue-500'
              }`}
              onClick={() => onEventClick?.(event)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.type === 'chat' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {event.type}
                      </span>
                      {event.lineNumber && (
                        <span className="text-xs text-slate-500">
                          Line {event.lineNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {event.selectedText ? `"${event.selectedText}" - ` : ''}
                      {event.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChronologicalTimeline;
