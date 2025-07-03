import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePopupNavigation } from './hooks/usePopupNavigation';
import { usePopupCreation } from './hooks/usePopupCreation';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { ContentHashService } from '@/services/ContentHashService';
import { SimplePopup, SimplePopupManagerProps } from './types/popupTypes';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { supabase } from '@/integrations/supabase/client';

interface SimplePopupContextType {
  livePopups: SimplePopup[];
  popups: SimplePopup[];
  createPopup: (
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => Promise<void>;
  updatePopup: (id: string, updates: Partial<SimplePopup>) => void;
  closePopup: (id: string) => Promise<void>;
  deletePopup: (id: string) => Promise<void>;
  reopenPopup: (
    id: string,
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string
  ) => Promise<void>;
  goToLine: (chapterId: string, lineNumber: number) => Promise<boolean>;
  timelineVersion: number;
  sendMessageWithHashVerification?: (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => Promise<{ success: boolean; bannerState?: { message: string; type: 'success' | 'error' | 'loading' } }>;
}

const SimplePopupContext = createContext<SimplePopupContextType | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

export const SimplePopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popups, setPopups] = useState<SimplePopup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { saveChat, loadChatById, deleteChat } = useChatDatabase();
  const { goToLine } = usePopupNavigation();
  const { createPopupData } = usePopupCreation();

  const createPopup = useCallback(async (
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => {
    const newPopup = createPopupData(type, position, projectId, chapterId, selectedText, lineNumber);
    setPopups(prev => [...prev, newPopup]);
    setTimelineVersion(prev => prev + 1);

    // Save to database
    try {
      const chatSession = {
        id: newPopup.id,
        type: newPopup.type,
        position: newPopup.position,
        isMinimized: newPopup.isMinimized,
        createdAt: newPopup.createdAt,
        projectId: newPopup.projectId,
        chapterId: newPopup.chapterId,
        selectedText: newPopup.selectedText ? {
          text: newPopup.selectedText,
          startOffset: newPopup.textPosition || 0,
          endOffset: (newPopup.textPosition || 0) + newPopup.selectedText.length,
          lineNumber: newPopup.lineNumber
        } : undefined,
        lineNumber: newPopup.lineNumber,
        messages: newPopup.messages,
        status: 'active' as const
      };

      await saveChat(chatSession);
    } catch (error) {
      console.error('Failed to save popup to database:', error);
    }
  }, [createPopupData, saveChat]);

  const updatePopup = useCallback((id: string, updates: Partial<SimplePopup>) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, ...updates } : popup
    ));
  }, []);

  const closePopup = useCallback(async (id: string) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, status: 'closed' } : popup
    ));
    setTimelineVersion(prev => prev + 1);
  }, []);

  const deletePopup = useCallback(async (id: string) => {
    console.log('🗑️ Deleting popup with database cleanup:', id);
    
    try {
      // Remove from state immediately
      setPopups(prev => prev.filter(popup => popup.id !== id));
      
      // Clean up from database
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Failed to delete from database:', error);
      } else {
        console.log('✅ Popup deleted from database successfully');
      }
    } catch (error) {
      console.error('Error during popup deletion:', error);
    }
  }, []);

  const reopenPopup = useCallback(async (
    id: string,
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string
  ) => {
    try {
      // Check if already open to prevent duplication
      const existingPopup = popups.find(popup => popup.id === id && popup.status === 'open');
      if (existingPopup) {
        console.log('Popup already open:', id);
        return;
      }

      // Load existing popup from database
      const dbPopup = await loadChatById(id);
      if (dbPopup) {
        console.log('Loaded popup from database:', dbPopup);
        
        // Convert database popup to SimplePopup format
        const reopenedPopup: SimplePopup = {
          id: dbPopup.id,
          type: dbPopup.type as 'comment' | 'chat',
          position: dbPopup.position,
          projectId: dbPopup.projectId,
          chapterId: dbPopup.chapterId,
          selectedText: dbPopup.selectedText?.text || null,
          lineNumber: dbPopup.lineNumber || null,
          textPosition: dbPopup.selectedText?.startOffset || null,
          isMinimized: dbPopup.isMinimized,
          createdAt: new Date(dbPopup.createdAt),
          messages: dbPopup.messages || [],
          status: 'open'
        };

        // Remove any existing closed version and add the reopened one
        setPopups(prev => {
          const filtered = prev.filter(popup => popup.id !== id);
          return [...filtered, reopenedPopup];
        });
        
        setTimelineVersion(prev => prev + 1);
      } else {
        console.log('Popup not found in database, creating new one');
        // If not found in database, create a new popup
        await createPopup(type, position, projectId, chapterId, selectedText);
      }
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  }, [popups, createPopup, loadChatById]);

  const sendMessageWithHashVerification = useCallback(async (
    popupId: string, 
    message: string, 
    projectId: string, 
    chapterId?: string
  ) => {
    console.log('🔄 Starting hash-aware AI workflow:', { popupId, projectId, chapterId });
    
    try {
      let shouldAnalyze = false;
      let analysisReason = '';
      
      // Step 1: Check if project has ever been analyzed
      const existingKnowledge = await SmartAnalysisOrchestrator.getProjectKnowledge(projectId);
      const hasNeverAnalyzed = existingKnowledge.length === 0;
      
      if (hasNeverAnalyzed) {
        console.log('🆕 Project has never been analyzed - triggering comprehensive analysis');
        shouldAnalyze = true;
        analysisReason = 'initial comprehensive analysis';
      } else {
        // Step 2: Hash verification for existing projects
        console.log('📋 Performing hash verification to check for content changes');
        
        try {
          const { data: chapters } = await supabase
            .from('chapters')
            .select('id, content, title')
            .eq('project_id', projectId);

          let hasChanges = false;
          let changedChapters = 0;
          
          if (chapters) {
            for (const chapter of chapters) {
              if (chapter.content) {
                const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
                if (hashResult.hasChanges) {
                  hasChanges = true;
                  changedChapters++;
                  console.log(`🚨 Chapter "${chapter.title}" has changes - analysis needed`);
                }
              }
            }
          }
          
          if (hasChanges) {
            shouldAnalyze = true;
            analysisReason = `content re-analysis (${changedChapters} chapters changed)`;
            console.log(`🚨 Content changes detected in ${changedChapters} chapters - analysis needed`);
          } else {
            console.log('✅ All content is up-to-date - no analysis needed');
          }
        } catch (hashError) {
          console.error('❌ Hash verification failed:', hashError);
          console.log('⚠️ Continuing without hash verification due to error');
        }
      }

      // Step 3: Run analysis if needed
      if (shouldAnalyze) {
        console.log(`🧠 Starting ${analysisReason} before AI chat`);
        
        // Show analyzing banner
        const analysisMessage = hasNeverAnalyzed 
          ? 'Performing initial analysis of your project before responding...'
          : `Analyzing latest content changes (${analysisReason}) before responding...`;
        
        // Update popup to show analysis in progress
        setPopups(prev => prev.map(popup => 
          popup.id === popupId 
            ? { 
                ...popup, 
                messages: [...(popup.messages || []), {
                  role: 'assistant' as const,
                  content: analysisMessage,
                  timestamp: new Date()
                }]
              }
            : popup
        ));

        try {
          // Run the hash-aware comprehensive analysis
          const result = await SmartAnalysisOrchestrator.analyzeProject(projectId);
          console.log('✅ Hash-aware analysis completed:', result);
          
          // Update the popup to show analysis completion with hash savings info
          const completionMessage = result.processingStats?.hashVerificationSaved
            ? `Analysis completed! Extracted ${result.processingStats?.knowledgeExtracted || 0} knowledge items. Saved costs by skipping ${result.processingStats?.chaptersSkipped || 0} unchanged chapters. Now processing your message...`
            : `Analysis completed! Extracted ${result.processingStats?.knowledgeExtracted || 0} knowledge items. Now processing your message...`;
            
          setPopups(prev => prev.map(popup => 
            popup.id === popupId 
              ? { 
                  ...popup, 
                  messages: [...(popup.messages || []).slice(0, -1), {
                    role: 'assistant' as const,
                    content: completionMessage,
                    timestamp: new Date()
                  }]
                }
              : popup
          ));
          
        } catch (analysisError) {
          console.error('❌ Analysis failed:', analysisError);
          
          // Update popup to show analysis failure but continue
          setPopups(prev => prev.map(popup => 
            popup.id === popupId 
              ? { 
                  ...popup, 
                  messages: [...(popup.messages || []).slice(0, -1), {
                    role: 'assistant' as const,
                    content: 'Analysis encountered issues but continuing with your message...',
                    timestamp: new Date()
                  }]
                }
              : popup
          ));
        }
      } else {
        console.log('✅ Content is up-to-date, proceeding directly to AI response');
      }

      // Step 4: Add user message to popup
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };

      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), userMessage] }
          : popup
      ));

      // Step 5: Call the chat-with-ai edge function for the actual response
      console.log('🤖 Calling AI service with updated context:', { message, projectId, chapterId });
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message, 
          projectId, 
          chapterId 
        }
      });

      console.log('🤖 AI service response:', { data, error });

      if (error) {
        console.error('❌ AI service error:', error);
        throw new Error(`AI service failed: ${error.message}`);
      }

      if (!data?.success || !data?.response) {
        console.error('❌ Invalid AI response:', data);
        throw new Error(data?.error || 'AI service returned invalid response');
      }

      // Step 6: Add AI response to popup
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };

      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), aiMessage] }
          : popup
      ));

      // Step 7: Save conversation to database
      try {
        const conversationMessages = [
          {
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp.toISOString()
          },
          {
            role: aiMessage.role,
            content: aiMessage.content,
            timestamp: aiMessage.timestamp.toISOString()
          }
        ];

        const { error: saveError } = await supabase
          .from('chat_sessions')
          .upsert({
            id: popupId,
            project_id: projectId,
            chapter_id: chapterId,
            chat_type: 'chat',
            messages: conversationMessages,
            position: { x: 100, y: 100 },
            status: 'active',
            selected_text: null
          });

        if (saveError) {
          console.error('Failed to save conversation:', saveError);
        }
      } catch (dbError) {
        console.error('Database error saving conversation:', dbError);
      }

      console.log('✅ Hash-aware AI workflow completed successfully');
      
      return {
        success: true,
        bannerState: { 
          message: shouldAnalyze 
            ? 'Analysis completed and message sent successfully!' 
            : 'Message sent successfully!', 
          type: 'success' as const 
        }
      };

    } catch (error) {
      console.error('❌ Hash-aware AI workflow failed:', error);
      
      // Add error message to popup
      const errorMessage = {
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), errorMessage] }
          : popup
      ));
      
      return {
        success: false,
        bannerState: { 
          message: error instanceof Error ? error.message : 'Failed to send message', 
          type: 'error' as const 
        }
      };
    }
  }, []);

  const value = {
    livePopups: popups.filter(popup => popup.status === 'open'),
    popups,
    createPopup,
    updatePopup,
    closePopup,
    deletePopup,
    reopenPopup,
    goToLine,
    timelineVersion,
    sendMessageWithHashVerification
  };

  return (
    <SimplePopupContext.Provider value={value}>
      {children}
    </SimplePopupContext.Provider>
  );
};

// Legacy component for backward compatibility
const SimplePopupManager = ({ 
  projectId, 
  chapterId, 
  textContent, 
  popups, 
  setPopups,
  onTextSelect 
}: SimplePopupManagerProps) => {
  return null; // This component is now deprecated in favor of the provider pattern
};

export default SimplePopupManager;
