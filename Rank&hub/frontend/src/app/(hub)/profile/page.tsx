'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { type: "spring" as const, stiffness: 260, damping: 20 }
  }
};

import { getApiUrl } from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetch(getApiUrl('/api/user'))
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setPreviewUrl(data.foto_url);
        setLoading(false);
      });
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError("Senha atual obrigatória para confirmar alterações.");
      return;
    }
    
    setSaving(true);
    
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('foto', selectedFile);
        await fetch(getApiUrl('/api/user/avatar'), {
          method: 'POST',
          body: formData,
        });
      }

      const response = await fetch(getApiUrl('/api/user'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          senha_atual: currentPassword,
          nova_senha: newPassword
        })
      });
      
      const result = await response.json();

      if (response.ok) {
        window.dispatchEvent(new Event('userUpdated'));
        setSuccess(true);
        setSelectedFile(null);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted italic">Sincronizando perfil...</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Perfil Premium</h1>
        <p className="mt-1 text-sm text-muted uppercase tracking-[0.2em] font-medium">Controle total da sua identidade</p>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-primary bg-surface/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <form onSubmit={handleSave} className="p-8 space-y-8">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest text-center"
              >
                ⚠️ {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest text-center"
              >
                ✅ Perfil atualizado com sucesso!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar Section */}
          <div className="flex items-center gap-8 pb-8 border-b border-white/5">
            <div className="h-24 w-24 rounded-full border-2 border-accent bg-background p-1 shadow-lg shadow-accent/20 overflow-hidden relative group">
              <img src={previewUrl || user.foto_url} alt="Avatar" className="h-full w-full object-cover rounded-full" />
              {saving && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <input 
                type="file" 
                id="avatar-input" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <button 
                type="button" 
                onClick={() => document.getElementById('avatar-input')?.click()}
                disabled={saving}
                className="px-6 py-3 rounded-xl border border-primary bg-background text-[11px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-accent hover:text-white hover:border-accent disabled:opacity-50 shadow-sm"
              >
                Mudar Avatar
              </button>
              <p className="text-[10px] text-muted uppercase font-bold tracking-tight">Dimensão recomendada: 512x512px</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Nome de Exibição</label>
              <input 
                type="text" 
                value={user.nome || ''}
                onChange={e => setUser({...user, nome: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Telefone / WhatsApp</label>
              <input 
                type="tel" 
                value={user.telefone || ''}
                onChange={e => setUser({...user, telefone: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all" 
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">E-mail Principal</label>
              <input 
                type="email" 
                value={user.email || ''}
                onChange={e => setUser({...user, email: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent"></span>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Segurança da Conta</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-accent px-1">Senha Atual (Confirmação)</label>
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 text-white focus:border-accent focus:bg-accent/10 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">Nova Senha (Opcional)</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova senha secreta"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all" 
                />
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex justify-end gap-4">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-accent text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {saving ? 'Gravando Alterações...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
