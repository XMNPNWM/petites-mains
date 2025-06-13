export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // Remove HTML tags using regex
  const stripped = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = stripped;
  
  return textarea.value;
};

export const getWordCount = (text: string): number => {
  if (!text) return 0;
  
  const cleanText = stripHtmlTags(text);
  return cleanText.split(' ').filter(word => word.length > 0).length;
};

export const getTextPreview = (content: string, maxLength: number = 100, fromEnd: boolean = false): string => {
  if (!content) return '';
  
  const cleanText = stripHtmlTags(content).trim();
  if (!cleanText) return '';
  
  if (cleanText.length <= maxLength) return cleanText;
  
  if (fromEnd) {
    // Get preview from the end of the content
    const endText = cleanText.slice(-maxLength);
    
    // Try to start from a word boundary to avoid cutting words
    const spaceIndex = endText.indexOf(' ');
    if (spaceIndex > 0 && spaceIndex < endText.length / 2) {
      return '...' + endText.slice(spaceIndex + 1);
    }
    
    return '...' + endText;
  } else {
    // Get preview from the beginning (existing behavior)
    const truncated = cleanText.slice(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
      return truncated.slice(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }
};
