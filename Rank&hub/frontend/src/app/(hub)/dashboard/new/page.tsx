'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

import { motion } from 'framer-motion';

export default function NewRankingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAIProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(">>> BOTÃO CLICADO!");
    
    if (!prompt) {
      console.warn("Prompt vazio!");
      return;
    }
    
    if (!user) {
      console.error("Usuário não encontrado no contexto de autenticação!");
      setError("Erro de autenticação: Usuário não identificado. Tente fazer login novamente.");
      return;
    }
    
    console.log("Iniciando processamento IA para o usuário:", user.nome);
    setLoading(true);
    setError(null);
    
    try {
      console.log("Chamando API AI...");
      const response = await fetch(getApiUrl('/api/generate-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const result = await response.json();
      console.log("Dados recebidos da IA:", result);

      if (!response.ok) {
        throw new Error(result.error || `Erro do Servidor (${response.status})`);
      }
      
      console.log("Enviando para criação de ranking...");
      const saveRes = await fetch(getApiUrl('/api/rankings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: result.nome_ranking || 'Novo Ranking IA',
          descricao: result.descricao || '',
          cor_tema_hex: '#ff5528',
          admin_id: user.id,
          regras: result.regras || []
        })
      });
      
      if (!saveRes.ok) {
        const saveError = await saveRes.json();
        throw new Error(saveError.error || 'Erro ao salvar o ranking no banco de dados');
      }

      const newRanking = await saveRes.json();
      console.log("Ranking criado! Redirecionando...");
      router.push(`/r/${newRanking.id}`);
    } catch (err: any) {
      console.error("FALHA NO PROCESSO IA:", err);
      setError(err.message || 'Ocorreu um erro inesperado ao processar com IA.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-3xl overflow-y-auto py-10 px-4 sm:px-6">
      <div className="min-h-full w-full flex flex-col items-center justify-center">
      
      {/* Close Button */}
      <Link 
        href="/dashboard"
        className="absolute top-10 right-10 z-[110] group"
      >
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-red-500/20 group-hover:border-red-500/50 transition-all duration-300 backdrop-blur-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </motion.div>
      </Link>

      {/* Decorative Floating Icons */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-6xl animate-bounce-slow">🧠</div>
        <div className="absolute bottom-1/4 right-1/4 text-6xl animate-bounce-slow" style={{ animationDelay: '1s' }}>⚙️</div>
        <div className="absolute top-1/3 right-1/4 text-5xl animate-pulse">✨</div>
        <div className="absolute bottom-1/3 left-1/3 text-4xl animate-pulse" style={{ animationDelay: '1.5s' }}>📊</div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg text-center space-y-8"
      >
        <header className="space-y-6">
          <div className="relative inline-block">
             <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-7xl mb-4"
              >
                🧠
              </motion.div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter">
                Pódio IA
              </h1>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Inteligência Artificial</p>
          </div>
        </header>

        <div className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center leading-relaxed"
            >
              <strong>Atenção:</strong> {error}
              <br/>
              <span className="text-[10px] opacity-60 mt-1 block">Verifique o arquivo backend/.env</span>
            </motion.div>
          )}

          <div className="text-left space-y-4">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Descreva seu ranking</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Ranking de vendas onde cada contrato vale 100 pontos..."
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/10 focus:border-accent outline-none transition-all resize-none text-sm leading-relaxed"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAIProcess}
            disabled={loading || !prompt}
            className="w-full bg-accent text-white font-bold py-5 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-20 shadow-lg shadow-accent/20"
          >
            {loading ? 'Processando...' : 'Criar com IA'}
          </motion.button>
          
          <Link href="/dashboard/new/manual" className="block text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors">
            Ou configurar manualmente
          </Link>
        </div>
      </motion.div>




      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
      </div>
    </div>
  );
}

