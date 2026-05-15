import { getApiUrl } from '@/lib/api';
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Invite {
  id: number;
  ranking_nome: string;
  emoji: string;
  foto_url: string | null;
  admin_nome: string;
}

export default function InvitesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvites();
    }
  }, [user]);

  const fetchInvites = async () => {
    if (!user) return; // Proteção contra nulo
    try {
      const res = await fetch(getApiUrl(`/api/user/${user.id}/invites`));
      const data = await res.json();
      setInvites(data);
    } catch (err) {
      console.error("Erro ao buscar convites:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: number) => {
    if (!user) return; // Proteção contra nulo
    setProcessingId(inviteId);
    try {
      const res = await fetch(getApiUrl(`/api/invites/${inviteId}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id })
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        // Opcional: router.push para o ranking aceito
      }
    } catch (err) {
      alert("Erro ao aceitar convite.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (inviteId: number) => {
    setProcessingId(inviteId);
    try {
      const res = await fetch(getApiUrl(`/api/invites/${inviteId}/refuse`), {
        method: 'POST'
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
      }
    } catch (err) {
      alert("Erro ao recusar convite.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted italic">Buscando convocações...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-foreground uppercase italic tracking-tighter">
            Seus Convites
          </h1>
          <p className="text-muted text-sm mt-1">Veja quem está te desafiando para um novo Ranking.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-xl">
          {invites.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {invites.map((invite) => (
            <motion.div
              key={invite.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md p-8 hover:border-accent/30 transition-all shadow-xl"
            >
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-3xl bg-surface border border-primary flex items-center justify-center text-4xl shadow-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {invite.foto_url ? (
                    <img src={invite.foto_url} alt={invite.ranking_nome} className="h-full w-full object-cover" />
                  ) : (
                    <span>{invite.emoji || '🏆'}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground truncate">{invite.ranking_nome}</h3>
                  <p className="text-xs text-muted mt-1">Convidado por <span className="text-foreground font-bold">{invite.admin_nome}</span></p>
                  
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => handleAccept(invite.id)}
                      disabled={processingId !== null}
                      className="flex-1 bg-accent text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-accent/20 disabled:opacity-50"
                    >
                      {processingId === invite.id ? 'Entrando...' : 'Aceitar Desafio'}
                    </button>
                    <button
                      onClick={() => handleRefuse(invite.id)}
                      disabled={processingId !== null}
                      className="px-6 py-3 bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              </div>

              {/* Background Glow Effect */}
              <div className="absolute -right-10 -top-10 h-32 w-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>

        {invites.length === 0 && (
          <div className="col-span-full py-32 text-center">
            <div className="text-6xl mb-6 opacity-20">📩</div>
            <h3 className="text-xl font-bold text-white/40 uppercase tracking-tighter">Nenhum convite por enquanto</h3>
            <p className="text-sm text-white/20 mt-2">Quando alguém te convidar para um ranking, ele aparecerá aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}

