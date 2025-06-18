
export const calculateSafePosition = (
  position: { x: number; y: number },
  type: 'comment' | 'chat'
): { x: number; y: number } => {
  const width = type === 'comment' ? 370 : 470;
  const height = type === 'comment' ? 420 : 570;
  
  return {
    x: Math.max(20, Math.min(position.x, window.innerWidth - width)),
    y: Math.max(20, Math.min(position.y, window.innerHeight - height))
  };
};

export const calculateTextPosition = (
  selectedText: string,
  lineNumber: number
): number | null => {
  if (!selectedText || !lineNumber || lineNumber <= 0) return null;
  
  const textarea = document.querySelector('textarea');
  if (!textarea) return null;

  const lines = textarea.value.split('\n');
  let charPosition = 0;
  
  for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
    if (lines[i]) {
      charPosition += lines[i].length + 1; // +1 for newline
    }
  }
  
  // Find the position of the selected text within the line
  if (lines[lineNumber - 1]) {
    const textInLine = lines[lineNumber - 1].indexOf(selectedText);
    if (textInLine >= 0) {
      return charPosition + textInLine;
    }
  }
  
  return null;
};

export const createInitialMessages = (
  type: 'comment' | 'chat',
  selectedText?: string,
  lineNumber?: number
): Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> => {
  if (type === 'comment') {
    if (selectedText && lineNumber) {
      return [{
        role: 'assistant',
        content: `You're commenting on line ${lineNumber}: "${selectedText}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    } else {
      return [{
        role: 'assistant',
        content: `Comment created. What would you like to note?`,
        timestamp: new Date()
      }];
    }
  } else if (type === 'chat') {
    return [{
      role: 'assistant',
      content: `Hello! I'm your AI writing assistant. I have access to all your project chapters and I'm here to help you with your story. What would you like to discuss?`,
      timestamp: new Date()
    }];
  }
  
  return [];
};
