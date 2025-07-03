
import { useState, useCallback } from 'react';
import { useSimplePopups } from '../SimplePopupManager';

interface UseChatMessagesProps {
  id: string;
  projectId: string;
  chapterId?: string;
  initialMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export const useChatMessages = ({
  id,
  projectId,
  chapterId,
  initialMessages = []
}: UseChatMessagesProps) => {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerState, setBannerState] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const { sendMessageWithHashVerification } = useSimplePopups();

  const sendMessage = useCallback(async (message: string) => {
    if (!sendMessageWithHashVerification) {
      console.warn('sendMessageWithHashVerification is not available');
      setBannerState({ message: 'Chat service not available', type: 'error' });
      return;
    }

    setIsLoading(true);
    setBannerState({ message: 'Processing...', type: 'loading' });

    try {
      const result = await sendMessageWithHashVerification(
        id,
        message,
        projectId,
        chapterId
      );

      if (result.bannerState) {
        setBannerState(result.bannerState);
      }

      // The messages are updated directly in the SimplePopupManager
      // so we don't need to update local state here
      
      // Clear loading state
      setIsLoading(false);
      
      // Clear banner after 3 seconds for success messages
      if (result.bannerState?.type === 'success') {
        setTimeout(() => {
          setBannerState(null);
        }, 3000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setBannerState({ message: 'Failed to send message', type: 'error' });
      setIsLoading(false);
    }
  }, [id, projectId, chapterId, sendMessageWithHashVerification]);

  const dismissBanner = useCallback(() => {
    setBannerState(null);
  }, []);

  return {
    messages,
    isLoading,
    bannerState,
    sendMessage,
    dismissBanner
  };
};
