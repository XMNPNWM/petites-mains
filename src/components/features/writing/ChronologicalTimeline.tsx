
import React, { useState, useRef, useEffect } from 'react';
import { useSimplePopups } from './simple/SimplePopupManager';
import { format } from 'date-fns';
import { useChatDatabase } from '@/hooks/useChatDatabase';

interface TimelineChat {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'chat';
  position: { x: number; y: number };
  selected_text?: string;
  text_position?: number;
  line_number?: number;
  status?: string;
  created_at: string;
}

interface ChronologicalTimelineProps {
  projectId: string;
}

const ChronologicalTimeline = ({ projectId }: ChronologicalTimelineProps) => {
  const { reopenPopup, popups: livePopups, timelineVersion } = useSimplePopups();
  const { loadTimelineChats } = useChatDatabase();
  const [isHovered, setIsHovered] = useState(false);
  const [timelineChats, setTimelineChats] = useState<TimelineChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Force reload timeline data
  const reloadTimelineData = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Reloading timeline chats for project:', projectId);
      const data = await loadTimelineChats(projectId);
      // Filter out legacy types that shouldn't exist anymore
      const filteredData = data.filter(chat => 
        chat.chat_type === 'comment' || chat.chat_type === 'chat'
      );
      setTimelineChats(filteredData);
      console.log('Timeline chats reloaded:', filteredData.length);
    } catch (error) {
      console.error('Error reloading timeline chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load timeline chats on mount
  useEffect(() => {
    reloadTimelineData();
  }, [projectId]);

  // Reload when timeline version changes (when popups are created/closed)
  useEffect(() => {
    if (timelineVersion > 0) {
      console.log('Timeline version changed, reloading data...');
      setTimeout(() => {
        reloadTimelineData();
      }, 500);
    }
  }, [timelineVersion]);

  // Sort chats chronologically
  const sortedChats = timelineChats.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleChatReopen = async (chat: TimelineChat) => {
    console.log('Reopening chat from timeline:', chat.id);
    await reopenPopup(chat.id, chat.chat_type, chat.position, projectId, chat.chapter_id, chat.selected_text);
  };

  // Get block color based on chat type (only comment and chat now)
  const getBlockColor = (type: string, isActive: boolean) => {
    const baseColors = {
      comment: 'bg-blue-500',
      chat: 'bg-orange-500'
    };
    
    const color = baseColors[type as keyof typeof baseColors] || 'bg-gray-500';
    return isActive ? `${color} ring-2 ring-white shadow-lg` : `${color} opacity-70`;
  };

  // Enable horizontal mouse wheel scrolling and dragging
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    let isMouseDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        scrollElement.scrollBy({
          left: e.deltaY,
          behavior: 'auto'
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      isMouseDown = true;
      startX = e.pageX - scrollElement.offsetLeft;
      scrollLeft = scrollElement.scrollLeft;
      scrollElement.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      scrollElement.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      e.preventDefault();
      const x = e.pageX - scrollElement.offsetLeft;
      const walk = (x - startX) * 2;
      scrollElement.scrollLeft = scrollLeft - walk;
    };

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    scrollElement.addEventListener('mousedown', handleMouseDown);
    scrollElement.addEventListener('mouseup', handleMouseUp);
    scrollElement.addEventListener('mousemove', handleMouseMove);
    scrollElement.addEventListener('mouseleave', handleMouseUp);

    return () => {
      scrollElement.removeEventListener('wheel', handleWheel);
      scrollElement.removeEventListener('mousedown', handleMouseDown);
      scrollElement.removeEventListener('mouseup', handleMouseUp);
      scrollElement.removeEventListener('mousemove', handleMouseMove);
      scrollElement.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  const hasTimelineData = sortedChats.length > 0;

  return (
    <div
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Always visible subtle indicator */}
      <div className={`flex items-center justify-center transition-all duration-300 ${
        isHovered 
          ? 'opacity-0' 
          : 'opacity-40'
      }`}>
        <div className="h-1 w-48 bg-slate-300 rounded-full"></div>
      </div>

      {/* Full timeline that appears on hover */}
      <div className={`flex items-center justify-center transition-all duration-300 absolute inset-0 ${
        isHovered 
          ? 'opacity-100 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2' 
          : 'opacity-0 pointer-events-none'
      }`}>
        {isHovered && hasTimelineData && (
          <div className="flex items-center max-w-6xl overflow-hidden">
            <div
              ref={scrollRef}
              className="flex items-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                minHeight: '16px'
              }}
            >
              {/* Timeline blocks */}
              <div className="flex relative z-10 gap-0">
                {sortedChats.map((chat, index) => {
                  const isActive = livePopups.some(popup => popup.id === chat.id);
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatReopen(chat)}
                      className={`flex-shrink-0 h-3 w-2 transition-all duration-200 hover:scale-110 hover:z-20 relative border-r border-white/30 first:rounded-l-sm last:rounded-r-sm ${getBlockColor(chat.chat_type, isActive)}`}
                      title={`${chat.chat_type} - ${format(new Date(chat.created_at), 'MMM dd, HH:mm')} ${isActive ? '(active)' : '(closed)'}`}
                    />
                  );
                })}
              </div>
              
              {/* Time markers for timeline start and end */}
              {hasTimelineData && (
                <div className="absolute top-4 left-0 right-0 flex justify-between text-xs text-slate-500 pointer-events-none">
                  <span>{format(new Date(sortedChats[0].created_at), 'MMM dd')}</span>
                  {sortedChats.length > 1 && (
                    <span>{format(new Date(sortedChats[sortedChats.length - 1].created_at), 'MMM dd')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Message when no data and hovered */}
        {isHovered && !hasTimelineData && (
          <div className="px-4 py-2">
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {isLoading ? 'Loading timeline...' : 'Timeline will appear here as you create comments and chats'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChronologicalTimeline;
