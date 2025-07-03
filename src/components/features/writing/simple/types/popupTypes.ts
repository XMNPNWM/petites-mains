
export interface SimplePopup {
  id: string;
  type: 'comment' | 'chat';
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText?: string | null;
  lineNumber?: number | null;
  textPosition?: number | null;
  isMinimized: boolean;
  createdAt: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  status: 'open' | 'closed' | 'minimized';
}

// Legacy type alias for backward compatibility
export type Popup = SimplePopup;

export interface PopupContextProps {
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

export interface SimplePopupManagerProps {
  projectId: string;
  chapterId?: string;
  textContent?: string;
  popups: SimplePopup[];
  setPopups: (popups: SimplePopup[]) => void;
  onTextSelect?: (text: string, position: number) => void;
}
