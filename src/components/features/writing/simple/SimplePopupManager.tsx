import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PopupPosition {
  x: number;
  y: number;
}

export type ChatType = 'comment' | 'coherence' | 'next-steps' | 'chat';

export interface ChatPopupState {
  id: string;
  type: ChatType;
  position: PopupPosition;
  isMinimized: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
}

export interface CommentBoxState {
  id: string;
  position: PopupPosition;
  isMinimized: boolean;
  selectedText?: {
    text: string;
    lineNumber: number;
  };
}

interface SimplePopupContextProps {
  chatPopups: ChatPopupState[];
  commentBoxes: CommentBoxState[];
  createChatPopup: (type: ChatType, initialPosition: PopupPosition, selectedText?: { text: string; lineNumber: number }) => string;
  createCommentBox: (initialPosition: PopupPosition, selectedText?: { text: string; lineNumber: number }) => string;
  closeChatPopup: (id: string) => void;
  minimizeChatPopup: (id: string) => void;
  closeCommentBox: (id: string) => void;
  minimizeCommentBox: (id: string) => void;
  sendMessageWithHashVerification: (popupId: string, message: string, projectId: string, chapterId?: string) => Promise<{ success: boolean; bannerState?: { message: string; type: 'success' | 'error' | 'loading' } }>;
  saveChatMessage: (popupId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => Promise<void>;
}

const SimplePopupContext = React.createContext<SimplePopupContextProps | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupManagerProvider');
  }
  return context;
};

interface SimplePopupRendererProps {
  chatPopups: ChatPopupState[];
  commentBoxes: CommentBoxState[];
  onCloseChatPopup: (id: string) => void;
  onMinimizeChatPopup: (id: string) => void;
  onCloseCommentBox: (id: string) => void;
  onMinimizeCommentBox: (id: string) => void;
  projectId: string;
  chapterId?: string;
}

export const SimplePopupRenderer: React.FC<SimplePopupRendererProps> = ({
  chatPopups,
  commentBoxes,
  onCloseChatPopup,
  onMinimizeChatPopup,
  onCloseCommentBox,
  onMinimizeCommentBox,
  projectId,
  chapterId
}) => {
  const PopupChat = React.lazy(() => import('../PopupChat'));
  const CommentBox = React.lazy(() => import('../CommentBox'));

  return (
    <>
      {chatPopups.map((popup) => (
        <React.Suspense key={popup.id} fallback={<div>Loading...</div>}>
          <PopupChat
            id={popup.id}
            type={popup.type}
            initialPosition={popup.position}
            onClose={() => onCloseChatPopup(popup.id)}
            onMinimize={() => onMinimizeChatPopup(popup.id)}
            isMinimized={popup.isMinimized}
            projectId={projectId}
            chapterId={chapterId}
            initialMessages={popup.messages}
          />
        </React.Suspense>
      ))}
      {commentBoxes.map((commentBox) => (
        <React.Suspense key={commentBox.id} fallback={<div>Loading...</div>}>
          <CommentBox
            id={commentBox.id}
            initialPosition={commentBox.position}
            onClose={() => onCloseCommentBox(commentBox.id)}
            onMinimize={() => onMinimizeCommentBox(commentBox.id)}
            isMinimized={commentBox.isMinimized}
            selectedText={commentBox.selectedText}
            projectId={projectId}
            chapterId={chapterId}
          />
        </React.Suspense>
      ))}
    </>
  );
};

export const SimplePopupManagerProvider: React.FC<{
  children: React.ReactNode;
  projectId: string;
  chapterId?: string;
}> = ({ children, projectId, chapterId }) => {
  const [chatPopups, setChatPopups] = useState<ChatPopupState[]>([]);
  const [commentBoxes, setCommentBoxes] = useState<CommentBoxState[]>([]);
  const { toast } = useToast();

  const loadChatSessions = useCallback(async () => {
    try {
      console.log('🔄 Loading chat sessions from database...');
      
      // Load chat popups
      const { data: chatData, error: chatError } = await supabase
        .from('popup_chats')
        .select('*')
        .eq('project_id', projectId);

      if (chatError) {
        console.error('❌ Error loading chat popups:', chatError);
        throw chatError;
      }

      const loadedChatPopups: ChatPopupState[] = chatData.map(chat => ({
        id: chat.id,
        type: chat.chat_type,
        position: chat.position,
        isMinimized: chat.is_minimized,
        messages: chat.messages || []
      }));
      
      console.log(`✅ Loaded ${loadedChatPopups.length} chat popups`);
      setChatPopups(loadedChatPopups);

      // Load comment boxes
      const { data: commentData, error: commentError } = await supabase
        .from('comment_boxes')
        .select('*')
        .eq('project_id', projectId);

      if (commentError) {
        console.error('❌ Error loading comment boxes:', commentError);
        throw commentError;
      }

      const loadedCommentBoxes: CommentBoxState[] = commentData.map(comment => ({
        id: comment.id,
        position: comment.position,
        isMinimized: comment.is_minimized,
        selectedText: comment.selected_text
      }));
      
      console.log(`✅ Loaded ${loadedCommentBoxes.length} comment boxes`);
      setCommentBoxes(loadedCommentBoxes);

    } catch (error) {
      console.error('❌ Error in loadChatSessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive"
      });
    }
  }, [projectId, toast]);

  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  const createChatPopup = useCallback((type: ChatType, initialPosition: PopupPosition, selectedText?: { text: string; lineNumber: number }) => {
    const id = uuidv4();
    const newPopup: ChatPopupState = {
      id,
      type,
      position: initialPosition,
      isMinimized: false,
      messages: []
    };

    setChatPopups(prev => [...prev, newPopup]);

    supabase
      .from('popup_chats')
      .insert({
        id: id,
        project_id: projectId,
        chat_type: type,
        position: initialPosition,
        is_minimized: false,
        messages: [],
        selected_text: selectedText
      })
      .then(() => console.log('✅ Created chat popup:', id))
      .catch(error => console.error('❌ Error creating chat popup:', error));

    return id;
  }, [projectId]);

  const createCommentBox = useCallback((initialPosition: PopupPosition, selectedText?: { text: string; lineNumber: number }) => {
    const id = uuidv4();
    const newCommentBox: CommentBoxState = {
      id,
      position: initialPosition,
      isMinimized: false,
      selectedText: selectedText
    };

    setCommentBoxes(prev => [...prev, newCommentBox]);

    supabase
      .from('comment_boxes')
      .insert({
        id: id,
        project_id: projectId,
        position: initialPosition,
        is_minimized: false,
        selected_text: selectedText
      })
      .then(() => console.log('✅ Created comment box:', id))
      .catch(error => console.error('❌ Error creating comment box:', error));

    return id;
  }, [projectId]);

  const closeChatPopup = useCallback((id: string) => {
    setChatPopups(prev => prev.filter(popup => popup.id !== id));

    supabase
      .from('popup_chats')
      .delete()
      .eq('id', id)
      .then(() => console.log('✅ Closed chat popup:', id))
      .catch(error => console.error('❌ Error closing chat popup:', error));
  }, []);

  const minimizeChatPopup = useCallback((id: string) => {
    setChatPopups(prev =>
      prev.map(popup =>
        popup.id === id ? { ...popup, isMinimized: !popup.isMinimized } : popup
      )
    );

    supabase
      .from('popup_chats')
      .update({ is_minimized: true })
      .eq('id', id)
      .then(() => console.log('✅ Minimized chat popup:', id))
      .catch(error => console.error('❌ Error minimizing chat popup:', error));
  }, []);

  const closeCommentBox = useCallback((id: string) => {
    setCommentBoxes(prev => prev.filter(commentBox => commentBox.id !== id));

    supabase
      .from('comment_boxes')
      .delete()
      .eq('id', id)
      .then(() => console.log('✅ Closed comment box:', id))
      .catch(error => console.error('❌ Error closing comment box:', error));
  }, []);

  const minimizeCommentBox = useCallback((id: string) => {
    setCommentBoxes(prev =>
      prev.map(commentBox =>
        commentBox.id === id ? { ...commentBox, isMinimized: !commentBox.isMinimized } : commentBox
      )
    );

    supabase
      .from('comment_boxes')
      .update({ is_minimized: true })
      .eq('id', id)
      .then(() => console.log('✅ Minimized comment box:', id))
      .catch(error => console.error('❌ Error minimizing comment box:', error));
  }, []);

  const sendMessageWithHashVerification = useCallback(async (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => {
    console.log('🚀 Starting sendMessageWithHashVerification:', { popupId, message, projectId, chapterId });
    
    try {
      // Add user message to the popup immediately
      setChatPopups(prev => prev.map(popup => {
        if (popup.id === popupId) {
          const userMessage = {
            role: 'user' as const,
            content: message,
            timestamp: new Date()
          };
          
          const updatedMessages = [...popup.messages, userMessage];
          console.log('📝 Added user message to popup:', userMessage);
          
          return {
            ...popup,
            messages: updatedMessages
          };
        }
        return popup;
      }));

      // Save user message to database
      const userMessageData = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };

      await saveChatMessage(popupId, userMessageData);
      console.log('💾 Saved user message to database');

      // Call the chat-with-ai edge function for AI response
      console.log('🤖 Calling chat-with-ai edge function...');
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: message,
          projectId: projectId,
          chapterId: chapterId
        }
      });

      console.log('📨 Chat AI response received:', { data, error });

      if (error) {
        console.error('❌ Chat AI error:', error);
        throw new Error(`Chat AI failed: ${error.message}`);
      }

      if (!data?.success || !data?.response) {
        console.error('❌ Invalid AI response:', data);
        throw new Error('Invalid response from AI chat service');
      }

      // Add AI response to the popup
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };

      setChatPopups(prev => prev.map(popup => {
        if (popup.id === popupId) {
          const updatedMessages = [...popup.messages, aiMessage];
          console.log('🤖 Added AI message to popup:', aiMessage);
          
          return {
            ...popup,
            messages: updatedMessages
          };
        }
        return popup;
      }));

      // Save AI message to database
      await saveChatMessage(popupId, aiMessage);
      console.log('💾 Saved AI message to database');

      return {
        success: true,
        bannerState: { message: 'Message sent successfully!', type: 'success' as const }
      };

    } catch (error) {
      console.error('❌ Error in sendMessageWithHashVerification:', error);
      
      // Add error message to popup
      const errorMessage = {
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setChatPopups(prev => prev.map(popup => {
        if (popup.id === popupId) {
          return {
            ...popup,
            messages: [...popup.messages, errorMessage]
          };
        }
        return popup;
      }));

      return {
        success: false,
        bannerState: { message: 'Failed to send message', type: 'error' as const }
      };
    }
  }, [saveChatMessage]);

  const saveChatMessage = useCallback(async (popupId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    try {
      console.log('💾 Saving chat message to database:', { popupId, message });
      
      const { error } = await supabase
        .from('popup_chats')
        .update({
          messages: supabase.raw(`jsonb_insert(messages, '{${(chatPopups.find(p => p.id === popupId)?.messages.length || 0)}}', '${JSON.stringify(message)}')`)
        })
        .eq('id', popupId);

      if (error) {
        console.error('❌ Error saving chat message:', error);
        throw error;
      }

      console.log('✅ Chat message saved successfully');
    } catch (error) {
      console.error('❌ Error in saveChatMessage:', error);
      toast({
        title: "Error",
        description: "Failed to save chat message",
        variant: "destructive"
      });
    }
  }, [chatPopups, toast]);

  const value: SimplePopupContextProps = {
    chatPopups,
    commentBoxes,
    createChatPopup,
    createCommentBox,
    closeChatPopup,
    minimizeChatPopup,
    closeCommentBox,
    minimizeCommentBox,
    sendMessageWithHashVerification,
    saveChatMessage
  };

  return (
    <SimplePopupContext.Provider value={value}>
      {children}
      <SimplePopupRenderer 
        chatPopups={chatPopups}
        commentBoxes={commentBoxes}
        onCloseChatPopup={closeChatPopup}
        onMinimizeChatPopup={minimizeChatPopup}
        onCloseCommentBox={closeCommentBox}
        onMinimizeCommentBox={minimizeCommentBox}
        projectId={projectId}
        chapterId={chapterId}
      />
    </SimplePopupContext.Provider>
  );
};
