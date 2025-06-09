
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimplePopups } from './simple/SimplePopupManager';
import { format } from 'date-fns';
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load timeline chats once
  useEffect(() => {
    if (hasLoaded) return;

    const fetchTimelineChats = async () => {
      try {
        console.log('Loading timeline chats for project:', projectId);
        const data = await loadTimelineChats(projectId);
        setTimelineChats(data);
        setHasLoaded(true);
        console.log('Timeline chats loaded:', data.length);
      } catch (error) {
        console.error('Error loading timeline chats:', error);
        setHasLoaded(true);
      }
    };

    fetchTimelineChats();
  }, [projectId, loadTimelineChats, hasLoaded]);

  // Update timeline when live popups change
  useEffect(() => {
    if (livePopups.length > 0 && hasLoaded) {
      console.log('Live popups updated, will refresh timeline in next load');
      setHasLoaded(false);
    }
  }, [livePopups.length, hasLoaded]);

  // Sort chats chronologically
  const sortedChats = timelineChats.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

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

  // Get block color based on chat type
  const getBlockColor = (type: string, isActive: boolean) => {
    const baseColors = {
      comment: 'bg-blue-500',
      coherence: 'bg-purple-500',
      'next-steps': 'bg-green-500',
      chat: 'bg-orange-500'
    };
    
    const color = baseColors[type as keyof typeof baseColors] || 'bg-gray-500';
    return isActive ? `${color} ring-2 ring-white shadow-lg` : `${color} opacity-70`;
  };

  // Enable horizontal mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        scrollRef.current.scrollBy({
          left: e.deltaY,
          behavior: 'auto'
        });
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <div
      className={`flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
        isHovered || sortedChats.length > 0 
          ? 'opacity-100 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2' 
          : 'opacity-40'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || sortedChats.length > 0) && sortedChats.length > 0 && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={scrollLeft}
            className="h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center mx-3 max-w-2xl overflow-hidden">
            <div
              ref={scrollRef}
              className="flex items-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                minHeight: '16px'
              }}
            >
              {/* Continuous timeline line background */}
              <div className="absolute h-1 bg-slate-300 rounded-full" 
                   style={{ 
                     width: `${sortedChats.length * 12}px`,
                     zIndex: 0
                   }} 
              />
              
              {/* Timeline blocks */}
              <div className="flex relative z-10">
                {sortedChats.map((chat, index) => {
                  const isActive = chat.status === 'active';
                  const nextChat = sortedChats[index + 1];
                  const timeDiff = nextChat ? 
                    (new Date(nextChat.created_at).getTime() - new Date(chat.created_at).getTime()) / (1000 * 60) : 0;
                  
                  // Adjust block width based on time gap (min 8px, max 16px)
                  const blockWidth = Math.min(16, Math.max(8, timeDiff > 60 ? 14 : 10));
                  
                  return (
                    <React.Fragment key={chat.id}>
                      <button
                        onClick={() => handleChatReopen(chat)}
                        className={`flex-shrink-0 h-3 rounded-sm transition-all duration-200 hover:scale-110 hover:z-20 relative ${getBlockColor(chat.chat_type, isActive)}`}
                        style={{ width: `${blockWidth}px` }}
                        title={`${chat.chat_type} - ${format(new Date(chat.created_at), 'MMM dd, HH:mm')} ${isActive ? '(active)' : '(closed)'}`}
                      />
                      {/* Connection line between blocks */}
                      {index < sortedChats.length - 1 && (
                        <div className="h-0.5 bg-slate-300 flex-shrink-0" style={{ width: '2px' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              
              {/* Time markers for major gaps */}
              {sortedChats.length > 0 && (
                <div className="absolute top-4 left-0 right-0 flex justify-between text-xs text-slate-500 pointer-events-none">
                  <span>{format(new Date(sortedChats[0].created_at), 'MMM dd')}</span>
                  {sortedChats.length > 1 && (
                    <span>{format(new Date(sortedChats[sortedChats.length - 1].created_at), 'MMM dd')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={scrollRight}
            className="h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}
      
      {/* Always visible timeline indicator */}
      <div className={`transition-all duration-300 ${
        isHovered && sortedChats.length === 0 
          ? 'bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2' 
          : ''
      }`}>
        {isHovered && sortedChats.length === 0 ? (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {!hasLoaded ? 'Loading timeline...' : 'Timeline will appear here as you create comments'}
          </span>
        ) : !isHovered && sortedChats.length === 0 ? (
          <div className="h-1 w-48 bg-slate-300 rounded-full"></div>
        ) : null}
      </div>
    </div>
  );
};

export default ChronologicalTimeline;
