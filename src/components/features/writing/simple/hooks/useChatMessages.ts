
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
  const [isLoading, setIsLoading] = useState(false);
  const [bannerState, setBannerState] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const { sendMessageWithHashVerification, popups, updatePopup } = useSimplePopups();

  // Get current popup and its messages from the popup manager state
  const currentPopup = popups.find(p => p.id === id);
  const messages = currentPopup?.messages || initialMessages;

  const sendMessage = useCallback(async (message: string) => {
    console.log('🚀 useChatMessages: Starting message send process', {
      id,
      projectId,
      chapterId,
      messageLength: message.length,
      hasHashVerification: !!sendMessageWithHashVerification
    });

    if (!sendMessageWithHashVerification) {
      console.warn('❌ useChatMessages: sendMessageWithHashVerification is not available');
      setBannerState({ message: 'Chat service not available', type: 'error' });
      return;
    }

    setIsLoading(true);
    setBannerState({ message: 'Processing...', type: 'loading' });
    console.log('📤 useChatMessages: Set loading state and banner');

    try {
      console.log('📡 useChatMessages: Calling sendMessageWithHashVerification...');
      const result = await sendMessageWithHashVerification(
        id,
        message,
        projectId,
        chapterId
      );

      console.log('📨 useChatMessages: Received result from sendMessageWithHashVerification:', {
        success: result.success,
        hasBannerState: !!result.bannerState,
        bannerType: result.bannerState?.type
      });

      if (result.bannerState) {
        setBannerState(result.bannerState);
        console.log('🎌 useChatMessages: Updated banner state:', result.bannerState);
      }

      console.log('✅ useChatMessages: Message processing completed successfully');
      
      // Clear loading state
      setIsLoading(false);
      
      // Clear banner after 3 seconds for success messages
      if (result.bannerState?.type === 'success') {
        console.log('⏰ useChatMessages: Setting timer to clear success banner');
        setTimeout(() => {
          setBannerState(null);
          console.log('🔄 useChatMessages: Cleared success banner after timeout');
        }, 3000);
      }

    } catch (error) {
      console.error('❌ useChatMessages: Failed to send message:', error);
      console.error('❌ useChatMessages: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setBannerState({ message: 'Failed to send message', type: 'error' });
      setIsLoading(false);
    }
  }, [id, projectId, chapterId, sendMessageWithHashVerification]);

  const dismissBanner = useCallback(() => {
    console.log('🔄 useChatMessages: Dismissing banner');
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
