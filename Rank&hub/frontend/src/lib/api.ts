// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Relative path for Vercel functions as defined in vercel.json rewrites
export const VERCEL_API_PREFIX = '/_/backend';

export const getApiUrl = (endpoint: string) => {
  // If we are in production (Vercel), use the relative rewrite path
  if (process.env.NODE_ENV === 'production') {
    return `${VERCEL_API_PREFIX}${endpoint}`;
  }
  // If we are in development, use the environment variable or localhost
  return `${API_BASE_URL || 'http://127.0.0.1:5000'}${endpoint}`;
};
