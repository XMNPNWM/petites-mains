import DOMPurify from 'dompurify';

// Security configuration for HTML sanitization
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote'
  ],
  ALLOWED_ATTR: [
    'class', 'style'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting
 * @param dirty - The HTML content to sanitize
 * @param options - Optional configuration to override defaults
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: string, options: Partial<typeof SAFE_HTML_CONFIG> = {}): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  const config = { ...SAFE_HTML_CONFIG, ...options };
  
  try {
    const clean = DOMPurify.sanitize(dirty, config);
    
    // Log sanitization events for monitoring (in development)
    if (process.env.NODE_ENV === 'development' && clean !== dirty) {
      console.warn('HTML content was sanitized:', {
        original: dirty.length,
        sanitized: clean.length,
        diff: dirty.length - clean.length
      });
    }
    
    return clean;
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Fallback to basic escaping if sanitization fails
    return escapeHtml(dirty);
  }
};

/**
 * Basic HTML escaping for fallback scenarios
 * @param unsafe - The string to escape
 * @returns HTML-escaped string
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe || typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates content for potential security issues
 * @param content - Content to validate
 * @returns Object with validation results
 */
export const validateContent = (content: string): {
  isValid: boolean;
  issues: string[];
  riskLevel: 'low' | 'medium' | 'high';
} => {
  const issues: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  if (!content || typeof content !== 'string') {
    return { isValid: true, issues: [], riskLevel: 'low' };
  }
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /data:text\/html/i
  ];
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push(`Potentially dangerous pattern detected: ${pattern.source}`);
      riskLevel = 'high';
    }
  });
  
  // Check for suspicious AI prompt injection patterns
  const promptInjectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s*:\s*you\s+are/i,
    /\[INST\]/i,
    /\{\{.*\}\}/,
    /assistant\s*:\s*i/i
  ];
  
  promptInjectionPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push(`Potential prompt injection detected: ${pattern.source}`);
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    riskLevel
  };
};

/**
 * Rate limiting store for tracking usage
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting function
 * @param key - Unique identifier (e.g., user ID)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Whether the request is allowed
 */
export const checkRateLimit = (key: string, limit: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
};