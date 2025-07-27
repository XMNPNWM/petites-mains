// _shared/cors.ts

// Define your allowed origins
const ALLOWED_ORIGINS = [
  'https://petites-mains.lovable.app',
  'https://aa975d18-a35c-4a78-838b-cbec95b38204.lovableproject.com',
  // For local development (uncomment as needed):
  // 'http://localhost:3000',
  // 'http://localhost:5173', // Common for Vite
  // 'http://127.0.0.1:5173', // Another common Vite variant
];

export function getCorsHeaders(requestOrigin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }
  // If the origin is not allowed, we don't set Access-Control-Allow-Origin
  // This will cause the browser to block the request

  return headers;
}

// Export allowed origins for use in the main function
export { ALLOWED_ORIGINS };

// Simple CORS headers for direct use (production-specific)
export const simpleCorsHeaders = {
  'Access-Control-Allow-Origin': 'https://petites-mains.lovable.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};