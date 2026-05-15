'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

import { getApiUrl } from '@/lib/api';

interface Action {
  tipo: 'ALTERAR' | 'REGRA' | 'CONVIDAR';
  dados: any;
}

export default function AIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [suggestedActions, setSuggestedActions] = useState<Action[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [memberRole, setMemberRole] = useState<string>('Membro');
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const res = await fetch(getApiUrl(`/api/rankings/${id}/role?usuario_id=${user.id}`));
          const data = await res.json();
          setMemberRole(data.role);
        } catch (err) {
          console.error("Erro ao buscar cargo:", err);
        } finally {
          setRoleLoading(false);
        }
      } else {
        setRoleLoading(false);
      }
    };
    fetchRole();
  }, [id, user]);

  const isStaff = memberRole === 'Fundador' || memberRole === 'Admin Promovido';

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleTransform = async () => {
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch(getApiUrl('/api/generate-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Assistente, no ranking ID ${id}: ${prompt}` })
      });
      const data = await res.json();
      
      if (data.acoes) {
        setSuggestedActions(data.acoes);
        setSummary(data.resumo || 'Entendi suas instruções. Aqui está o plano de ação:');
      } else {
        throw new Error("A IA não conseguiu identificar ações claras.");
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAll = async () => {
    setLoading(true);
    try {
      for (const action of suggestedActions) {
        if (action.tipo === 'ALTERAR') {
          await fetch(getApiUrl(`/api/rankings/${id}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.dados)
          });
        } 
        else if (action.tipo === 'REGRA') {
          await fetch(getApiUrl(`/api/rankings/${id}/tasks`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: user?.id,
              nome: action.dados.tipo_atividade,
              descricao: action.dados.condicao_extra || '',
              pontos: action.dados.valor_ponto,
              recorrencia: 'livre'
            })
          });
        }
        else if (action.tipo === 'CONVIDAR') {
          await fetch(getApiUrl(`/api/rankings/${id}/members`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: action.dados.email,
              admin_nome: user?.nome || 'Administrador'
            })
          });
        }
      }
      
      showToast('success', 'Comandos executados! O Ranking foi atualizado.');
      setSuggestedActions([]);
      setPrompt('');
      setSummary('');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      showToast('error', 'Ocorreu um erro ao executar alguns comandos.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (tipo: string) => {
    switch (tipo) {
      case 'ALTERAR': return '🎨';
      case 'REGRA': return '🎯';
      case 'CONVIDAR': return '📩';
      default: return '⚡';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-20">
      <div className="pl-14 lg:pl-0">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Assistente IA</h1>
        <p className="mt-1 text-sm text-white/40">Dê ordens diretas para gerenciar seu Ranking. Mude cores, crie regras ou convide membros.</p>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/50 backdrop-blur-md p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent text-2xl">🧠</div>
            <div>
              <h3 className="text-white text-lg font-bold">O que a IA deve fazer?</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-black">Mude o nome, a cor, crie regras ou convide por e-mail</p>
            </div>
          </div>

          <textarea
            id="prompt"
            rows={5}
            className="block w-full rounded-3xl border border-white/5 bg-black/40 px-8 py-6 text-white placeholder:text-white/20 focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none transition-all resize-none text-base leading-relaxed"
            placeholder="Ex: Mude a cor para roxo, altere o nome para Ranking Dev e convide carlos@email.com..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleTransform}
              disabled={loading || !prompt || !isStaff || roleLoading}
              className="group relative overflow-hidden inline-flex items-center justify-center rounded-2xl bg-accent px-12 py-4 text-sm font-black text-white uppercase tracking-[0.2em] shadow-2xl shadow-accent/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center gap-3">
                {roleLoading ? 'Verificando...' : !isStaff ? 'Acesso Restrito 🔒' : loading && !suggestedActions.length ? 'Pensando...' : 'Enviar Ordens ⚡'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {suggestedActions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <p className="text-sm text-white/80 italic">"{summary}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestedActions.map((action, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 hover:border-accent/30 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl group-hover:scale-110 transition-transform block">{getActionIcon(action.tipo)}</span>
                    <span className="text-[10px] font-black text-accent bg-accent/10 px-3 py-1 rounded-full uppercase">{action.tipo}</span>
                  </div>
                  <div className="space-y-2">
                    {action.tipo === 'ALTERAR' && (
                      <>
                        <h4 className="text-white font-bold">Atualizar Ranking</h4>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(action.dados).map(([key, val]) => (
                            <span key={key} className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-white/40">{key}: <span className="text-white/80">{String(val)}</span></span>
                          ))}
                        </div>
                      </>
                    )}
                    {action.tipo === 'REGRA' && (
                      <>
                        <h4 className="text-white font-bold">{action.dados.tipo_atividade}</h4>
                        <p className="text-accent font-black">+{action.dados.valor_ponto} Pontos</p>
                      </>
                    )}
                    {action.tipo === 'CONVIDAR' && (
                      <>
                        <h4 className="text-white font-bold">Convidar para o Ranking</h4>
                        <p className="text-white/40 text-xs">{action.dados.email}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <button onClick={handleExecuteAll} disabled={loading} className="w-full py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-accent hover:text-white transition-all shadow-2xl hover:shadow-accent/40">{loading ? 'Executando...' : 'Confirmar e Atualizar Ranking ⚔️'}</button>
          </motion.div>
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
