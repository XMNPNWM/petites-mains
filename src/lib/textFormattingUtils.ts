
export interface TextSelection {
  start: number;
  end: number;
  selectedText: string;
}

export const getTextSelection = (textarea: HTMLTextAreaElement): TextSelection => {
  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    selectedText: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
  };
};

export const insertTextAtSelection = (
  textarea: HTMLTextAreaElement,
  newText: string,
  selectNewText: boolean = false
): void => {
  const { start, end } = getTextSelection(textarea);
  const value = textarea.value;
  
  const newValue = value.substring(0, start) + newText + value.substring(end);
  textarea.value = newValue;
  
  // Trigger change event
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
  
  // Set cursor position
  const newCursorPos = selectNewText ? start : start + newText.length;
  textarea.setSelectionRange(newCursorPos, selectNewText ? start + newText.length : newCursorPos);
  textarea.focus();
};

export const wrapSelectedText = (
  textarea: HTMLTextAreaElement,
  wrapper: string,
  endWrapper?: string
): void => {
  const selection = getTextSelection(textarea);
  const actualEndWrapper = endWrapper || wrapper;
  
  if (selection.selectedText) {
    const wrappedText = `${wrapper}${selection.selectedText}${actualEndWrapper}`;
    insertTextAtSelection(textarea, wrappedText, true);
  } else {
    // If no text selected, insert wrapper and position cursor inside
    const wrappedText = `${wrapper}${actualEndWrapper}`;
    insertTextAtSelection(textarea, wrappedText);
    textarea.setSelectionRange(selection.start + wrapper.length, selection.start + wrapper.length);
  }
};

export const applyBoldFormatting = (textarea: HTMLTextAreaElement): void => {
  wrapSelectedText(textarea, '**');
};

export const applyItalicFormatting = (textarea: HTMLTextAreaElement): void => {
  wrapSelectedText(textarea, '*');
};

export const applyFontSize = (textarea: HTMLTextAreaElement, size: string): void => {
  wrapSelectedText(textarea, `<span style="font-size: ${size}">`, '</span>');
};

export const findAndReplace = (
  content: string,
  findText: string,
  replaceText: string,
  replaceAll: boolean = false
): { newContent: string; replacements: number } => {
  if (!findText) return { newContent: content, replacements: 0 };
  
  let replacements = 0;
  let newContent = content;
  
  if (replaceAll) {
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    newContent = content.replace(regex, () => {
      replacements++;
      return replaceText;
    });
  } else {
    const index = content.indexOf(findText);
    if (index !== -1) {
      newContent = content.substring(0, index) + replaceText + content.substring(index + findText.length);
      replacements = 1;
    }
  }
  
  return { newContent, replacements };
};
