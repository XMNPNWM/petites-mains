
import React, { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopupChats } from './PopupChatManager';
import { format, isSameDay, startOfDay } from 'date-fns';

interface ChronologicalTimelineProps {
  projectId: string;
}

const ChronologicalTimeline = ({ projectId }: ChronologicalTimelineProps) => {
  const { chats, openChat } = usePopupChats();
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group chats by date
  const chatsByDate = chats
    .filter(chat => chat.projectId === projectId)
    .reduce((groups, chat) => {
      const dateKey = format(startOfDay(chat.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
      return groups;
    }, {} as Record<string, typeof chats>);

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

  const handleChatReopen = (chat: any) => {
    const position = { x: chat.position.x + 20, y: chat.position.y + 20 };
    openChat(chat.type, position, chat.projectId, chat.chapterId);
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
                      {dayChats.map((chat, index) => (
                        <button
                          key={`${chat.id}-${index}`}
                          onClick={() => handleChatReopen(chat)}
                          className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                            chat.type === 'comment' ? 'bg-blue-500' :
                            chat.type === 'coherence' ? 'bg-purple-500' :
                            chat.type === 'next-steps' ? 'bg-green-500' :
                            'bg-orange-500'
                          }`}
                          title={`${chat.type} - ${format(chat.createdAt, 'HH:mm')}`}
                        />
                      ))}
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
            Timeline will appear here as you create comments
          </span>
        ) : !isHovered && dates.length === 0 ? (
          <div className="h-1 w-40 bg-slate-300 rounded-full"></div>
        ) : null}
      </div>
    </div>
  );
};

export default ChronologicalTimeline;
