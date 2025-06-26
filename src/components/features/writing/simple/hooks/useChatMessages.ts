
import { useState, useCallback } from 'react';
import { useSimplePopups } from '../SimplePopupManager';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatMessagesProps {
  id: string;
  projectId: string;
  chapterId?: string;
  initialMessages?: Message[];
}

export const useChatMessages = ({ 
  id, 
  projectId, 
  chapterId, 
  initialMessages = [] 
}: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerState, setBannerState] = useState<{ 
    message: string; 
    type: 'success' | 'error' | 'loading' 
  } | null>(null);

  const { sendMessageWithHashVerification } = useSimplePopups();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Perform hash verification before sending to AI (only for chat popups)
      if (sendMessageWithHashVerification) {
        const verificationResult = await sendMessageWithHashVerification(
          id,
          userMessage.content,
          projectId,
          chapterId
        );

        // Show banner if provided
        if (verificationResult.bannerState) {
          setBannerState(verificationResult.bannerState);
        }

        if (!verificationResult.shouldProceed) {
          setIsLoading(false);
          return;
        }
      }

      // Simulate AI response (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: Message = {
        role: 'assistant',
        content: `I understand you're asking about: "${userMessage.content}". Let me help you with that based on your story context.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setBannerState({ message: 'Failed to send message', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [id, projectId, chapterId, isLoading, sendMessageWithHashVerification]);

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
