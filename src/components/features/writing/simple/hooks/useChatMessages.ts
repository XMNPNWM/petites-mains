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
      return;
    }

    setIsLoading(true);
    setBannerState({ message: 'Sending...', type: 'loading' });

    try {
      const { shouldProceed, bannerState: verificationBannerState } = await sendMessageWithHashVerification(
        id,
        message,
        projectId,
        chapterId
      );

      if (verificationBannerState) {
        setBannerState(verificationBannerState);
      }

      if (shouldProceed) {
        const newMessage = {
          role: 'user' as const,
          content: message,
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setBannerState({ message: 'Failed to send message', type: 'error' });
    } finally {
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
