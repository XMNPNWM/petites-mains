
export const hasValidNavigationData = (chapterId?: string, lineNumber?: number | null): boolean => {
  return Boolean(
    chapterId && 
    lineNumber !== null && 
    lineNumber !== undefined && 
    lineNumber > 0
  );
};

export const getNavigationStatusMessage = (chapterId?: string, lineNumber?: number | null): string => {
  if (!chapterId) {
    return "Comment created outside text editor";
  }
  if (!lineNumber || lineNumber < 1) {
    return "No line information available";
  }
  return "";
};

export const scrollToLineEnhanced = (lineNumber: number): void => {
  try {
    console.log('Enhanced scroll to line with validation:', lineNumber);
    
    // Find the textarea with more robust selectors
    const textareas = document.querySelectorAll('textarea');
    let textarea: HTMLTextAreaElement | null = null;
    
    // Try to find the main content textarea (usually the largest one)
    for (const ta of textareas) {
      if (ta.value && ta.value.length > 50) {
        textarea = ta;
        break;
      }
    }
    
    if (!textarea && textareas.length > 0) {
      textarea = textareas[0]; // Fallback to first textarea
    }
    
    if (!textarea) {
      console.warn('No textarea found for line navigation');
      return;
    }

    const content = textarea.value;
    const lines = content.split('\n');
    
    if (lineNumber <= 0 || lineNumber > lines.length) {
      console.warn('Invalid line number for content:', { 
        requestedLine: lineNumber, 
        totalLines: lines.length,
        hasContent: content.length > 0
      });
      return;
    }

    // Calculate character position with validation
    let charPosition = 0;
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      charPosition += lines[i].length + 1; // +1 for newline
    }

    // Focus and set cursor position
    textarea.focus();
    textarea.setSelectionRange(charPosition, charPosition);

    // Enhanced scrolling calculation with error handling
    const computedStyle = getComputedStyle(textarea);
    const lineHeight = Math.max(parseFloat(computedStyle.lineHeight) || 24, 20);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
    
    // Calculate scroll position to center the line
    const targetScrollTop = Math.max(0, (lineNumber - 1) * lineHeight);
    const textareaHeight = textarea.clientHeight;
    const centeredScrollTop = Math.max(0, targetScrollTop - (textareaHeight / 2) + paddingTop);
    
    // Smooth scroll to position
    textarea.scrollTo({
      top: centeredScrollTop,
      behavior: 'smooth'
    });
    
    // Enhanced visual highlight effect
    const originalBorder = textarea.style.border;
    const originalBoxShadow = textarea.style.boxShadow;
    
    textarea.style.border = '3px solid #3b82f6';
    textarea.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
    
    setTimeout(() => {
      textarea.style.border = originalBorder;
      textarea.style.boxShadow = originalBoxShadow;
    }, 2500);
    
    console.log('Successfully navigated to line with enhanced feedback:', {
      lineNumber,
      charPosition,
      scrollTop: centeredScrollTop,
      lineHeight
    });
  } catch (error) {
    console.error('Error in enhanced scrollToLine:', error);
  }
};
