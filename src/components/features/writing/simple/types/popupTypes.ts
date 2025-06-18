
export interface SimplePopup {
  id: string;
  type: 'comment' | 'chat';
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText: string | null;
  lineNumber: number | null;
  isMinimized: boolean;
  createdAt: Date;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  status: 'open' | 'closed';
  textPosition: number | null;
}

export interface PopupCreationParams {
  type: 'comment' | 'chat';
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText?: string;
  lineNumber?: number;
}

export interface PopupContextProps {
  livePopups: SimplePopup[];
  popups: SimplePopup[];
  createPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => void;
  updatePopup: (id: string, updates: Partial<SimplePopup>) => void;
  closePopup: (id: string) => void;
  deletePopup: (id: string) => void;
  reopenPopup: (id: string, type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => void;
  goToLine: (chapterId: string, lineNumber: number) => Promise<void>;
  timelineVersion: number;
}
