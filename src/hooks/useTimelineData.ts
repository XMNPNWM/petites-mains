
import { useState, useEffect, useCallback } from 'react';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { useSimplePopups } from '@/components/features/writing/simple/SimplePopupManager';
import { TimelineChat } from '@/types/shared';

export const useTimelineData = (projectId: string) => {
  const { loadTimelineChats } = useChatDatabase();
  const { timelineVersion } = useSimplePopups();
  const [timelineChats, setTimelineChats] = useState<TimelineChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reloadTimelineData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Reloading timeline chats for project:', projectId);
      const data = await loadTimelineChats(projectId);
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
  }, [projectId, loadTimelineChats, isLoading]);

  useEffect(() => {
    reloadTimelineData();
  }, [projectId]);

  useEffect(() => {
    if (timelineVersion > 0) {
      console.log('Timeline version changed, reloading data immediately...');
      reloadTimelineData();
    }
  }, [timelineVersion, reloadTimelineData]);

  const uniqueChats = timelineChats.reduce((acc, chat) => {
    const existing = acc.find(c => c.id === chat.id);
    if (!existing) {
      acc.push(chat);
    }
    return acc;
  }, [] as TimelineChat[]);

  const sortedChats = uniqueChats.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    timelineChats: sortedChats,
    isLoading,
    reloadTimelineData
  };
};
