'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getApiUrl } from '@/lib/api';

export default function MyRankingsPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error', title: string, msg: string } | null>(null);

  const fetchRankingsWithMembers = async () => {
    if (!user) return;
    try {
      const res = await fetch(getApiUrl(`/api/rankings?usuario_id=${user.id}`));
      const data = await res.json();
      
      const enriched = await Promise.all(data.map(async (ranking: any) => {
        const leaderRes = await fetch(getApiUrl(`/api/rankings/${ranking.id}/leaderboard`));
        const leaderboard = await leaderRes.json();
        return { ...ranking, leaderboard };
      }));

      setRankings(enriched);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar rankings:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingsWithMembers();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); 
    e.stopPropagation(); // Garante que o clique não "vaze"
    
    if (!user) return;
    
    // Busca o estado atual para saber o que exibir no Toast
    const ranking = rankings.find(r => r.id === id);
    const isNowFavoriting = !ranking?.favorito;

    // Atualização otimista da UI
    setRankings(prev => prev.map(r => r.id === id ? { ...r, favorito: isNowFavoriting ? 1 : 0 } : r));

    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/favorite`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id })
      });
      
      if (res.ok) {
        if (isNowFavoriting) {
          setToast({ 
            type: 'success', 
            title: 'Ranking Favoritado!', 
            msg: 'Este ranking agora terá destaque e dados detalhados no seu Dashboard principal.' 
          });
        } else {
          setToast({ 
            type: 'info', 
            title: 'Favorito Removido', 
            msg: 'O ranking voltará para a lista comum do seu ecossistema.' 
          });
        }
        setTimeout(() => setToast(null), 5000);
      } else {
        fetchRankingsWithMembers(); // Reverte se der erro
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Erro de Conexão', msg: 'Não foi possível salvar sua preferência.' });
      setTimeout(() => setToast(null), 3000);
      fetchRankingsWithMembers();
    }
  };

  if (loading && rankings.length === 0) return (
    <div className="p-20 text-center space-y-4">
      <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
      <p className="text-white/20 italic animate-pulse uppercase text-[10px] tracking-widest font-black">Sincronizando ecossistema...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Meus Rankings</h1>
          <p className="text-white/40 mt-2 text-lg font-medium">Sua central de arenas ativas.</p>
        </div>
        <Link 
          href="/dashboard/new" 
          className="px-8 py-4 rounded-[1.5rem] bg-accent text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-neon-accent"
        >
          + Novo Ranking
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rankings.length > 0 ? (
          rankings.map((ranking) => (
            <Link 
              key={ranking.id} 
              href={`/r/${ranking.id}`}
              className="ranking-card group relative bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 transition-all overflow-hidden"
              style={{ 
                ['--rank-color' as any]: ranking.cor_tema_hex || '#ff4d00'
              }}
            >
              <div 
                className="absolute top-0 left-0 w-full h-1.5 opacity-30 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundColor: 'var(--rank-color)' }}
              ></div>
              
              <div className="flex justify-between items-start mb-8">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden text-3xl shadow-xl transition-all group-hover:scale-110 group-hover:border-white/20">
                  {ranking.foto_url ? (
                    <img src={ranking.foto_url} alt={ranking.nome} className="h-full w-full object-cover" />
                  ) : (
                    <span className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{ranking.emoji || '🏆'}</span>
                  )}
                </div>
                
                <button 
                  onClick={(e) => toggleFavorite(e, ranking.id)}
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 ${ranking.favorito ? 'text-white' : 'bg-white/5 text-white/20 hover:text-white hover:bg-white/10'}`}
                  style={{ 
                    backgroundColor: ranking.favorito ? 'var(--rank-color)' : '',
                    boxShadow: ranking.favorito ? `0 0 30px -5px ${ranking.cor_tema_hex}` : ''
                  }}
                >
                  <span className="text-3xl leading-none" style={{ marginTop: '-4px' }}>
                    {ranking.favorito ? '★' : '☆'}
                  </span>
                </button>
              </div>

              <h3 className="text-2xl font-black text-white uppercase tracking-tighter ranking-title-hover truncate">
                {ranking.nome}
              </h3>
              <p className="text-xs text-white/40 mt-3 line-clamp-2 leading-relaxed h-8">
                {ranking.descricao || 'Ranking ativo no Rank&Hub.'}
              </p>

              <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                <div className="flex -space-x-3">
                  {ranking.leaderboard?.slice(0, 3).map((member: any) => (
                    <div key={member.id} className="h-10 w-10 rounded-full border-4 border-zinc-900 bg-background overflow-hidden shadow-lg flex items-center justify-center">
                      <img 
                        src={member.foto_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.nome_personalizado}`} 
                        alt={member.nome_personalizado} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.nome_personalizado}`;
                        }}
                      />
                    </div>
                  ))}
                </div>
                <span className="ranking-link-hover text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:translate-x-2 transition-all">
                  Ver Painel →
                </span>
              </div>
              <div className="absolute inset-0 bg-[var(--rank-color)] opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
            </Link>
          ))
        ) : (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] text-center">
            <p className="text-white/20 italic font-medium">Você ainda não participa de nenhum ranking.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 50, x: '-50%' }} 
            className={`fixed bottom-10 left-1/2 z-[300] border rounded-[2rem] p-6 shadow-2xl flex items-center gap-5 min-w-[380px] backdrop-blur-xl ${toast.type === 'success' ? 'bg-zinc-900/95 border-accent/30' : toast.type === 'info' ? 'bg-zinc-900/95 border-white/10' : 'bg-red-900/90 border-red-500/30'}`}
          >
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl ${toast.type === 'success' ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/40'}`}>
              {toast.type === 'success' ? '★' : '☆'}
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight">{toast.title}</p>
              <p className="text-white/60 text-xs leading-relaxed mt-1 max-w-[240px]">{toast.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .ranking-card:hover {
          border-color: var(--rank-color) !important;
          box-shadow: 0 0 50px -20px var(--rank-color) !important;
        }
        .ranking-card:hover .ranking-title-hover {
          color: var(--rank-color) !important;
        }
        .ranking-card:hover .ranking-link-hover {
          color: var(--rank-color) !important;
        }
        .ranking-title-hover {
          transition: color 0.3s ease;
        }
      `}</style>
    </div>
  );
}
