
import { useState, useCallback } from 'react';
import { useSimplePopups } from '../SimplePopupManager';
import { AIService } from '@/services/AIService';

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
  chatType?: 'comment' | 'chat' | 'characters' | 'plot' | 'worldbuilding';
}

export const useChatMessages = ({ 
  id, 
  projectId, 
  chapterId, 
  initialMessages = [],
  chatType = 'chat'
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
      if (sendMessageWithHashVerification && chatType === 'chat') {
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

      // Generate AI response using the appropriate method
      let aiResponseData;
      
      if (chatType === 'comment') {
        // For comments, just acknowledge
        aiResponseData = {
          content: `Comment noted: "${userMessage.content}". This has been saved for your reference.`
        };
      } else if (['characters', 'plot', 'worldbuilding'].includes(chatType)) {
        // Use knowledge-aware response for specific domains
        aiResponseData = await AIService.generateKnowledgeResponse(
          userMessage.content,
          projectId,
          chatType as 'characters' | 'plot' | 'worldbuilding',
          messages
        );
      } else {
        // Use general AI response
        aiResponseData = await AIService.generateResponse(
          userMessage.content,
          projectId,
          messages,
          chapterId
        );
      }

      const aiResponse: Message = {
        role: 'assistant',
        content: aiResponseData.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Show usage info if available
      if (aiResponseData.usage) {
        console.log('AI Usage:', aiResponseData.usage);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setBannerState({ message: 'Failed to send message', type: 'error' });
      
      // Add error message
      const errorResponse: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [id, projectId, chapterId, isLoading, sendMessageWithHashVerification, messages, chatType]);

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
