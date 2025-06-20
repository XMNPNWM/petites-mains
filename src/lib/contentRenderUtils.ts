
export const renderFormattedContent = (content: string): string => {
  if (!content) return '';
  
  let processed = content;
  
  // Convert markdown-style bold to HTML
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown-style italic to HTML (single asterisks, but not within bold)
  processed = processed.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  
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
