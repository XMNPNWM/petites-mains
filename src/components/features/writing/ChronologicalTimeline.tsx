
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimplePopups } from './simple/SimplePopupManager';
import { format, startOfDay } from 'date-fns';
import { useChatDatabase } from '@/hooks/useChatDatabase';

interface TimelineChat {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  selected_text?: string;
  text_position?: number;
  status?: string;
  created_at: string;
}

interface ChronologicalTimelineProps {
  projectId: string;
}

const ChronologicalTimeline = ({ projectId }: ChronologicalTimelineProps) => {
  const { reopenPopup, popups: livePopups } = useSimplePopups();
  const { loadTimelineChats } = useChatDatabase();
  const [isHovered, setIsHovered] = useState(false);
  const [timelineChats, setTimelineChats] = useState<TimelineChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all chats (both active and closed) for timeline display
  useEffect(() => {
    const fetchTimelineChats = async () => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const data = await loadTimelineChats(projectId);
        setTimelineChats(data);
      } catch (error) {
        console.error('Error loading timeline chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimelineChats();
  }, [projectId, loadTimelineChats, isLoading]);

  // Update timeline when live popups change
  useEffect(() => {
    if (livePopups.length > 0) {
      console.log('Live popups updated, refreshing timeline');
      // Trigger a refresh after a short delay to ensure database is updated
      setTimeout(() => {
        setIsLoading(false); // Reset loading state to allow refetch
      }, 1000);
    }
  }, [livePopups.length]);

  // Group chats by date
  const chatsByDate = timelineChats.reduce((groups, chat) => {
    const dateKey = format(startOfDay(new Date(chat.created_at)), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(chat);
    return groups;
  }, {} as Record<string, TimelineChat[]>);

  const dates = Object.keys(chatsByDate).sort();

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleChatReopen = async (chat: TimelineChat) => {
    console.log('Reopening chat from timeline:', chat.id);
    await reopenPopup(chat.id, chat.chat_type, chat.position, projectId, chat.chapter_id, chat.selected_text);
  };

  // Always show timeline, but with different states
  return (
    <div
      className={`flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
        isHovered || dates.length > 0 
          ? 'opacity-100 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2' 
          : 'opacity-40'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || dates.length > 0) && dates.length > 0 && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={scrollLeft}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <div className="flex items-center mx-2 max-w-lg overflow-hidden">
            <div
              ref={scrollRef}
              className="flex space-x-4 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {dates.map(dateKey => {
                const date = new Date(dateKey);
                const dayChats = chatsByDate[dateKey];
                
                return (
                  <div key={dateKey} className="flex-shrink-0 flex flex-col items-center">
                    <div className="text-xs text-slate-600 mb-1 whitespace-nowrap">
                      {format(date, 'MMM dd')}
                    </div>
                    <div className="flex space-x-1">
                      {dayChats.map((chat, index) => {
                        const isActive = chat.status === 'active';
                        return (
                          <button
                            key={`${chat.id}-${index}`}
                            onClick={() => handleChatReopen(chat)}
                            className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                              chat.chat_type === 'comment' ? 'bg-blue-500' :
                              chat.chat_type === 'coherence' ? 'bg-purple-500' :
                              chat.chat_type === 'next-steps' ? 'bg-green-500' :
                              'bg-orange-500'
                            } ${isActive ? 'ring-2 ring-slate-300' : 'opacity-70'}`}
                            title={`${chat.chat_type} - ${format(new Date(chat.created_at), 'HH:mm')} ${isActive ? '(active)' : '(closed)'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={scrollRight}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </>
      )}
      
      {/* Always visible timeline indicator */}
      <div className={`transition-all duration-300 ${
        isHovered && dates.length === 0 
          ? 'bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1' 
          : ''
      }`}>
        {isHovered && dates.length === 0 ? (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {isLoading ? 'Loading timeline...' : 'Timeline will appear here as you create comments'}
          </span>
        ) : !isHovered && dates.length === 0 ? (
          <div className="h-1 w-40 bg-slate-300 rounded-full"></div>
        ) : null}
      </div>
    </div>
  );
};

export default ChronologicalTimeline;
