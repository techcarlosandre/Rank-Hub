'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRankingTheme } from '@/contexts/RankingThemeContext';

import { getApiUrl } from '@/lib/api';

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  const [ranking, setRanking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emoji, setEmoji] = useState('🏆');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cor, setCor] = useState('#ff5528');
  const [cicloReset, setCicloReset] = useState('nunca');
  const [premio, setPremio] = useState('');
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const { setAccentColor } = useRankingTheme();

  const popularEmojis = [
    '🏆', '🚀', '📚', '💪', '🎮', '💡', '🎯', '🏅', '⭐', '💎', 
    '🎨', '🎬', '🧩', '📈', '🧘', '🍳', '🌱', '⚽', '🎸', '💻'
  ];

  useEffect(() => {
    fetch(getApiUrl(`/api/rankings/${id}`))
      .then(res => res.json())
      .then(data => {
        setRanking(data);
        setNome(data.nome);
        setDescricao(data.descricao || '');
        setEmoji(data.emoji || '🏆');
        setCor(data.cor_tema_hex || '#ff5528');
        setFotoUrl(data.foto_url || null);
        setCicloReset(data.ciclo_reset || 'nunca');
        setPremio(data.premio_atual || '');
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar ranking:", err);
        setLoading(false);
      });
  }, [id]);

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao,
          emoji: emoji || null,
          foto_url: fotoUrl,
          cor_tema_hex: cor,
          ciclo_reset: cicloReset,
          premio_atual: premio
        })
      });

      if (res.ok) {
        setAccentColor(cor);
        setShowSuccessToast({ type: 'success', msg: 'Configurações Salvas!' });
        setTimeout(() => setShowSuccessToast(null), 3000);
        router.refresh();
      } else {
        setShowSuccessToast({ type: 'error', msg: 'Erro ao salvar configurações.' });
        setTimeout(() => setShowSuccessToast(null), 4000);
      }
    } catch (err) {
      setShowSuccessToast({ type: 'error', msg: 'Erro de conexão com o servidor.' });
      setTimeout(() => setShowSuccessToast(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/upload-icon`), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setFotoUrl(data.url);
        setEmoji('');
        setShowEmojiPicker(false);
        setShowSuccessToast({ type: 'success', msg: 'Foto carregada! Salve as alterações.' });
        setTimeout(() => setShowSuccessToast(null), 4000);
      } else {
        setShowSuccessToast({ type: 'error', msg: data.error || 'Erro no upload' });
        setTimeout(() => setShowSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      setShowSuccessToast({ type: 'error', msg: 'Erro de conexão no envio.' });
      setTimeout(() => setShowSuccessToast(null), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRanking = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setShowSuccessToast({ type: 'error', msg: 'Erro ao excluir ranking.' });
      setTimeout(() => setShowSuccessToast(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.id === ranking?.admin_id;

  if (loading) return <div className="p-8 text-center text-muted italic">Sincronizando arena...</div>;

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pl-14 lg:pl-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Configurações do Ranking</h1>
          <p className="mt-1 text-sm text-muted">Personalize a identidade e as regras da competição.</p>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Nome do Ranking</label>
              <input 
                type="text" 
                disabled={!isAdmin}
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Descrição</label>
              <textarea 
                rows={2}
                disabled={!isAdmin}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Qual o objetivo desta competição?"
                className="w-full rounded-2xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none transition-all h-24" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Identidade Visual</label>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    disabled={!isAdmin || isUploading}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-20 w-20 rounded-3xl bg-black/40 border-2 border-white/5 hover:border-[var(--accent)]/50 transition-all flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden group"
                  >
                    {isUploading ? (
                       <div className="h-6 w-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    ) : fotoUrl ? (
                      <img src={fotoUrl} alt="Ícone" className="h-full w-full object-cover" />
                    ) : (
                      <span>{emoji || '🏆'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-tighter">
                       Trocar
                    </div>
                  </button>

                  <div className="text-white/20 text-[10px] uppercase font-black tracking-[0.2em] leading-tight">
                    Ícone ou<br/>Imagem
                  </div>
                </div>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEmojiPicker(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Escolher Ícone</h3>
                          <button type="button" onClick={() => setShowEmojiPicker(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => document.getElementById('icon-upload')?.click()}
                            className="h-12 w-12 flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all text-2xl"
                          >
                            <input type="file" id="icon-upload" className="hidden" accept="image/*" onChange={handleIconUpload} />
                            +
                          </button>
                          {popularEmojis.map(em => (
                            <button key={em} type="button" onClick={() => { setEmoji(em); setFotoUrl(null); setShowEmojiPicker(false); }} className={`h-12 w-12 flex items-center justify-center rounded-xl border-2 transition-all text-2xl ${emoji === em ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                              {em}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Cor de Destaque</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    disabled={!isAdmin}
                    value={cor}
                    onChange={e => setCor(e.target.value)}
                    className="h-12 w-24 rounded-2xl border-2 border-white/5 bg-black/40 p-1 cursor-pointer"
                  />
                  <span className="text-xs font-black font-mono text-white/40 uppercase">{cor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Ciclo de Reset</label>
                <select 
                  disabled={!isAdmin}
                  value={cicloReset}
                  onChange={e => setCicloReset(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="nunca">Nunca zerar</option>
                  <option value="semanal">Semanal (Segunda-feira)</option>
                  <option value="mensal">Mensal (Todo dia 1º)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 pl-1 tracking-widest">Prêmio do 1º Lugar</label>
                <input 
                  type="text" 
                  disabled={!isAdmin}
                  value={premio}
                  onChange={e => setPremio(e.target.value)}
                  placeholder="Ex: Medalha, Pix, Livro..."
                  className="w-full rounded-2xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--accent)]/50 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => router.refresh()}
              className="px-6 py-3 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
            >
              Descartar
            </button>
            <button 
              type="button" 
              disabled={!isAdmin || isUpdating || isUploading}
              onClick={handleSaveSettings}
              className="bg-[var(--accent)] text-accent-foreground px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50"
            >
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="pt-10">
          <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/5 p-8">
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-tighter">Zona de Perigo</h3>
            <p className="mt-2 text-sm text-red-500/60 leading-relaxed">
              Ao excluir este ranking, todos os dados de pontuação e membros serão removidos permanentemente. Esta ação não pode ser desfeita.
            </p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="mt-6 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              Excluir Ranking permanentemente
            </button>
          </div>
        </div>
      )}

      {/* Modais e Toasts (Manter os mesmos que já estavam funcionando) */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[300] border rounded-3xl p-5 shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-xl ${
              showSuccessToast.type === 'success' ? 'bg-zinc-900/90 border-green-500/30' : 'bg-red-900/90 border-red-500/30'
            }`}
          >
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl ${
              showSuccessToast.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {showSuccessToast.type === 'success' ? '✓' : '✕'}
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight">{showSuccessToast.type === 'success' ? 'Sucesso!' : 'Erro!'}</p>
              <p className="text-white/60 text-xs">{showSuccessToast.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de exclusão simplificado para brevidade */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-8 max-w-sm w-full text-center">
                <h3 className="text-xl font-bold text-white mb-6">Confirmar Exclusão?</h3>
                <button onClick={handleDeleteRanking} disabled={isDeleting} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase mb-3">{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase">Cancelar</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
