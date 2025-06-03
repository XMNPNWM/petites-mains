
export interface ChatSession {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  selected_text?: string;
  text_position?: number;
  is_minimized: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export interface SelectedTextContext {
  text: string;
  startOffset: number;
  endOffset: number;
}

// Database type for what comes from Supabase
export interface DbChatSession {
  id: string;
  project_id: string;
  chapter_id?: string;
  chat_type: string;
  position: any;
  messages: any;
  selected_text?: string;
  text_position?: number;
  is_minimized: boolean;
  created_at: string;
  updated_at: string;
}

// Local type for in-memory operations
export interface LocalChatSession {
  id: string;
  type: 'comment' | 'coherence' | 'next-steps' | 'chat';
  position: { x: number; y: number };
  isMinimized: boolean;
  createdAt: Date;
  projectId: string;
  chapterId?: string;
  selectedText?: SelectedTextContext;
  messages?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
}

// Utility functions for type conversion
export const convertDbToLocal = (dbSession: DbChatSession): LocalChatSession => {
  return {
    id: dbSession.id,
    type: dbSession.chat_type as 'comment' | 'coherence' | 'next-steps' | 'chat',
    position: dbSession.position as { x: number; y: number },
    isMinimized: dbSession.is_minimized,
    createdAt: new Date(dbSession.created_at),
    projectId: dbSession.project_id,
    chapterId: dbSession.chapter_id,
    selectedText: dbSession.selected_text ? {
      text: dbSession.selected_text,
      startOffset: dbSession.text_position || 0,
      endOffset: (dbSession.text_position || 0) + dbSession.selected_text.length
    } : undefined,
    messages: (dbSession.messages as any[])?.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) || []
  };
};

export const convertLocalToDb = (localSession: LocalChatSession): any => {
  return {
    id: localSession.id,
    project_id: localSession.projectId,
    chapter_id: localSession.chapterId,
    chat_type: localSession.type,
    position: localSession.position,
    messages: (localSession.messages || []).map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    })),
    selected_text: localSession.selectedText?.text,
    text_position: localSession.selectedText?.startOffset,
    is_minimized: localSession.isMinimized
  };
};

export const convertDbToChatSession = (dbSession: DbChatSession): ChatSession => {
  return {
    id: dbSession.id,
    project_id: dbSession.project_id,
    chapter_id: dbSession.chapter_id,
    chat_type: dbSession.chat_type as 'comment' | 'coherence' | 'next-steps' | 'chat',
    position: dbSession.position as { x: number; y: number },
    messages: (dbSession.messages as any[])?.map((msg: any) => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString()
    })) || [],
    selected_text: dbSession.selected_text,
    text_position: dbSession.text_position,
    is_minimized: dbSession.is_minimized,
    created_at: dbSession.created_at,
    updated_at: dbSession.updated_at
  };
};
