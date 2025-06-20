
export const renderFormattedContent = (content: string): string => {
  if (!content) return '';
  
  let processed = content;
  
  // Convert markdown-style bold to HTML
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown-style italic to HTML (single asterisks, but not within bold)
  processed = processed.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert HTML font size tags to styled spans
  processed = processed.replace(/<span style="font-size: ([^"]+)">(.*?)<\/span>/g, 
    '<span style="font-size: $1">$2</span>');
  
  // Preserve line breaks
  processed = processed.replace(/\n/g, '<br>');
  
  return processed;
};

export const getPlainTextFromFormatted = (formattedContent: string): string => {
  if (!formattedContent) return '';
  
  // Remove HTML tags but preserve line breaks
  let plainText = formattedContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  
  return plainText;
};

// Helper function to insert formatting at cursor position
export const insertFormattingAtCursor = (
  textarea: HTMLTextAreaElement, 
  startTag: string, 
  endTag: string = ''
): string => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const actualEndTag = endTag || startTag;
  
  let newText;
  if (selectedText) {
    // Wrap selected text
    newText = textarea.value.substring(0, start) + 
              startTag + selectedText + actualEndTag + 
              textarea.value.substring(end);
  } else {
    // Insert tags at cursor position
    newText = textarea.value.substring(0, start) + 
              startTag + actualEndTag + 
              textarea.value.substring(start);
  }
  
  return newText;
};
