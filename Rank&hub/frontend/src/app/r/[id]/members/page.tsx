'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: number;
  nome: string;
  email: string;
  foto_url: string;
  role: string;
  apelido: string | null;
  pontos: number;
}

interface Patent {
  id: number;
  nome: string;
  pontos_minimos: number;
  cor_hex: string;
}

import { getApiUrl } from '@/lib/api';

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [rankingInfo, setRankingInfo] = useState<any>(null);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isOwner = currentUser?.id === rankingInfo?.admin_id;
  const isAdmin = isOwner || members.find(m => m.id === currentUser?.id)?.role === 'admin';

  const fetchData = () => {
    Promise.all([
      fetch(getApiUrl(`/api/rankings/${id}/members`)),
      fetch(getApiUrl(`/api/rankings/${id}`)),
      fetch(getApiUrl(`/api/rankings/${id}/patents`))
    ]).then(async ([mRes, rRes, pRes]) => {
      setMembers(await mRes.json());
      setRankingInfo(await rRes.json());
      setPatents(await pRes.json());
      setLoading(false);
    }).catch(err => {
      console.error("Erro ao carregar dados:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/members`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.ok) {
        showToast('success', 'Convite enviado com sucesso!');
        setInviteEmail('');
        fetchData();
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Erro ao convidar');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveMemberChanges = async () => {
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/members/${editingMember.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apelido: editNickname, role: editRole })
      });
      if (res.ok) {
        setEditingMember(null);
        showToast('success', 'Membro atualizado!');
        fetchData();
      }
    } catch (err) {
      showToast('error', 'Erro ao atualizar');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!editingMember || !currentUser) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/members/${editingMember.id}?requester_id=${currentUser.id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        setShowConfirmRemove(false);
        setEditingMember(null);
        showToast('success', 'Membro removido do ranking.');
        fetchData();
        if (editingMember.id === currentUser.id) window.location.href = '/dashboard';
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Erro ao remover');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getPatentForScore = (score: number) => {
    const sortedPatents = [...patents].sort((a, b) => b.pontos_minimos - a.pontos_minimos);
    return sortedPatents.find(p => score >= p.pontos_minimos);
  };

  if (loading) return <div className="p-20 text-center text-white/20 italic">Sincronizando membros...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="pl-14 lg:pl-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">{rankingInfo?.titulo_membros || 'Membros do Ranking'}</h1>
        <p className="text-sm text-white/40">Gerencie a hierarquia e os nomes dos participantes.</p>
      </div>

      {isAdmin && (
        <div className="rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/20 pl-1 tracking-widest">Convidar para o Ranking</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="E-mail do usuário..." className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={handleInvite} disabled={isInviting || !inviteEmail} className="bg-[var(--accent)] text-accent-foreground px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
              {isInviting ? 'Enviando...' : 'Convidar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, index) => {
          const isOwnerMember = member.id === rankingInfo?.admin_id;
          const isTargetAdmin = member.role === 'admin';
          const memberPatent = getPatentForScore(member.pontos);

          return (
            <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm hover:border-[var(--accent)]/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-[var(--accent)]/50">
                  <img src={member.foto_url} alt={member.nome} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate">{member.apelido || member.nome}</h3>
                  <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border ${isOwnerMember ? 'bg-amber-500/20 text-amber-500' : isTargetAdmin ? 'bg-zinc-400/20 text-zinc-300' : 'bg-blue-500/20 text-blue-500'}`}>
                    {isOwnerMember ? (rankingInfo?.cargo_owner || 'Fundador') : isTargetAdmin ? (rankingInfo?.cargo_admin || 'Admin') : (rankingInfo?.cargo_membro || 'Membro')}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/40">Pontuação</span><span className="text-white">{member.pontos} Pts</span></div>
                <div className="flex justify-between text-[10px] uppercase font-bold mt-1"><span className="text-white/40">Patente</span><span style={{ color: memberPatent?.cor_hex || 'var(--accent)' }}>{memberPatent?.nome || 'Iniciante'}</span></div>
              </div>
              {isAdmin && (member.id !== rankingInfo?.admin_id || member.id === currentUser?.id) && (
                <button onClick={() => { setEditingMember(member); setEditNickname(member.apelido || member.nome); setEditRole(member.role); }} className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all">✎</button>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingMember && !showConfirmRemove && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-tighter">Gestão de Membro</h3>
              <div className="space-y-6">
                <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
                {isOwner && editingMember.id !== rankingInfo?.admin_id && (
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                    <option value="member">Membro Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                )}
                {isAdmin && editingMember.id !== rankingInfo?.admin_id && (
                  <button onClick={() => setShowConfirmRemove(true)} className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Remover do Ranking ⚔️</button>
                )}
                <div className="flex gap-3 pt-4"><button onClick={() => setEditingMember(null)} className="flex-1 py-3 text-white/40 hover:text-white text-xs font-bold uppercase transition-colors">Cancelar</button><button onClick={handleSaveMemberChanges} disabled={isSavingEdit} className="flex-1 py-4 bg-[var(--accent)] text-accent-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 transition-all hover:scale-105 active:scale-95">Salvar</button></div>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmRemove && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmRemove(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-zinc-900 border border-red-500/30 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl">
              <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto mb-6">⚠️</div>
              <h4 className="text-white font-bold uppercase mb-2">Banir Membro?</h4>
              <p className="text-xs text-white/40 mb-8">Esta ação removerá permanentemente o acesso deste usuário ao ranking e seus pontos acumulados.</p>
              <div className="flex flex-col gap-2">
                <button onClick={handleRemoveMember} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">Confirmar Expulsão</button>
                <button onClick={() => setShowConfirmRemove(false)} className="w-full py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-bold uppercase hover:text-white">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}

        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }} className={`fixed bottom-10 left-1/2 z-[300] border rounded-3xl p-5 shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-xl ${toast.type === 'success' ? 'bg-zinc-900/90 border-green-500/30' : 'bg-red-900/90 border-red-500/30'}`}>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'}</div>
            <div><p className="text-white font-black text-sm uppercase tracking-tight">{toast.type === 'success' ? 'Sucesso!' : 'Erro!'}</p><p className="text-white/60 text-xs">{toast.msg}</p></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
