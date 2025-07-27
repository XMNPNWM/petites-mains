import { supabase } from "@/integrations/supabase/client";

/**
 * Content Security Policy middleware for enhanced security
 */
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

/**
 * Apply security headers to responses
 */
export const applySecurityHeaders = (response: Response): Response => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

/**
 * Security monitoring for suspicious activities
 */
export const logSecurityEvent = async (
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' = 'medium'
) => {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY] ${severity.toUpperCase()}: ${event}`, details);
    }
    
    // In production, you could send to monitoring service
    // await sendToMonitoringService({ event, details, severity, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Rate limiting store for client-side tracking
 */
const clientRateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Client-side rate limiting helper
 */
export const checkClientRateLimit = (
  key: string, 
  limit: number = 60, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const existing = clientRateLimits.get(key);
  
  if (!existing || now > existing.resetTime) {
    clientRateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= limit) {
    logSecurityEvent('rate_limit_exceeded', { key, limit, window: windowMs }, 'medium');
    return false;
  }
  
  existing.count++;
  return true;
};