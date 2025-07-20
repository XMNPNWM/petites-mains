/**
 * Text manipulation utilities for content editing and change application
 */

/**
 * Replace text at specific position in content
 */
export function applyTextReplacement(
  content: string,
  startPosition: number,
  endPosition: number,
  replacementText: string
): string {
  if (startPosition < 0 || endPosition > content.length || startPosition > endPosition) {
    console.warn('Invalid position parameters for text replacement');
    return content;
  }

  return content.slice(0, startPosition) + replacementText + content.slice(endPosition);
}

/**
 * Optimize paragraph organization by adding proper line breaks
 */
export function optimizeParagraphs(content: string): string {
  if (!content) return content;

  // Split content into paragraphs and clean up
  const paragraphs = content
    .split(/\n\s*\n/) // Split on double line breaks
    .map(p => p.trim()) // Remove leading/trailing whitespace
    .filter(p => p.length > 0); // Remove empty paragraphs

  // Join with double line breaks for proper paragraph separation
  return paragraphs.join('\n\n');
}

/**
 * Calculate position shifts when multiple changes are applied
 */
export function calculatePositionShifts(
  changes: Array<{
    position_start: number;
    position_end: number;
    original_text: string;
    enhanced_text: string;
    user_decision: string;
  }>
): Array<{ changeIndex: number; positionShift: number }> {
  const sortedChanges = changes
    .map((change, index) => ({ ...change, originalIndex: index }))
    .sort((a, b) => a.position_start - b.position_start);

  const shifts: Array<{ changeIndex: number; positionShift: number }> = [];
  let cumulativeShift = 0;

  sortedChanges.forEach((change) => {
    shifts.push({
      changeIndex: change.originalIndex,
      positionShift: cumulativeShift
    });

    // Calculate how this change affects position
    if (change.user_decision === 'rejected') {
      const originalLength = change.original_text.length;
      const enhancedLength = change.enhanced_text.length;
      cumulativeShift += originalLength - enhancedLength;
    }
  });

  return shifts;
}

/**
 * Apply multiple text changes while handling position shifts
 * Updated for hybrid diff + embedding change detection system
 */
export function applyMultipleChanges(
  content: string,
  changes: Array<{
    position_start: number;
    position_end: number;
    original_text: string;
    enhanced_text: string;
    user_decision: string;
  }>
): string {
  if (!changes.length) return content;

  // Sort changes by position (descending to avoid position shift issues)
  const sortedChanges = changes
    .filter(change => change.user_decision === 'rejected')
    .sort((a, b) => b.position_start - a.position_start);

  let result = content;

  // Apply changes from end to beginning to avoid position shift issues
  sortedChanges.forEach(change => {
    // Validate that the position and text still match before applying
    const currentText = result.slice(change.position_start, change.position_end);
    
    // For hybrid detection, we need to be more flexible with text matching
    // since the enhanced text might have slight variations
    if (currentText === change.enhanced_text || 
        normalizeForComparison(currentText) === normalizeForComparison(change.enhanced_text)) {
      result = applyTextReplacement(
        result,
        change.position_start,
        change.position_end,
        change.original_text
      );
    } else {
      console.warn('Position mismatch detected - skipping change application:', {
        expectedText: change.enhanced_text.substring(0, 50),
        actualText: currentText.substring(0, 50),
        position: change.position_start
      });
    }
  });

  return result;
}

/**
 * Normalize text for comparison in change application
 */
function normalizeForComparison(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Validate text positions are still accurate after edits
 */
export function validateTextPositions(
  content: string,
  changes: Array<{
    position_start: number;
    position_end: number;
    enhanced_text: string;
  }>
): boolean {
  return changes.every(change => {
    const extractedText = content.slice(change.position_start, change.position_end);
    return extractedText === change.enhanced_text;
  });
}