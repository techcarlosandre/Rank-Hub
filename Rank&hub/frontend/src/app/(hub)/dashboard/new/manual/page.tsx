'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManualRankingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#ff5528');
  const [emoji, setEmoji] = useState('🏆');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomIcon(base64);
        setEmoji(base64); // Usamos o base64 como o valor do ícone
        setShowEmojiPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !user) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiUrl('/api/rankings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome,
          cor_tema_hex: cor,
          admin_id: user.id,
          regras: [] // Começa sem regras
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao criar ranking');
      }

      const newRanking = await response.json();
      router.push(`/r/${newRanking.id}`);
    } catch (err: any) {
      console.error("Erro ao criar ranking:", err);
      setError(err.message || 'Ocorreu um erro ao criar o ranking.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-3xl overflow-y-auto py-10 px-4 sm:px-6">
      <div className="min-h-full w-full flex flex-col items-center justify-center">
      
      <Link 
        href="/dashboard"
        className="absolute top-10 right-10 z-[110] group"
      >
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-red-500/20 group-hover:border-red-500/50 transition-all duration-300 backdrop-blur-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </motion.div>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg text-center space-y-8"
      >
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Novo Ranking</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-bold">Configuração Manual</p>
        </header>

        <form onSubmit={handleCreate} className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Nome da Competição</label>
            <input 
              type="text" 
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Vendas Mensais"
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:border-accent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Ícone</label>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />

              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-3xl text-white flex items-center justify-center hover:border-accent transition-all relative overflow-hidden group min-h-[80px]"
              >
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors"></div>
                <span className="relative z-10 h-12 w-12 flex items-center justify-center">
                  {emoji.startsWith('data:image') ? (
                    <img src={emoji} alt="Custom" className="h-full w-full object-cover rounded-lg shadow-lg" />
                  ) : (
                    emoji
                  )}
                </span>
                <span className="absolute right-4 text-[8px] text-white/20 uppercase font-bold tracking-widest group-hover:text-accent transition-colors">Trocar</span>
              </motion.button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 sm:left-auto sm:w-[280px] mt-3 z-[120] grid grid-cols-5 gap-3 bg-zinc-900/95 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-full flex items-center justify-center rounded-xl text-2xl transition-all border bg-accent/10 border-accent/40 text-accent"
                      >
                        +
                      </motion.button>

                      {[
                        "🏆", "💻", "🏋️", "🚀", "💎", "📚", "💰", "🎮", "🎨", 
                        "🎯", "🌟", "🏠", "🍕", "⚡"
                      ].map((item) => (
                        <motion.button
                          key={item}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEmoji(item);
                            setShowEmojiPicker(false);
                          }}
                          className={`h-12 w-full flex items-center justify-center rounded-xl text-2xl transition-all border ${
                            emoji === item 
                              ? 'bg-accent/30 border-accent shadow-lg shadow-accent/20' 
                              : 'bg-white/5 border-transparent hover:border-white/10'
                          }`}
                        >
                          {item}
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Cor Tema</label>
              <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 min-h-[80px]">
                <div className="relative h-10 w-10 shrink-0">
                  <input 
                    type="color" 
                    value={cor}
                    onChange={e => setCor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div 
                    className="h-full w-full rounded-xl border border-white/20 shadow-inner"
                    style={{ backgroundColor: cor }}
                  />
                </div>
                <span className="text-sm font-mono text-white/60 uppercase tracking-wider">{cor}</span>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !nome}
            className="w-full bg-accent text-white font-bold py-5 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-20 shadow-lg shadow-accent/20 mt-4"
          >
            {loading ? 'Criando...' : 'Finalizar e Criar'}
          </motion.button>
          
        </form>
      </motion.div>
      </div>
    </div>
  );
}
