const isProd = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProd 
  ? '/_/backend/api' 
  : 'http://127.0.0.1:5000/api';

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
