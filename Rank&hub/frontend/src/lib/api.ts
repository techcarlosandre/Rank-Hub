// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Relative path for Vercel functions as defined in vercel.json rewrites
export const VERCEL_API_PREFIX = '/_/backend';

export const getApiUrl = (endpoint: string) => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (process.env.NODE_ENV === 'production') {
    return `${VERCEL_API_PREFIX}${cleanEndpoint}`;
  }
  return `${API_BASE_URL || 'http://127.0.0.1:5000'}${cleanEndpoint}`;
};
