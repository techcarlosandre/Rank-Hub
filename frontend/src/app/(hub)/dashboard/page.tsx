'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [myRankings, setMyRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankingsData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/rankings?usuario_id=${user.id}`);
      const rankings = await res.json();

      const enrichedRankings = await Promise.all(rankings.map(async (r: any) => {
        const [logsRes, leaderRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/rankings/${r.id}/logs`),
          fetch(`http://127.0.0.1:5000/api/rankings/${r.id}/leaderboard`)
        ]);

        return {
          ...r,
          logs: await logsRes.json(),
          leaderboard: await leaderRes.json()
        };
      }));

      setMyRankings(enrichedRankings);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar rankings enriquecidos:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingsData();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/rankings/${id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id })
      });
      if (res.ok) {
        fetchRankingsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const favorites = myRankings.filter(r => r.favorito);
  const others = myRankings.filter(r => !r.favorito);
  const hasFavorites = favorites.length > 0;

  // CÁLCULOS GLOBAIS DINÂMICOS
  const totalPoints = myRankings.reduce((acc, r) => {
    const me = r.leaderboard?.find((m: any) => m.id === user?.id);
    return acc + (me?.total_pontos || 0);
  }, 0);

  const globalLevel = Math.floor(totalPoints / 1000) + 1;
  const xpForNext = 1000 - (totalPoints % 1000);
  
  const allLogs = myRankings.flatMap(r => (r.logs || []).map((l: any) => ({ ...l, rankingNome: r.nome }))).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const getAIMessage = () => {
    if (!user) return "...";
    const firstName = user.nome?.split(' ')[0] || 'Usuário';
    
    if (!hasFavorites) {
      return `Olá, ${firstName}. Para análises táticas, favorite seus rankings principais!`;
    }

    if (favorites.length === 1) {
      const r = favorites[0];
      const leaderboard = r.leaderboard || [];
      const myIdx = leaderboard.findIndex((m: any) => m.id === user.id);
      if (myIdx === 0) return `Você é o soberano do ${r.nome}, ${firstName}. Continue assim!`;
      const gap = leaderboard[0].total_pontos - (leaderboard[myIdx]?.total_pontos || 0);
      return `${firstName}, você está em #${myIdx + 1} no ${r.nome}. Faltam ${gap} pts para o topo.`;
    }

    // MENSAGEM MULTI-RANKING
    const leadingIn = favorites.filter(r => r.leaderboard?.[0]?.id === user.id).length;
    if (leadingIn === favorites.length) {
      return `Dominação total, ${firstName}! Você lidera todos os seus rankings favoritos. Deseja criar um novo desafio com a IA?`;
    }
    
    return `${firstName}, você está em disputa em ${favorites.length} frentes. Você lidera em ${leadingIn} delas. No ranking ${favorites.find(r => r.leaderboard?.[0]?.id !== user.id)?.nome}, há espaço para subir!`;
  };

  if (loading && myRankings.length === 0) return (
    <div className="p-20 text-center space-y-4">
      <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
      <p className="text-white/20 italic animate-pulse uppercase text-[10px] tracking-widest font-black">Sincronizando Ecossistema...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none italic">Olá, {user?.nome?.split(' ')[0] || 'Participante'}</h1>
          <p className="text-white/40 mt-3 text-lg font-medium">Seu ecossistema unificado de competição.</p>
        </div>
      </header>

      {/* Global Stats Summary - AGORA DINÂMICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 flex flex-col justify-between h-36">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Nível Global (RankHub)</p>
          <div className="flex items-end justify-between">
             <p className="text-4xl font-black text-white italic tracking-tighter">Lvl {globalLevel}</p>
             <span className="text-[9px] font-black text-white/20 uppercase tracking-widest pb-1">{xpForNext} PTS para Lvl {globalLevel + 1}</span>
          </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 flex flex-col justify-between h-36">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Pontuação Total Acumulada</p>
          <div className="flex items-end justify-between">
             <p className="text-4xl font-black text-green-500 tracking-tighter uppercase italic">{totalPoints} PTS</p>
             <span className="text-[9px] font-black text-green-500/40 uppercase tracking-widest pb-1">Total de {myRankings.length} rankings</span>
          </div>
        </div>
        <Link href="/dashboard/new" className="p-8 rounded-[2rem] bg-accent border border-accent/20 flex flex-col justify-between h-36 group overflow-hidden relative shadow-neon-accent hover:scale-[1.02] transition-all">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Novos Horizontes</p>
            <p className="text-3xl font-black text-white tracking-tighter uppercase italic mt-1">Criar com IA ✨</p>
          </div>
          <span className="absolute -bottom-6 -right-6 text-8xl opacity-20 transform group-hover:scale-125 transition-transform duration-700">🤖</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {hasFavorites && (
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                ⭐ Meus Favoritos ({favorites.length})
                <span className="h-px flex-1 bg-white/10" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {favorites.map((rank) => {
                  const myStatus = rank.leaderboard?.find((m: any) => m.id === user?.id);
                  const myPositionIdx = rank.leaderboard?.findIndex((m: any) => m.id === user?.id);
                  const myPosition = myPositionIdx !== -1 ? myPositionIdx + 1 : '-';
                  const themeColor = rank.cor_tema_hex || '#ff4d00';

                  return (
                    <motion.div key={rank.id} layout className="relative group rounded-[2.5rem] bg-zinc-900 border border-white/5 p-8 shadow-2xl transition-all hover:border-white/20 overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-all pointer-events-none italic font-black text-white">{rank.emoji || '🏆'}</div>
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 blur-[100px] opacity-[0.05] rounded-full pointer-events-none" style={{ backgroundColor: themeColor }} />

                      <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="h-20 w-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-4xl border border-white/10 overflow-hidden shadow-2xl">
                             {rank.foto_url ? <img src={rank.foto_url} className="h-full w-full object-cover" /> : rank.emoji || '🏆'}
                          </div>
                          <button onClick={(e) => toggleFavorite(e, rank.id)} className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all text-xl" style={{ backgroundColor: themeColor, color: 'white' }}>★</button>
                        </div>

                        <div>
                          <h4 className="text-3xl font-black text-white uppercase tracking-tighter truncate leading-none">{rank.nome}</h4>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="space-y-1">
                              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Sua Posição</p>
                              <p className="text-xl font-black text-white italic">#{myPosition}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2" />
                            <div className="space-y-1">
                              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Sua Pontuação</p>
                              <p className="text-xl font-black text-white italic" style={{ color: themeColor }}>{myStatus?.total_pontos || 0} PTS</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                           <div className="flex justify-between items-center">
                              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Atividade Recente</p>
                              <span className="text-[8px] font-bold text-white/40 uppercase">{rank.leaderboard?.length || 0} Membros</span>
                           </div>
                           <p className="text-[10px] text-white/60 leading-tight italic line-clamp-1">
                             {rank.logs?.[0] ? `"${rank.logs[0].descricao}"` : "Nenhuma atividade recente neste ranking."}
                           </p>
                        </div>

                        <Link href={`/r/${rank.id}`} className="block w-full py-5 rounded-2xl bg-white text-black text-center font-black text-xs uppercase tracking-[0.2em] hover:brightness-90 transition-all shadow-xl" style={{ backgroundColor: themeColor, color: 'white' }}>Entrar no Ranking</Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/5" />
                DEMAIS RANKINGS ATIVOS
                <span className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {others.map((rank) => (
                  <div key={rank.id} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                      {rank.foto_url ? <img src={rank.foto_url} className="h-full w-full object-cover" /> : rank.emoji || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate uppercase tracking-tighter">{rank.nome}</h4>
                      <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{rank.leaderboard?.length || 0} Membros</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => toggleFavorite(e, rank.id)} className="h-8 w-8 rounded-lg bg-white/5 text-white/20 hover:text-white transition-all flex items-center justify-center text-sm">☆</button>
                       <Link href={`/r/${rank.id}`} className="h-8 px-4 rounded-lg bg-white/10 text-white text-[9px] font-black uppercase flex items-center hover:bg-white hover:text-black transition-all">Ver</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lateral: Assistente de IA & Atividade Global */}
        <div className="space-y-8">
           <div className="p-10 rounded-[3rem] bg-zinc-900 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 group-hover:scale-125 transition-transform duration-700">🤖</div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Assistente de IA</h3>
              <div className="h-1 w-10 bg-accent rounded-full mb-6" />
              <p className="text-xs text-white/50 leading-relaxed mb-6 italic">"{getAIMessage()}"</p>
              <button className="px-6 py-3 rounded-xl bg-white/5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-accent transition-all">Ouvir Sugestões →</button>
           </div>

           <div className="p-10 rounded-[3rem] bg-zinc-900 border border-white/5 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">📜 Mural Global de Atividade</h3>
              <div className="space-y-6">
                {allLogs.slice(0, 8).map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0 group-hover:scale-150 transition-all" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight truncate">{log.usuario}</p>
                        <span className="text-[8px] text-white/30 font-black uppercase">{log.rankingNome}</span>
                      </div>
                      <p className="text-[9px] text-white/30 leading-tight mt-1 line-clamp-2 italic">{log.descricao}</p>
                    </div>
                    <span className="text-[10px] font-black text-accent shrink-0">+{log.pontos_recebidos}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
