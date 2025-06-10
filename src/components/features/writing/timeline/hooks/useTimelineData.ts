
import { useState, useEffect } from 'react';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { useSimplePopups } from '../simple/SimplePopupManager';
import { TimelineChat } from '../types';

export const useTimelineData = (projectId: string) => {
  const { timelineVersion } = useSimplePopups();
  const { loadTimelineChats } = useChatDatabase();
  const [timelineChats, setTimelineChats] = useState<TimelineChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Force reload timeline data
  const reloadTimelineData = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Reloading timeline chats for project:', projectId);
      const data = await loadTimelineChats(projectId);
      setTimelineChats(data);
      console.log('Timeline chats reloaded:', data.length);
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
      // Add small delay to ensure database operations complete
      setTimeout(() => {
        reloadTimelineData();
      }, 500);
    }
  }, [timelineVersion]);

  // Sort chats chronologically
  const sortedChats = timelineChats.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    sortedChats,
    isLoading,
    hasTimelineData: sortedChats.length > 0,
    reloadTimelineData
  };
};
