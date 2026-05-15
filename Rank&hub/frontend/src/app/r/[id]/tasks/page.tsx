'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

interface Task {
  id: number;
  nome: string;
  descricao: string;
  pontos: number;
  recorrencia: 'livre' | 'diaria' | 'semanal' | 'unica';
}

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState<number | null>(null);
  const [memberRole, setMemberRole] = useState<string>('Membro');

  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPts, setNewPts] = useState(10);
  const [newRec, setNewRec] = useState<'livre' | 'diaria' | 'semanal' | 'unica'>('livre');
  const [isCreating, setIsCreating] = useState(false);

  const isStaff = memberRole === 'Fundador' || memberRole === 'Admin Promovido';

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const tasksRes = await fetch(getApiUrl(`/api/rankings/${id}/tasks?t=${Date.now()}`));
      const tasksData = await tasksRes.json();
      
      if (user) {
        const roleRes = await fetch(getApiUrl(`/api/rankings/${id}/role?usuario_id=${user.id}`));
        const roleData = await roleRes.json();
        setMemberRole(roleData.role);
      }

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setLoading(false);
    } catch (err) {
      setTasks([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleRegister = async (taskId: number) => {
    if (!user) return;
    setIsRegistering(taskId);

    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, tarefa_id: taskId })
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', `Atividade registrada! +${data.pontos_ganhos} Pontos.`);
      } else {
        showToast('error', data.error || 'Erro ao registrar');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão');
    } finally {
      setIsRegistering(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${id}/tasks`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user?.id,
          nome: newNome,
          descricao: newDesc,
          pontos: newPts,
          recorrencia: newRec
        })
      });
      
      if (res.ok) {
        showToast('success', 'Nova tarefa adicionada ao ranking!');
        setShowAddModal(false);
        setNewNome(''); setNewDesc(''); setNewPts(10);
        fetchData();
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Falha ao criar tarefa');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão com o servidor');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-white/20 italic">Sincronizando tarefas...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-14 lg:pl-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Tarefas & Atividades</h1>
          <p className="mt-1 text-sm text-white/40">Conclua desafios e suba na classificação do ranking.</p>
        </div>
        {isStaff && (
          <button onClick={() => setShowAddModal(true)} className="bg-[var(--accent)] text-accent-foreground px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/20">+ Nova Tarefa</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md hover:border-[var(--accent)]/40 transition-all flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors">{task.nome}</h3>
                <span className="text-[9px] font-black uppercase bg-white/5 px-2 py-1 rounded-md text-white/40 border border-white/5">{task.recorrencia}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-8">{task.descricao || 'Atividade importante do ranking.'}</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-lg font-black">+{task.pontos}</div>
                <div><p className="text-[10px] uppercase font-bold text-white/20">Recompensa</p><p className="text-[10px] uppercase font-black text-white/60 tracking-widest mt-0.5">Pontos</p></div>
              </div>
            </div>
            <button onClick={() => handleRegister(task.id)} disabled={isRegistering !== null} className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl">{isRegistering === task.id ? 'Registrando...' : 'Registrar Conclusão'}</button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-8 uppercase tracking-tighter">Criar Nova Tarefa</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <input type="text" required placeholder="Nome da Tarefa" value={newNome} onChange={e => setNewNome(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
                <textarea placeholder="Descrição detalhada..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none h-24" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" required placeholder="Pontos" value={newPts} onChange={e => setNewPts(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
                  <select value={newRec} onChange={e => setNewRec(e.target.value as any)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                    <option value="livre">Livre</option>
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="unica">Única</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-white/40 hover:text-white text-xs font-bold uppercase transition-colors">Cancelar</button>
                  <button type="submit" disabled={isCreating} className="flex-1 py-4 bg-[var(--accent)] text-accent-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 transition-all hover:scale-105">{isCreating ? 'Salvando...' : 'Criar Agora'}</button>
                </div>
              </form>
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
