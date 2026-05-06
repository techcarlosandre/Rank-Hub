import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Next.js 16 com Turbopack já gerencia o monitoramento de arquivos de forma eficiente.
  // Removi o 'webpack' e 'eslint' que causaram o erro.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Se precisar de configurações específicas para o Turbopack, elas entram aqui:
  experimental: {
    // turbopack: {} // Pode ser deixado vazio ou com opções específicas
  }
};

export default nextConfig;
