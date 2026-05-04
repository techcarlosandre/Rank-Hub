/**
 * Central de Configuração da API - Rank&Hub
 * Detecta automaticamente se o ambiente é local ou produção (Vercel)
 */

// No seu computador, o Flask roda em http://127.0.0.1:5000
// Na Vercel, o Flask responde no prefixo configurado no vercel.json
const isProd = process.env.NODE_ENV === 'production';

// Usamos '/_/backend' conforme exigido pela sua configuração da Vercel
export const API_BASE_URL = isProd 
  ? '/_/backend' 
  : 'http://127.0.0.1:5000/api';

/**
 * Função utilitária para montar URLs da API
 */
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
