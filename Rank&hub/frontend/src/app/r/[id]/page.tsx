'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRankingTheme } from '@/contexts/RankingThemeContext';
import { getApiUrl } from '@/lib/api';

interface Member {
  id: number;
  nome_personalizado: string;
  pontos: number;
  foto_perfil: string;
  cargo_personalizado: string;
}

export default function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { setAccentColor } = useRankingTheme();
  
  const [ranking, setRanking] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankRes, membersRes] = await Promise.all([
          fetch(getApiUrl(`/api/rankings/${id}?t=${Date.now()}`)),
          fetch(getApiUrl(`/api/rankings/${id}/leaderboard?t=${Date.now()}`))
        ]);
        
        const rankData = await rankRes.json();
        const membersData = await membersRes.json();
        
        setRanking(rankData);
        setMembers(membersData);
        
        if (rankData.cor_tema_hex) {
          setAccentColor(rankData.cor_tema_hex);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, setAccentColor]);

  if (loading) return <div className="p-8 text-center text-white/20 italic">Carregando classificação...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header do Ranking Dinâmico */}
      <div className="flex items-center gap-6 pl-14 lg:pl-0">
        <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-[2.5rem] bg-zinc-900 border-2 border-white/10 flex items-center justify-center text-6xl shadow-2xl overflow-hidden shrink-0 transition-transform hover:scale-105">
          {ranking?.foto_url ? (
            <img src={ranking.foto_url} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{ranking?.emoji || '🏆'}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            {ranking?.nome}
          </h1>
          <p className="mt-2 text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)] opacity-80">
            Classificação em tempo real
          </p>
        </div>
      </div>

      {/* Tabela de Classificação */}
      <div className="rounded-[3rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Posição</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Membro</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Pontuação</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => {
                const isTop3 = index < 3;
                const isUser = member.id === user?.id;
                
                return (
                  <motion.tr 
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group transition-colors hover:bg-white/[0.02] ${isUser ? 'bg-[var(--accent)]/5' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm
                        ${index === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 
                          index === 1 ? 'bg-zinc-300 text-black shadow-lg shadow-zinc-300/20' :
                          index === 2 ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/20' : 
                          'bg-white/5 text-white/40'}`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-2 border-white/10 overflow-hidden shrink-0 group-hover:border-[var(--accent)]/50 transition-colors bg-white/5 flex items-center justify-center">
                          <img 
                            src={member.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.nome_personalizado}`} 
                            alt={member.nome_personalizado} 
                            className="h-full w-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.nome_personalizado}`;
                            }}
                          />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isUser ? 'text-[var(--accent)]' : 'text-white'}`}>
                            {member.nome_personalizado} {isUser && '(Você)'}
                          </p>
                          <p className="text-[9px] uppercase font-black tracking-widest text-white/30">{member.cargo_personalizado || 'Membro'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-block">
                        <p className="text-xl font-black text-white">{member.pontos} <span className="text-[10px] text-white/20 uppercase tracking-tighter">pts</span></p>
                        <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min((member.pontos / (members[0]?.pontos || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="py-20 text-center text-white/20 italic">Nenhuma atividade registrada ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
