'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRankingTheme } from '@/contexts/RankingThemeContext';

interface Patent {
  id: number;
  nome: string;
  pontos_minimos: number;
  cor_hex: string;
}

export default function CommunitySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { setAccentColor } = useRankingTheme();

  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any>(null);
  
  // States para Nomes e Cargos
  const [nomeMembros, setNomeMembros] = useState('');
  const [tituloMembros, setTituloMembros] = useState('');
  const [cargoOwner, setCargoOwner] = useState('');
  const [cargoAdmin, setCargoAdmin] = useState('');
  const [cargoMembro, setCargoMembro] = useState('');

  // States para Patentes
  const [patents, setPatents] = useState<Patent[]>([]);
  const [newPatentNome, setNewPatentNome] = useState('');
  const [newPatentPts, setNewPatentPts] = useState(0);
  const [newPatentColor, setNewPatentColor] = useState('#ffffff');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [rankRes, patentsRes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/rankings/${id}`),
        fetch(`http://127.0.0.1:5000/api/rankings/${id}/patents`)
      ]);
      
      const rankData = await rankRes.json();
      const patentsData = await patentsRes.json();

      setRanking(rankData);
      setNomeMembros(rankData.nome_membros || 'Membros');
      setTituloMembros(rankData.titulo_membros || 'Participantes do Ranking');
      setCargoOwner(rankData.cargo_owner || 'Fundador');
      setCargoAdmin(rankData.cargo_admin || 'Administrador');
      setCargoMembro(rankData.cargo_membro || 'Membro');
      setPatents(patentsData);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/rankings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_membros: nomeMembros,
          titulo_membros: tituloMembros,
          cargo_owner: cargoOwner,
          cargo_admin: cargoAdmin,
          cargo_membro: cargoMembro
        })
      });
      if (res.ok) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddPatent = async () => {
    if (!newPatentNome) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/rankings/${id}/patents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newPatentNome,
          pontos_minimos: newPatentPts,
          cor_hex: newPatentColor
        })
      });
      if (res.ok) {
        setNewPatentNome('');
        setNewPatentPts(0);
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao adicionar patente:", err);
    }
  };

  const handleDeletePatent = async (pId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/patents/${pId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Erro ao excluir patente:", err);
    }
  };

  const isAdmin = user?.id === ranking?.admin_id;

  if (loading) return <div className="p-8 text-center text-muted italic">Sincronizando comunidade...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="pl-14 lg:pl-0">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestão da Comunidade</h1>
        <p className="mt-1 text-sm text-muted">Personalize a identidade, os cargos e a evolução dos seus membros.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Nomes e Cargos */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-[var(--accent)]">🏷️</span> Identidade & Cargos
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 pl-1">Nome dos Membros</label>
                <input 
                  type="text" 
                  disabled={!isAdmin}
                  value={nomeMembros}
                  onChange={e => setNomeMembros(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 pl-1">Título da Página</label>
                <input 
                  type="text" 
                  disabled={!isAdmin}
                  value={tituloMembros}
                  onChange={e => setTituloMembros(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 pl-1">Cargo Fundador</label>
                  <input 
                    type="text" 
                    disabled={!isAdmin}
                    value={cargoOwner}
                    onChange={e => setCargoOwner(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 pl-1">Cargo Admin Promovido</label>
                  <input 
                    type="text" 
                    disabled={!isAdmin}
                    value={cargoAdmin}
                    onChange={e => setCargoAdmin(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 pl-1">Cargo Membro</label>
                  <input 
                    type="text" 
                    disabled={!isAdmin}
                    value={cargoMembro}
                    onChange={e => setCargoMembro(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={handleSaveGeneral}
                  disabled={isUpdating}
                  className="w-full mt-4 bg-[var(--accent)] text-accent-foreground py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : 'Atualizar Identidade'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sistema de Patentes */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md h-full">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-[var(--accent)]">🎖️</span> Sistema de Patentes
            </h2>

            {isAdmin && (
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-4 mb-6">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Adicionar Nova Patente</p>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nome (ex: Pro)"
                    value={newPatentNome}
                    onChange={e => setNewPatentNome(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Pts Mínimos"
                    value={newPatentPts}
                    onChange={e => setNewPatentPts(Number(e.target.value))}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  onClick={handleAddPatent}
                  className="w-full bg-white/5 border border-white/10 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Criar Patente
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {patents.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.cor_hex + '20', color: p.cor_hex }}>
                      ★
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{p.nome}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{p.pontos_minimos}+ Pontos</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeletePatent(p.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all text-xs"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              {patents.length === 0 && (
                <p className="text-center py-10 text-white/20 italic text-sm">Nenhuma patente configurada.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 right-10 z-[300] bg-zinc-900 border border-green-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
            <p className="text-white font-bold text-sm">Comunidade Atualizada!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
