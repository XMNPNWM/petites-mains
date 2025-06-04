
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopupChats } from './PopupChatManager';
import { format, isSameDay, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TimelineChat {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  selected_text?: string;
  text_position?: number;
  created_at: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
}

interface ChronologicalTimelineProps {
  projectId: string;
}

// Type guard to safely convert database data to TimelineChat
const convertToTimelineChat = (dbChat: any): TimelineChat | null => {
  try {
    // Validate required fields
    if (!dbChat.id || !dbChat.project_id || !dbChat.chat_type || !dbChat.created_at) {
      console.warn('Missing required fields in chat data:', dbChat);
      return null;
    }

    // Parse position - handle both object and string formats
    let position: { x: number; y: number };
    if (typeof dbChat.position === 'string') {
      try {
        position = JSON.parse(dbChat.position);
      } catch {
        console.warn('Failed to parse position string:', dbChat.position);
        position = { x: 100, y: 100 }; // Default position
      }
    } else if (dbChat.position && typeof dbChat.position === 'object') {
      position = dbChat.position as { x: number; y: number };
    } else {
      position = { x: 100, y: 100 }; // Default position
    }

    // Parse messages - handle both array and string formats
    let messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> = [];
    if (typeof dbChat.messages === 'string') {
      try {
        messages = JSON.parse(dbChat.messages);
      } catch {
        console.warn('Failed to parse messages string:', dbChat.messages);
      }
    } else if (Array.isArray(dbChat.messages)) {
      messages = dbChat.messages;
    }

    return {
      id: dbChat.id,
      project_id: dbChat.project_id,
      chapter_id: dbChat.chapter_id || undefined,
      chat_type: dbChat.chat_type as 'comment' | 'coherence' | 'next-steps' | 'chat',
      position,
      selected_text: dbChat.selected_text || undefined,
      text_position: dbChat.text_position || undefined,
      created_at: dbChat.created_at,
      messages
    };
  } catch (error) {
    console.error('Error converting chat data:', error, dbChat);
    return null;
  }
};

const ChronologicalTimeline = ({ projectId }: ChronologicalTimelineProps) => {
  const { openChat, chats: liveChats } = usePopupChats();
  const [isHovered, setIsHovered] = useState(false);
  const [timelineChats, setTimelineChats] = useState<TimelineChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load closed chats from database with deduplication
  const fetchTimelineChats = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) return;
    
    // Debounce rapid successive calls
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(fetchTimelineChats, 1000);
      return;
    }
    
    lastFetchRef.current = now;
    setIsLoading(true);

    try {
      console.log('Fetching timeline chats for project:', projectId);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching timeline chats:', error);
        return;
      }

      console.log('Raw timeline data from database:', data);
      
      // Convert and filter valid chats
      const validChats = (data || [])
        .map(convertToTimelineChat)
        .filter((chat): chat is TimelineChat => chat !== null);

      // Deduplicate chats by ID
      const uniqueChats = validChats.reduce((acc, chat) => {
        if (!acc.find(existingChat => existingChat.id === chat.id)) {
          acc.push(chat);
        }
        return acc;
      }, [] as TimelineChat[]);

      console.log('Timeline chats loaded after deduplication:', uniqueChats.length);
      setTimelineChats(uniqueChats);
    } catch (error) {
      console.error('Error loading timeline chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chats on mount and when project changes
  useEffect(() => {
    fetchTimelineChats();
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [projectId]);

  // Refresh timeline when chats are closed (we detect this by checking if there are fewer live chats)
  const prevLiveChatCount = useRef(liveChats.length);
  useEffect(() => {
    if (liveChats.length < prevLiveChatCount.current) {
      // A chat was closed, refresh the timeline after a delay
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        console.log('Chat closed, refreshing timeline...');
        fetchTimelineChats();
      }, 2000);
    }
    prevLiveChatCount.current = liveChats.length;
  }, [liveChats.length]);

  // Group chats by date with deduplication at render level
  const chatsByDate = timelineChats.reduce((groups, chat) => {
    const dateKey = format(startOfDay(new Date(chat.created_at)), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    // Additional check to prevent duplication at render level
    if (!groups[dateKey].find(existingChat => existingChat.id === chat.id)) {
      groups[dateKey].push(chat);
    }
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

  const handleChatReopen = (chat: TimelineChat) => {
    console.log('Reopening chat from timeline:', chat.id);
    
    // Calculate new position with offset to avoid overlap with existing chats
    const activeChatsCount = liveChats.length;
    const offsetX = activeChatsCount * 30;
    const offsetY = activeChatsCount * 30;
    
    const safePosition = {
      x: Math.max(50, Math.min(chat.position.x + offsetX, window.innerWidth - 450)),
      y: Math.max(50, Math.min(chat.position.y + offsetY, window.innerHeight - 550))
    };
    
    const selectedText = chat.selected_text ? {
      text: chat.selected_text,
      startOffset: chat.text_position || 0,
      endOffset: (chat.text_position || 0) + chat.selected_text.length
    } : undefined;
    
    console.log('Opening chat with position:', safePosition);
    openChat(chat.chat_type, safePosition, chat.project_id, chat.chapter_id, selectedText);
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
                      {dayChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleChatReopen(chat)}
                          className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                            chat.chat_type === 'comment' ? 'bg-blue-500' :
                            chat.chat_type === 'coherence' ? 'bg-purple-500' :
                            chat.chat_type === 'next-steps' ? 'bg-green-500' :
                            'bg-orange-500'
                          }`}
                          title={`${chat.chat_type} - ${format(new Date(chat.created_at), 'HH:mm')}${
                            chat.messages && chat.messages.length > 0 ? ` (${chat.messages.length} messages)` : ''
                          }`}
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
