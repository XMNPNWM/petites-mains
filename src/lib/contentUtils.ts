
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

export const getTextPreview = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  const cleanText = stripHtmlTags(text);
  if (cleanText.length <= maxLength) return cleanText;
  
  return cleanText.substring(0, maxLength) + '...';
};
