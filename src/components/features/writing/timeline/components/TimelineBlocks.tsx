
import React from 'react';
import { format } from 'date-fns';
import { useSimplePopups } from '../../simple/SimplePopupManager';
import { TimelineChat } from '../types';

interface TimelineBlocksProps {
  sortedChats: TimelineChat[];
  projectId: string;
}

const TimelineBlocks = ({ sortedChats, projectId }: TimelineBlocksProps) => {
  const { reopenPopup, popups: livePopups } = useSimplePopups();

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

  return (
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
  );
};

export default TimelineBlocks;
